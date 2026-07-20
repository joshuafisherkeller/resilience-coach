import { describe, expect, it } from "vitest";
import { buildWidgetHtml } from "../src/widget.js";

describe("support-mode widget", () => {
  const html = buildWidgetHtml("https://example.test", "demo-sharing");

  it("renders all five support choices in welcome and settings", () => {
    for (const value of [
      "two clear choices",
      "pictures and words",
      "movement break",
      "quiet pause",
      "grown-up help",
    ]) {
      expect(html.match(new RegExp(`value="${value}"`, "g"))).toHaveLength(2);
    }
    expect(html).toContain('id="apply-support-mode"');
    expect(html).toContain('id="change-support-inline"');
  });

  it("includes deterministic visual, movement, quiet, and together workspaces", () => {
    expect(html).toContain('id="picture-workspace"');
    expect(html).toContain('data-movement="shake"');
    expect(html).toContain('data-movement="march"');
    expect(html).toContain('data-pause-seconds="20"');
    expect(html).toContain('data-pause-seconds="40"');
    expect(html).toContain('id="grownup-script"');
    expect(html).toContain('id="child-script"');
    expect(html).toContain('id="rc-icon-pictures"');
  });

  it("does not emit common UTF-8 mojibake sequences", () => {
    expect(html).not.toMatch(/(?:Ã|Â|â€|â€“|â€”|â€¦|â™)/);
  });
});
