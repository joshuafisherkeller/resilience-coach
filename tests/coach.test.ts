import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Responses } from "openai/resources/responses/responses";
import { describe, expect, it } from "vitest";
import {
  ResilienceCoach,
  extractChoices,
  supportModeInstruction,
  type ModelGateway,
} from "../src/coach.js";
import { type AppConfig } from "../src/config.js";
import { MemoryProfileRepository } from "../src/repository.js";

const config: AppConfig = {
  openaiApiKey: "test-only",
  openaiModel: "gpt-5.6",
  supabaseUrl: "https://example.supabase.co",
  supabaseServiceRoleKey: "test-only",
  publicBaseUrl: "http://localhost:8787",
  port: 8787,
  host: "127.0.0.1",
  demoInMemory: true,
};

function response(value: Partial<Responses.Response>): Responses.Response {
  return value as Responses.Response;
}

class ScriptedModel implements ModelGateway {
  calls: Responses.ResponseCreateParamsNonStreaming[] = [];

  async create(
    params: Responses.ResponseCreateParamsNonStreaming,
  ): Promise<Responses.Response> {
    this.calls.push(params);
    const required =
      typeof params.tool_choice === "object" &&
      params.tool_choice.type === "function"
        ? params.tool_choice.name
        : null;
    const activeChild = "demo-sharing";
    if (required === "get_child_profile") {
      return response({
        output: [
          {
            type: "function_call",
            id: "fc_get",
            call_id: "call_get",
            name: "get_child_profile",
            arguments: JSON.stringify({ child_id: activeChild }),
            status: "completed",
          },
        ],
        output_text: "",
      });
    }
    if (required === "update_child_profile") {
      return response({
        output: [
          {
            type: "function_call",
            id: "fc_update",
            call_id: "call_update",
            name: "update_child_profile",
            arguments: JSON.stringify({
              child_id: activeChild,
              insight:
                "Practiced: one slow belly breath; Next-time plan: When sharing feels hard, I will take one slow breath; Support preference: two clear choices",
            }),
            status: "completed",
          },
        ],
        output_text: "",
      });
    }
    return response({
      output: [],
      output_text: JSON.stringify({
        message: "That can feel frustrating. What should we try?",
        choices: [
          "Take one slow breath",
          "Shake your hands out",
          "Ask a grown-up",
        ],
      }),
    });
  }
}

describe("coach route orchestration", () => {
  const prompt = readFileSync("resilience_coach_system_prompt.md", "utf8");

  it("keeps the fixed prompt byte-for-byte unchanged", () => {
    const hash = createHash("sha256").update(prompt).digest("hex");
    expect(hash).toBe(
      "78cf0d7a3f6c9a149a3e91e0105656ea5b19cec7d69ced2dcd43e9c320745f51",
    );
  });

  it("forces profile load, disables storage/cache, then saves at explicit end", async () => {
    const repository = new MemoryProfileRepository();
    const model = new ScriptedModel();
    const coach = new ResilienceCoach(repository, prompt, config, model);
    const first = await coach.reply({
      child_id: "demo-sharing",
      session_id: "session-123456",
      message: "Someone would not share with me.",
    });
    expect(first.locked).toBe(false);
    expect(first.choices).toHaveLength(3);
    expect(first.turn_count).toBe(1);
    expect(model.calls[0]?.tool_choice).toEqual({
      type: "function",
      name: "get_child_profile",
    });
    expect(model.calls.every((call) => call.store === false)).toBe(true);
    expect(
      model.calls.every(
        (call) => call.prompt_cache_options?.mode === "explicit",
      ),
    ).toBe(true);
    expect(
      model.calls.every(
        (call) => call.text?.format?.type === "json_schema",
      ),
    ).toBe(true);

    const ended = await coach.reply({
      child_id: "demo-sharing",
      session_id: "session-123456",
      message: "I am ready to stop for now.",
      end_session: true,
    });
    expect(ended.ended).toBe(true);
    expect(ended.summary).toMatchObject({
      practiced_strategies: ["one slow belly breath"],
      support_preference: "two clear choices",
      next_time_plan:
        "When sharing feels hard, I will take one slow breath",
    });
    expect((await repository.getProfile("demo-sharing"))?.session_count).toBe(1);
  });

  it("ends automatically at the six-turn practice ceiling", async () => {
    const repository = new MemoryProfileRepository();
    const model = new ScriptedModel();
    const coach = new ResilienceCoach(repository, prompt, config, model);
    let result;
    for (let turn = 1; turn <= 6; turn += 1) {
      result = await coach.reply({
        child_id: "demo-sharing",
        session_id: "session-bounded",
        message: `Practice turn ${turn}`,
      });
    }
    expect(result?.ended).toBe(true);
    expect(result?.turn_count).toBe(6);
    expect(result?.choices).toEqual([]);
    expect((await repository.getProfile("demo-sharing"))?.session_count).toBe(1);
  });

  it("keeps model tools bound to the server-selected synthetic profile", async () => {
    const repository = new MemoryProfileRepository();
    const model = new ScriptedModel();
    const coach = new ResilienceCoach(repository, prompt, config, model);

    await coach.reply({
      child_id: "demo-mistakes",
      session_id: "session-profile-binding",
      message: "I made a mistake and felt upset.",
    });
    const ended = await coach.reply({
      child_id: "demo-mistakes",
      session_id: "session-profile-binding",
      message: "I am ready to stop for now.",
      end_session: true,
    });

    expect(ended.ended).toBe(true);
    expect((await repository.getProfile("demo-mistakes"))?.session_count).toBe(1);
    expect((await repository.getProfile("demo-sharing"))?.session_count).toBe(0);

    for (const call of model.calls) {
      const tools = (call.tools ?? []) as Responses.FunctionTool[];
      for (const tool of tools) {
        const childId = (
          tool.parameters as {
            properties?: { child_id?: { enum?: string[] } };
          }
        ).properties?.child_id;
        expect(childId?.enum).toEqual(["demo-mistakes"]);
      }
    }
  });

  it("locks before any model call when deterministic safety rules match", async () => {
    const repository = new MemoryProfileRepository();
    const model = new ScriptedModel();
    const coach = new ResilienceCoach(repository, prompt, config, model);
    const result = await coach.reply({
      child_id: "demo-sharing",
      session_id: "session-safety",
      message: "Someone hit me.",
    });
    expect(result.locked).toBe(true);
    expect(model.calls).toHaveLength(0);
    expect((await repository.getProfile("demo-sharing"))?.locked).toBe(true);
  });

  it("extracts two tappable choices", () => {
    expect(
      extractChoices("Take one slow breath, or shake your hands out?"),
    ).toEqual(["Take one slow breath", "shake your hands out"]);
  });

  it("gives each support mode a concrete model contract", () => {
    expect(supportModeInstruction("two clear choices")).toContain(
      "exactly two",
    );
    expect(supportModeInstruction("pictures and words")).toContain(
      "paired with simple UI pictures",
    );
    expect(supportModeInstruction("movement break")).toContain(
      "pressing palms together",
    );
    expect(supportModeInstruction("quiet pause")).toContain(
      "never pressure the child to speak",
    );
    expect(supportModeInstruction("grown-up help")).toContain(
      "grown-up and child as a team",
    );
  });
});
