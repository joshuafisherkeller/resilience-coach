import { describe, expect, it } from "vitest";
import { detectSafetyConcern } from "../src/safety.js";

describe("deterministic safety pre-check", () => {
  it.each([
    ["I want to hurt myself", "self_harm"],
    ["Someone hit me", "physical_danger"],
    ["They touched my private parts", "abuse_or_unsafe_touch"],
    ["There is no food at home", "neglect"],
    ["I am not safe", "physical_danger"],
    ["Help me please!", "physical_danger"],
  ])("flags %s", (text, expected) => {
    expect(detectSafetyConcern(text)).toBe(expected);
  });

  it.each([
    "My block tower fell down.",
    "My feelings are hurt because my friend would not share.",
    "I made a mistake and want to try again.",
    "I am ready to stop. Please help me make one small next-time plan.",
  ])("does not flag an ordinary setback: %s", (text) => {
    expect(detectSafetyConcern(text)).toBeNull();
  });
});
