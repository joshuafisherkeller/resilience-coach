import { describe, expect, it } from "vitest";
import { MemoryProfileRepository } from "../src/repository.js";
import { CoachToolHandlers, parseInsight } from "../src/tool-handlers.js";

describe("profile tool handlers", () => {
  it("returns the exact public profile contract through publicProfile fields", async () => {
    const repository = new MemoryProfileRepository();
    const handlers = new CoachToolHandlers(repository);
    const profile = await handlers.getChildProfile("demo-sharing");
    expect(profile.recurring_struggles).toEqual(["sharing and taking turns"]);
    expect(profile.preferred_grounding_strategy).toBe("one slow belly breath");
    expect(profile.session_count).toBe(0);
  });

  it("parses conservative insight phrases and retains at most five", async () => {
    const repository = new MemoryProfileRepository();
    const handlers = new CoachToolHandlers(repository);
    for (let index = 0; index < 6; index += 1) {
      await handlers.updateChildProfile(
        "demo-sharing",
        `Struggles with waiting for a turn; responded well to counting breaths ${index}`,
      );
    }
    const profile = await handlers.getChildProfile("demo-sharing");
    expect(profile.session_count).toBe(6);
    expect(profile.recurring_struggles).toContain("waiting for a turn");
    expect(profile.preferred_grounding_strategy).toBe("counting breaths 5");
    expect(repository.getInsightCount("demo-sharing")).toBe(5);
  });

  it("rejects clinical labels", () => {
    expect(() => parseInsight("Diagnosed with ADHD")).toThrow(
      /non-clinical/i,
    );
  });

  it("extracts a neutral practice summary without changing the public tool contract", async () => {
    const repository = new MemoryProfileRepository();
    const handlers = new CoachToolHandlers(repository);
    await handlers.updateChildProfile(
      "demo-mistakes",
      "Practiced: shake hands out, one smaller step; Next-time plan: When a mistake feels hard, I will try one smaller step; Support preference: pictures and words",
    );
    const profile = await handlers.getChildProfile("demo-mistakes");
    expect(profile.practiced_strategies).toEqual([
      "shake hands out",
      "one smaller step",
    ]);
    expect(profile.support_preference).toBe("pictures and words");
    expect(profile.last_next_time_plan).toBe(
      "When a mistake feels hard, I will try one smaller step",
    );
  });

  it("keeps summary fields separate when a model omits semicolons", () => {
    const parsed = parseInsight(
      "Practiced: asking for a turn with one short sentence. Next-time plan: When waiting feels hard, I will ask for a turn. Support preference: pictures and words",
    );
    expect(parsed.practicedStrategies).toEqual([
      "asking for a turn with one short sentence",
    ]);
    expect(parsed.nextTimePlan).toBe(
      "When waiting feels hard, I will ask for a turn",
    );
    expect(parsed.supportPreference).toBe("pictures and words");
  });

  it("locks the profile and prevents later updates", async () => {
    const repository = new MemoryProfileRepository();
    const handlers = new CoachToolHandlers(repository);
    await handlers.triggerSafetyHandoff(
      "demo-change",
      "2026-07-18T22:30:00Z",
    );
    const profile = await handlers.getChildProfile("demo-change");
    expect(profile.locked).toBe(true);
    await expect(
      handlers.updateChildProfile("demo-change", "Struggles with a change"),
    ).rejects.toThrow("child_profile_locked");
  });
});
