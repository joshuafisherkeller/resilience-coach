import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CoachToolHandlers, publicProfile } from "./tool-handlers.js";
import type { ProfileRepository } from "./types.js";
import { buildWidgetHtml } from "./widget.js";

export const WIDGET_URI = "ui://resilience-coach/coach.html";

const childIdDescription =
  "Synthetic demo profile ID, such as demo-sharing, demo-mistakes, or demo-change.";

function widgetMeta(
  childId: string,
  locked: boolean,
  lockedAt: string | null,
  serverOrigin: string,
): Record<string, unknown> {
  return {
    resilienceCoach: {
      child_id: childId,
      locked,
      locked_at: lockedAt,
      server_origin: serverOrigin,
      data_classification: "synthetic_demo_only",
    },
  };
}

export function createResilienceMcpServer(
  repository: ProfileRepository,
  serverOrigin: string,
): McpServer {
  const handlers = new CoachToolHandlers(repository);
  const server = new McpServer(
    { name: "resilience-coach", version: "0.1.0" },
    {
      instructions:
        "Use synthetic demo profiles only. At the start of a child practice session, call get_child_profile once. At the end, call update_child_profile once with a brief non-clinical insight. If any physical danger, abuse, neglect, or self-harm appears, immediately call trigger_safety_handoff and stop the conversation. Never put raw crisis text in tool arguments or stored data.",
    },
  );

  const resourceMeta = {
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: [new URL(serverOrigin).origin],
        resourceDomains: [],
        frameDomains: [],
      },
    },
  };

  registerAppResource(
    server,
    "Resilience Coach child practice widget",
    WIDGET_URI,
    {
      description:
        "Warm, high-contrast practice UI with large choices and a locked safety screen.",
      _meta: resourceMeta,
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: buildWidgetHtml(serverOrigin),
          _meta: resourceMeta,
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "get_child_profile",
    {
      title: "Get synthetic child profile",
      description:
        "Load a synthetic Resilience Coach demo profile once at session start. Returns recurring struggles, a preferred grounding strategy, and the completed session count.",
      inputSchema: {
        child_id: z.string().describe(childIdDescription),
      },
      outputSchema: {
        recurring_struggles: z.array(z.string()),
        preferred_grounding_strategy: z.string().nullable(),
        session_count: z.number().int().nonnegative(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Remembering what helps...",
        "openai/toolInvocation/invoked": "Ready to practice",
      },
    },
    async ({ child_id }) => {
      const profile = await handlers.getChildProfile(child_id);
      const output = publicProfile(profile);
      return {
        structuredContent: output,
        content: [
          {
            type: "text",
            text: `Loaded synthetic profile ${profile.child_id}.`,
          },
        ],
        _meta: widgetMeta(
          profile.child_id,
          profile.locked,
          profile.locked_at,
          serverOrigin,
        ),
      };
    },
  );

  registerAppTool(
    server,
    "update_child_profile",
    {
      title: "Save a brief practice insight",
      description:
        "At session end, save one short, non-clinical insight to the synthetic demo profile. The server merges simple patterns, increments session_count, and retains at most five insight rows.",
      inputSchema: {
        child_id: z.string().describe(childIdDescription),
        insight: z
          .string()
          .min(1)
          .max(300)
          .describe(
            'Brief and non-clinical, for example: "Struggles with sharing; responded well to breathing exercises".',
          ),
      },
      outputSchema: {
        status: z.literal("saved"),
        session_count: z.number().int().nonnegative(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Saving what helped...",
        "openai/toolInvocation/invoked": "Practice saved",
      },
    },
    async ({ child_id, insight }) => {
      const profile = await handlers.updateChildProfile(child_id, insight);
      return {
        structuredContent: {
          status: "saved" as const,
          session_count: profile.session_count,
        },
        content: [{ type: "text", text: "Saved one brief synthetic insight." }],
        _meta: widgetMeta(
          profile.child_id,
          profile.locked,
          profile.locked_at,
          serverOrigin,
        ),
      };
    },
  );

  registerAppTool(
    server,
    "trigger_safety_handoff",
    {
      title: "Trigger safety handoff",
      description:
        "Immediately record a simulated adult alert and lock the synthetic child profile when there is any sign of physical danger, abuse, neglect, or self-harm. Do not include crisis details.",
      inputSchema: {
        child_id: z.string().describe(childIdDescription),
        timestamp: z
          .string()
          .describe("Current ISO 8601 timestamp with a timezone offset."),
      },
      outputSchema: {
        status: z.literal("logged"),
        locked: z.literal(true),
        recorded_at: z.string(),
      },
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: WIDGET_URI, visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Finding a grown-up...",
        "openai/toolInvocation/invoked": "Adult handoff recorded",
      },
    },
    async ({ child_id, timestamp }) => {
      const handoff = await handlers.triggerSafetyHandoff(child_id, timestamp);
      return {
        structuredContent: {
          status: "logged" as const,
          locked: true as const,
          recorded_at: handoff.recorded_at,
        },
        content: [
          {
            type: "text",
            text: "The synthetic demo profile is locked and a simulated adult alert was logged.",
          },
        ],
        _meta: widgetMeta(
          handoff.child_id,
          true,
          handoff.recorded_at,
          serverOrigin,
        ),
      };
    },
  );

  return server;
}
