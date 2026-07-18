import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createResilienceMcpServer } from "../src/mcp.js";
import { MemoryProfileRepository } from "../src/repository.js";

describe("MCP surface", () => {
  const repository = new MemoryProfileRepository();
  const server = createResilienceMcpServer(repository, "https://demo.example.com");
  const client = new Client({ name: "test-client", version: "1.0.0" });

  beforeEach(async () => {
    await repository.resetSyntheticDemo();
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  afterEach(async () => {
    await client.close();
    await server.close();
  });

  it("exposes exactly the three approved tools", async () => {
    const result = await client.listTools();
    expect(result.tools.map((tool) => tool.name).sort()).toEqual([
      "get_child_profile",
      "trigger_safety_handoff",
      "update_child_profile",
    ]);
  });

  it("keeps widget lock metadata outside the get profile structured contract", async () => {
    const result = await client.callTool({
      name: "get_child_profile",
      arguments: { child_id: "demo-sharing" },
    });
    expect(result.structuredContent).toEqual({
      recurring_struggles: ["sharing and taking turns"],
      preferred_grounding_strategy: "one slow belly breath",
      session_count: 0,
    });
    expect(result._meta?.resilienceCoach).toMatchObject({
      child_id: "demo-sharing",
      locked: false,
    });
  });

  it("records a safety handoff and returns the locked widget state", async () => {
    const result = await client.callTool({
      name: "trigger_safety_handoff",
      arguments: {
        child_id: "demo-mistakes",
        timestamp: "2026-07-18T22:30:00Z",
      },
    });
    expect(result.structuredContent).toMatchObject({
      status: "logged",
      locked: true,
    });
    const profile = await repository.getProfile("demo-mistakes");
    expect(profile?.locked).toBe(true);
  });

  it("serves the MCP Apps widget MIME type", async () => {
    const result = await client.readResource({
      uri: "ui://resilience-coach/coach.html",
    });
    expect(result.contents[0]?.mimeType).toBe("text/html;profile=mcp-app");
    const content = result.contents[0];
    expect(content && "text" in content ? content.text : "").toContain(
      "Resilience Coach",
    );
  });
});
