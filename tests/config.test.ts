import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";

describe("deployment configuration", () => {
  it("uses the Vercel deployment host when no explicit public URL is set", () => {
    const config = loadConfig({
      VERCEL_URL: "resilience-coach-preview.vercel.app",
    });
    expect(config.publicBaseUrl).toBe(
      "https://resilience-coach-preview.vercel.app",
    );
  });

  it("prefers an explicit production URL and removes its trailing slash", () => {
    const config = loadConfig({
      VERCEL_URL: "resilience-coach-preview.vercel.app",
      PUBLIC_BASE_URL: "https://coach.example.com/",
    });
    expect(config.publicBaseUrl).toBe("https://coach.example.com");
  });
});
