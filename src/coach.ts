import { OpenAI } from "openai";
import type { Responses } from "openai/resources/responses/responses";
import { z } from "zod";
import type { AppConfig } from "./config.js";
import { detectSafetyConcern } from "./safety.js";
import {
  CoachToolHandlers,
  childIdSchema,
  practiceSummary,
  publicProfile,
} from "./tool-handlers.js";
import type {
  ChildProfileRecord,
  PracticeSummary,
  ProfileRepository,
} from "./types.js";

export const MAX_CHILD_TURNS = 6;
const SAFETY_HANDOFF_MESSAGE =
  "Thank you for telling me. This is important, and it is not your fault. Let's find a safe grown-up now.";

const supportPreferenceSchema = z.enum([
  "two clear choices",
  "pictures and words",
  "movement break",
  "quiet pause",
  "grown-up help",
]);

const coachRequestSchema = z.object({
  child_id: childIdSchema,
  session_id: z.string().min(8).max(100),
  message: z
    .string()
    .transform((value) => value.normalize("NFKC").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1).max(300)),
  end_session: z.boolean().optional().default(false),
  support_preference: supportPreferenceSchema
    .optional()
    .default("two clear choices"),
});

export type CoachRequest = z.input<typeof coachRequestSchema>;

export type CoachReply = {
  message: string;
  choices: string[];
  locked: boolean;
  ended: boolean;
  turn_count: number;
  session_limit: number;
  summary?: PracticeSummary;
};

type SessionState = {
  childId: string;
  profile: ChildProfileRecord;
  profileLoadedByModel: boolean;
  messages: Responses.EasyInputMessage[];
  turnCount: number;
  touchedAt: number;
};

export interface ModelGateway {
  create(
    params: Responses.ResponseCreateParamsNonStreaming,
  ): Promise<Responses.Response>;
}

export class OpenAIModelGateway implements ModelGateway {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async create(
    params: Responses.ResponseCreateParamsNonStreaming,
  ): Promise<Responses.Response> {
    return this.client.responses.create(params);
  }
}

export class CoachSetupError extends Error {}

const modelTools: Responses.FunctionTool[] = [
  {
    type: "function",
    name: "get_child_profile",
    description:
      "Load the active synthetic child's profile once at the start of the practice session.",
    strict: true,
    parameters: {
      type: "object",
      properties: { child_id: { type: "string" } },
      required: ["child_id"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "update_child_profile",
    description:
      "At session end, save one neutral, non-clinical practice summary. Prefer: Practiced: ...; Next-time plan: When ..., I will ...; Support preference: ...",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        child_id: { type: "string" },
        insight: { type: "string", minLength: 1, maxLength: 300 },
      },
      required: ["child_id", "insight"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "trigger_safety_handoff",
    description:
      "Immediately lock the screen and record a simulated adult alert for any sign of danger, abuse, neglect, or self-harm. Do not include crisis details.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        child_id: { type: "string" },
        timestamp: { type: "string", format: "date-time" },
      },
      required: ["child_id", "timestamp"],
      additionalProperties: false,
    },
  },
];

function sanitizeChildText(value: string): string {
  let text = value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/[{}[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || /^\s*"?\w+"?\s*:/.test(text)) {
    return "We can pause and try again with a grown-up.";
  }

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [text];
  text = sentences.slice(0, 2).join(" ").trim();
  return text.slice(0, 360);
}

function choiceLabel(value: string): string {
  return value
    .replace(/^(?:let(?:'s| us)|would you like to|do you want to)\s+/i, "")
    .replace(/^(?:try|choose)\s+/i, "")
    .replace(/[,;:]+$/g, "")
    .trim();
}

export function extractChoices(text: string): string[] {
  const match = text.match(
    /(?:^|[.!?]\s+)([^.!?]{2,90}?)\s*,?\s+or\s+([^.!?]{2,90})(?:[.!?]|$)/i,
  );
  if (!match) return [];
  const choices = [choiceLabel(match[1]), choiceLabel(match[2])]
    .filter((choice) => choice.length >= 2)
    .map((choice) => choice.slice(0, 80));
  return choices.length === 2 ? choices : [];
}

const coachTurnSchema = z.object({
  message: z.string().min(1).max(360),
  choices: z.array(z.string().min(1).max(80)).max(3),
});

const coachTextFormat = {
  type: "json_schema" as const,
  name: "resilience_coach_turn",
  strict: true,
  schema: {
    type: "object",
    properties: {
      message: { type: "string", minLength: 1, maxLength: 360 },
      choices: {
        type: "array",
        items: { type: "string", minLength: 1, maxLength: 80 },
        maxItems: 3,
      },
    },
    required: ["message", "choices"],
    additionalProperties: false,
  },
};

function sanitizeChoice(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[*_`~{}[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function parseCoachTurn(value: string): {
  message: string;
  choices: string[];
} {
  try {
    const parsed = coachTurnSchema.parse(JSON.parse(value));
    return {
      message: sanitizeChildText(parsed.message),
      choices: Array.from(
        new Set(parsed.choices.map(sanitizeChoice).filter(Boolean)),
      ).slice(0, 3),
    };
  } catch {
    const message = sanitizeChildText(value);
    return { message, choices: extractChoices(message) };
  }
}

function functionCalls(
  response: Responses.Response,
): Responses.ResponseFunctionToolCall[] {
  return response.output.filter(
    (item): item is Responses.ResponseFunctionToolCall =>
      item.type === "function_call",
  );
}

function parseArguments(call: Responses.ResponseFunctionToolCall): {
  child_id?: string;
  insight?: string;
  timestamp?: string;
} {
  try {
    const value = JSON.parse(call.arguments);
    return value && typeof value === "object" ? value : {};
  } catch {
    throw new Error(`Invalid arguments for ${call.name}`);
  }
}

export class ResilienceCoach {
  private readonly handlers: CoachToolHandlers;
  private readonly sessions = new Map<string, SessionState>();
  private readonly model: ModelGateway | null;

  constructor(
    repository: ProfileRepository,
    private readonly systemPrompt: string,
    private readonly config: AppConfig,
    model?: ModelGateway,
  ) {
    this.handlers = new CoachToolHandlers(repository);
    this.model =
      model ??
      (config.openaiApiKey
        ? new OpenAIModelGateway(config.openaiApiKey)
        : null);
  }

  private pruneSessions(): void {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [sessionId, session] of this.sessions) {
      if (session.touchedAt < cutoff) this.sessions.delete(sessionId);
    }
  }

  private async sessionFor(
    sessionId: string,
    childId: string,
    profile: ChildProfileRecord,
  ): Promise<SessionState> {
    const existing = this.sessions.get(sessionId);
    if (existing && existing.childId !== childId) {
      throw new Error("A session cannot switch synthetic profiles");
    }
    if (existing) {
      existing.profile = profile;
      existing.touchedAt = Date.now();
      return existing;
    }
    const created: SessionState = {
      childId,
      profile,
      profileLoadedByModel: false,
      messages: [],
      turnCount: 0,
      touchedAt: Date.now(),
    };
    this.sessions.set(sessionId, created);
    return created;
  }

  private async runTool(
    call: Responses.ResponseFunctionToolCall,
    session: SessionState,
  ): Promise<{ output: unknown; safetyTriggered: boolean }> {
    const args = parseArguments(call);
    if (args.child_id !== session.childId) {
      throw new Error("Tool child_id does not match the active synthetic profile");
    }

    if (call.name === "get_child_profile") {
      session.profile = await this.handlers.getChildProfile(session.childId);
      session.profileLoadedByModel = true;
      return { output: publicProfile(session.profile), safetyTriggered: false };
    }

    if (call.name === "update_child_profile") {
      session.profile = await this.handlers.updateChildProfile(
        session.childId,
        String(args.insight ?? ""),
      );
      return {
        output: { status: "saved", session_count: session.profile.session_count },
        safetyTriggered: false,
      };
    }

    if (call.name === "trigger_safety_handoff") {
      const handoff = await this.handlers.triggerSafetyHandoff(
        session.childId,
        String(args.timestamp ?? new Date().toISOString()),
      );
      session.profile = {
        ...session.profile,
        locked: true,
        locked_at: handoff.recorded_at,
      };
      return {
        output: {
          status: "logged",
          locked: true,
          recorded_at: handoff.recorded_at,
        },
        safetyTriggered: true,
      };
    }

    throw new Error(`Unknown model tool: ${call.name}`);
  }

  async reply(rawRequest: CoachRequest): Promise<CoachReply> {
    this.pruneSessions();
    const request = coachRequestSchema.parse(rawRequest);
    const profile = await this.handlers.getChildProfile(request.child_id);

    if (profile.locked) {
      return {
        message: SAFETY_HANDOFF_MESSAGE,
        choices: [],
        locked: true,
        ended: true,
        turn_count: 0,
        session_limit: MAX_CHILD_TURNS,
      };
    }

    const safetyConcern = detectSafetyConcern(request.message);
    if (safetyConcern) {
      await this.handlers.triggerSafetyHandoff(
        request.child_id,
        new Date().toISOString(),
      );
      this.sessions.delete(request.session_id);
      return {
        message: SAFETY_HANDOFF_MESSAGE,
        choices: [],
        locked: true,
        ended: true,
        turn_count: 0,
        session_limit: MAX_CHILD_TURNS,
      };
    }

    if (!this.model) {
      throw new CoachSetupError(
        "OPENAI_API_KEY is required for the GPT-5.6 coach route",
      );
    }

    const session = await this.sessionFor(
      request.session_id,
      request.child_id,
      profile,
    );
    session.turnCount += 1;
    const shouldEnd =
      request.end_session || session.turnCount >= MAX_CHILD_TURNS;
    const forcedTools: string[] = [];
    if (!session.profileLoadedByModel) forcedTools.push("get_child_profile");
    if (shouldEnd) forcedTools.push("update_child_profile");

    const profileContext = session.profileLoadedByModel
      ? `The active synthetic profile was loaded at session start. Starter contexts: ${session.profile.recurring_struggles.join(", ") || "none"}. Previously helpful grounding strategy: ${session.profile.preferred_grounding_strategy ?? "none"}. Skills practiced: ${session.profile.practiced_strategies.join(", ") || "none yet"}. Last next-time plan: ${session.profile.last_next_time_plan ?? "none yet"}. Do not announce this memory or repeat the profile ID to the child.`
      : `The active synthetic child_id is ${session.childId}. Call get_child_profile before coaching. Server-side bounded practice memory: skills practiced ${session.profile.practiced_strategies.join(", ") || "none yet"}; support preference ${session.profile.support_preference ?? "none yet"}; last next-time plan ${session.profile.last_next_time_plan ?? "none yet"}. Do not repeat the profile ID or announce this memory to the child.`;
    const turnContext = `This is child turn ${session.turnCount} of at most ${MAX_CHILD_TURNS}. The child's selected support preference is ${request.support_preference}. ${shouldEnd ? "Close the practice now, make one short if-then next-time plan, call update_child_profile, and return a warm ending with no choices." : "Continue one step of Notice, Name, Choose, Try, Check, Switch or Share. Offer two or three UI choices when a choice would help."}`;

    const input: Responses.ResponseInputItem[] = [
      { role: "developer", content: `${profileContext}\n${turnContext}` },
      ...session.messages,
      { role: "user", content: request.message },
    ];

    let finalText = "";
    for (let round = 0; round < 6; round += 1) {
      const requiredTool = forcedTools[0];
      const response = await this.model.create({
        model: this.config.openaiModel,
        instructions: this.systemPrompt,
        input,
        tools: modelTools,
        tool_choice: requiredTool
          ? { type: "function", name: requiredTool }
          : "auto",
        parallel_tool_calls: false,
        max_output_tokens: 350,
        reasoning: { effort: "low" },
        text: { format: coachTextFormat, verbosity: "low" },
        store: false,
        prompt_cache_options: { mode: "explicit" },
        include: ["reasoning.encrypted_content"],
        safety_identifier: `synthetic-demo-${session.childId}`,
      });

      const calls = functionCalls(response);
      input.push(
        ...(response.output as unknown as Responses.ResponseInputItem[]),
      );

      if (calls.length === 0) {
        if (requiredTool) {
          throw new Error(`Model did not call required tool ${requiredTool}`);
        }
        finalText = response.output_text;
        break;
      }

      for (const call of calls) {
        const result = await this.runTool(call, session);
        if (call.name === forcedTools[0]) forcedTools.shift();
        input.push({
          type: "function_call_output",
          call_id: call.call_id,
          output: JSON.stringify(result.output),
        });
        if (result.safetyTriggered) {
          this.sessions.delete(request.session_id);
          return {
            message: SAFETY_HANDOFF_MESSAGE,
            choices: [],
            locked: true,
            ended: true,
            turn_count: session.turnCount,
            session_limit: MAX_CHILD_TURNS,
          };
        }
      }
    }

    const turn = parseCoachTurn(finalText);
    const message = turn.message;
    session.messages.push(
      { role: "user", content: request.message },
      { role: "assistant", content: message, phase: "final_answer" },
    );
    session.messages = session.messages.slice(-16);
    session.touchedAt = Date.now();

    if (shouldEnd) this.sessions.delete(request.session_id);
    return {
      message,
      choices: shouldEnd ? [] : turn.choices,
      locked: false,
      ended: shouldEnd,
      turn_count: session.turnCount,
      session_limit: MAX_CHILD_TURNS,
      ...(shouldEnd ? { summary: practiceSummary(session.profile) } : {}),
    };
  }
}
