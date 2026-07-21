import { describe, expect, it } from "vitest";
import { buildWidgetHtml } from "../src/widget.js";

describe("dual-path guided practice widget", () => {
  const html = buildWidgetHtml("https://example.test", "demo-sharing");

  it("offers picture and conversation practices as two clear entrances", () => {
    expect(html).toContain("Hard moments happen. We can practice what to try.");
    expect(html).toContain('id="begin-picture-button"');
    expect(html).toContain('id="begin-words-button"');
    expect(html).toContain("Picture Story");
    expect(html).toContain("Talk It Through");
    expect(html).toContain("Look, point, and choose");
    expect(html).toContain("Type or tap together");
    expect(html).not.toContain('id="begin-button"');
  });

  it("keeps three distinct illustrated situation cards", () => {
    expect(html).toContain('data-scenario="sharing"');
    expect(html).toContain('data-scenario="mistakes"');
    expect(html).toContain('data-scenario="change"');
    expect(html).toContain("Sharing and waiting");
    expect(html).toContain("Making a mistake");
    expect(html).toContain("A change of plans");
  });

  it("renders a bounded type-or-tap conversation with useful exits", () => {
    expect(html).toContain('id="conversation-panel"');
    expect(html).toContain('id="conversation-form"');
    expect(html).toContain('id="word-response-choices"');
    expect(html).toContain('data-word-starter="sharing"');
    expect(html).toContain('data-word-starter="mistakes"');
    expect(html).toContain('data-word-starter="change"');
    expect(html).toContain("I don't know yet");
    expect(html).toContain("I don't understand");
    expect(html).toContain("Stop and make my plan");
    expect(html).toContain("Step 1 of 6");
  });

  it("uses real web illustrations across story, practice, and completion", () => {
    expect(html).toContain(
      "https://example.test/assets/brand/welcome-practice-together.webp",
    );
    expect(html).toContain(
      "https://example.test/assets/scenarios/sharing/card-sharing-and-waiting.webp",
    );
    expect(html).toContain(
      "https://example.test/assets/completion/practice-finished.webp",
    );
    expect(html).toContain('id="story-panel"');
    expect(html).toContain('id="activity-stage"');
    expect(html).toContain('id="plan-card"');
  });

  it("keeps supports contextual instead of presenting five equivalent modes", () => {
    expect(html).toContain('id="grown-up-help"');
    expect(html).toContain('id="read-aloud-toggle"');
    expect(html).toContain('id="reduce-motion-toggle"');
    expect(html).not.toContain('name="support-welcome"');
    expect(html).not.toContain('id="picture-workspace"');
  });

  it("keeps the contextual free-text path and transcript-free adult summary", () => {
    expect(html).toContain('id="own-words-form"');
    expect(html).toContain("Want to use your own words?");
    expect(html).toContain("Switch and tell the coach");
    expect(html).toContain("where the coach will answer what you type");
    expect(html).toContain("Do not type names or private information.");
    expect(html).toContain("No transcript is shown or saved.");
    expect(html).toContain("No conversation transcript is saved.");
  });

  it("keeps the child-facing completion focused on the current plan", () => {
    expect(html).toContain('id="plan-text"');
    expect(html).toContain('id="plan-strategies"');
    expect(html).toContain("A plan is an idea, not a rule.");
  });

  it("does not emit common UTF-8 mojibake sequences", () => {
    expect(html).not.toMatch(
      /(?:Ãƒ|Ã‚|Ã¢â‚¬|Ã¢â‚¬â€œ|Ã¢â‚¬â€|Ã¢â‚¬Â¦|Ã¢â„¢)/,
    );
  });
});
