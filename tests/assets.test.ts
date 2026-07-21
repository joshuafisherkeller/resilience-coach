import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

type AssetRecord = {
  id: string;
  category: string;
  source_path: string;
  web_path: string;
  width: number;
  height: number;
  concise_alt_text: string;
  sha256: string;
};

const assetRoot = resolve(process.cwd(), "assets");
const manifest = JSON.parse(
  readFileSync(resolve(assetRoot, "manifest.json"), "utf8"),
) as { assets: AssetRecord[] };

describe("illustration package", () => {
  it("contains the complete documented production library", () => {
    expect(manifest.assets).toHaveLength(52);
    expect(new Set(manifest.assets.map((asset) => asset.id)).size).toBe(52);

    for (const category of [
      "brand",
      "body-cues",
      "emotions",
      "strategies",
      "scenario",
      "grown-up",
      "completion",
    ]) {
      expect(manifest.assets.some((asset) => asset.category === category)).toBe(
        true,
      );
    }
    for (const scenario of ["sharing", "mistakes", "change"]) {
      expect(
        manifest.assets.filter((asset) =>
          asset.web_path.includes(`/scenarios/${scenario}/`),
        ).length,
      ).toBe(6);
    }
  });

  it(
    "keeps every source, optimized derivative, hash, and alt text valid",
    () => {
      for (const asset of manifest.assets) {
        const sourcePath = resolve(assetRoot, asset.source_path);
        const webPath = resolve(assetRoot, asset.web_path);
        expect(existsSync(sourcePath), asset.source_path).toBe(true);
        expect(existsSync(webPath), asset.web_path).toBe(true);
        expect(asset.width).toBeGreaterThan(0);
        expect(asset.height).toBeGreaterThan(0);
        expect(asset.concise_alt_text.trim().length).toBeGreaterThan(10);
        expect(statSync(webPath).size, asset.web_path).toBeLessThanOrEqual(
          250 * 1024,
        );
        const hash = createHash("sha256")
          .update(readFileSync(webPath))
          .digest("hex");
        expect(hash, asset.web_path).toBe(asset.sha256);
      }
    },
    20_000,
  );
});
