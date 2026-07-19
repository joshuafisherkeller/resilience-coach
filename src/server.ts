import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ResilienceCoach, CoachSetupError } from "./coach.js";
import { loadConfig, type AppConfig } from "./config.js";
import { createResilienceMcpServer } from "./mcp.js";
import { createRepository } from "./repository.js";
import { childIdSchema } from "./tool-handlers.js";
import type { ProfileRepository } from "./types.js";
import { buildWidgetHtml } from "./widget.js";

const coachPromptPath = resolve(
  process.cwd(),
  "resilience_coach_system_prompt.md",
);
const requestBuckets = new Map<string, number[]>();

function rateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const cutoff = Date.now() - 60_000;
  const recent = (requestBuckets.get(key) ?? []).filter(
    (timestamp) => timestamp > cutoff,
  );
  if (recent.length >= 30) {
    res.status(429).json({ error: "Please wait a moment before trying again." });
    return;
  }
  recent.push(Date.now());
  requestBuckets.set(key, recent);
  next();
}

function isAllowedWidgetOrigin(origin: string, publicBaseUrl: string): boolean {
  try {
    const url = new URL(origin);
    const configured = new URL(publicBaseUrl);
    return (
      url.origin === configured.origin ||
      (url.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(url.hostname)) ||
      (url.protocol === "https:" &&
        (url.hostname === "chatgpt.com" ||
          url.hostname.endsWith(".chatgpt.com") ||
          url.hostname.endsWith(".oaiusercontent.com") ||
          url.hostname.endsWith(".oaistatic.com")))
    );
  } catch {
    return false;
  }
}

function widgetCors(config: AppConfig) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.header("origin");
    if (origin && isAllowedWidgetOrigin(origin, config.publicBaseUrl)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Headers", "content-type");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    }
    if (req.method === "OPTIONS") {
      res.sendStatus(
        origin && isAllowedWidgetOrigin(origin, config.publicBaseUrl) ? 204 : 403,
      );
      return;
    }
    next();
  };
}

function safeTokenMatch(received: string | undefined, expected: string): boolean {
  if (!received) return false;
  const supplied = Buffer.from(received);
  const configured = Buffer.from(expected);
  return (
    supplied.length === configured.length && timingSafeEqual(supplied, configured)
  );
}

function landingPage(publicBaseUrl: string): string {
  const origin = publicBaseUrl.replace(/"/g, "&quot;");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resilience Coach &middot; Demo</title>
<style>body{margin:0;background:#fffaf0;color:#172a27;font:18px/1.55 system-ui,sans-serif}main{width:min(760px,calc(100% - 36px));margin:48px auto}h1{font-size:clamp(38px,8vw,66px);line-height:1.05;margin-bottom:12px}.note{padding:16px;border:2px solid #8f6d1e;border-radius:14px;background:#fff3cf}.profiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin:28px 0}.profiles a{display:block;padding:20px;border-radius:16px;background:#1c6e63;color:white;font-weight:800;text-decoration:none;box-shadow:0 4px 0 #124a43}.small{font-size:15px;color:#49645f}code{font-size:15px}</style></head>
<body><main><p class="small">OPENAI BUILD WEEK 2026 &middot; EDUCATION</p><h1>Resilience Coach</h1>
<p>A short social-emotional learning practice companion for ages 6&ndash;8, designed for use with an adult nearby.</p>
<div class="note"><strong>Synthetic demo only.</strong> No real children&rsquo;s names, accounts, or personal data belong in this app. This is a practice aid, not therapy or emergency support.</div>
<div class="profiles"><a href="${origin}/demo/demo-sharing">Sharing demo</a><a href="${origin}/demo/demo-mistakes">Mistakes demo</a><a href="${origin}/demo/demo-change">Change demo</a></div>
<p class="small">MCP endpoint: <code>${origin}/mcp</code> &middot; Health: <code>${origin}/health</code></p></main></body></html>`;
}

export function createServerApp(
  config: AppConfig,
  repository: ProfileRepository,
  coach: ResilienceCoach,
) {
  const allowedHosts = Array.from(
    new Set([
      new URL(config.publicBaseUrl).hostname,
      "localhost",
      "127.0.0.1",
      "[::1]",
    ]),
  );
  const app = createMcpExpressApp({ host: config.host, allowedHosts });

  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    next();
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "resilience-coach",
      model: config.openaiModel,
      model_configured: Boolean(config.openaiApiKey),
      storage: config.demoInMemory ? "memory-test-mode" : "supabase",
      data: "synthetic_demo_only",
    });
  });

  app.get("/", (_req, res) => {
    res.type("html").send(landingPage(config.publicBaseUrl));
  });

  app.get("/demo/:childId", (req, res) => {
    const childId = childIdSchema.safeParse(req.params.childId);
    if (!childId.success) {
      res.status(404).send("Unknown synthetic demo profile");
      return;
    }
    res
      .setHeader(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src 'none'; base-uri 'none'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com",
      )
      .type("html")
      .send(buildWidgetHtml(config.publicBaseUrl, childId.data));
  });

  app.use("/coach", widgetCors(config), rateLimit);
  app.post("/coach", async (req, res) => {
    try {
      const reply = await coach.reply(req.body);
      res.json(reply);
    } catch (error) {
      if (error instanceof CoachSetupError) {
        res.status(503).json({
          error: "A grown-up needs to finish the model setup.",
          locked: false,
        });
        return;
      }
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "That message could not be used." });
        return;
      }
      console.error("Coach route failed", error);
      res.status(500).json({ error: "The coach is taking a short pause." });
    }
  });

  app.post("/admin/reset-demo", async (req, res) => {
    if (!config.demoAdminToken) {
      res.sendStatus(404);
      return;
    }
    const token = req.header("authorization")?.replace(/^Bearer\s+/i, "");
    if (!safeTokenMatch(token, config.demoAdminToken)) {
      res.sendStatus(401);
      return;
    }
    await repository.resetSyntheticDemo();
    res.json({ status: "reset", data: "synthetic_demo_only" });
  });

  app.post("/mcp", async (req, res) => {
    const mcpServer = createResilienceMcpServer(
      repository,
      config.publicBaseUrl,
    );
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request failed", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal MCP server error" },
          id: null,
        });
      }
    } finally {
      res.on("close", () => {
        void transport.close();
        void mcpServer.close();
      });
    }
  });

  for (const method of ["get", "delete"] as const) {
    app[method]("/mcp", (_req: Request, res: Response) => {
      res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed" },
        id: null,
      });
    });
  }

  return app;
}

export function createConfiguredServer(config = loadConfig()) {
  const repository = createRepository(config);
  const systemPrompt = readFileSync(coachPromptPath, "utf8");
  const coach = new ResilienceCoach(repository, systemPrompt, config);
  return createServerApp(config, repository, coach);
}

const configuredApp = createConfiguredServer();

export default configuredApp;

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).toLowerCase() ===
    resolve(process.argv[1]).toLowerCase();

if (isMain) {
  const config = loadConfig();
  configuredApp.listen(config.port, config.host, () => {
    console.log(
      `Resilience Coach listening at ${config.publicBaseUrl} (MCP: /mcp)`,
    );
  });
}
