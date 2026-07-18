import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Responses } from "openai/resources/responses/responses";
import { describe, expect, it } from "vitest";
import {
  ResilienceCoach,
  extractChoices,
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
                "Struggles with sharing; responded well to one slow belly breath",
            }),
            status: "completed",
          },
        ],
        output_text: "",
      });
    }
    return response({
      output: [],
      output_text:
        "That can feel frustrating. Take one slow breath, or shake your hands out?",
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
    expect(first.choices).toHaveLength(2);
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

    const ended = await coach.reply({
      child_id: "demo-sharing",
      session_id: "session-123456",
      message: "I am ready to stop for now.",
      end_session: true,
    });
    expect(ended.ended).toBe(true);
    expect((await repository.getProfile("demo-sharing"))?.session_count).toBe(1);
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
});
