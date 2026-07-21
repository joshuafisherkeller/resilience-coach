import { describe, expect, it } from "vitest";
import { buildWidgetHtml } from "../src/widget.js";

describe("picture-led guided practice widget", () => {
  const html = buildWidgetHtml("https://example.test", "demo-sharing");

  it("renders a warm illustrated welcome and three distinct situation cards", () => {
    expect(html).toContain("Hard moments happen. We can practice what to try.");
    expect(html).toContain('data-scenario="sharing"');
    expect(html).toContain('data-scenario="mistakes"');
    expect(html).toContain('data-scenario="change"');
    expect(html).toContain("Sharing and waiting");
    expect(html).toContain("Making a mistake");
    expect(html).toContain("A change of plans");
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

  it("keeps the free-text safety path and transcript-free adult summary", () => {
    expect(html).toContain('id="own-words-form"');
    expect(html).toContain("Do not type names or private information.");
    expect(html).toContain("No transcript is shown or saved.");
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
