import { timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { static as expressStatic } from "express";
import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { ResilienceCoach, CoachSetupError } from "./coach.js";
import { loadConfig, type AppConfig } from "./config.js";
import { createResilienceMcpServer } from "./mcp.js";
import { createRepository } from "./repository.js";
import {
  childIdSchema,
  practiceSummary,
} from "./tool-handlers.js";
import type { ProfileRepository } from "./types.js";
import { buildWidgetHtml } from "./widget.js";

const coachPromptPath = resolve(
  process.cwd(),
  "resilience_coach_system_prompt.md",
);
const productAddendumPath = resolve(
  process.cwd(),
  "resilience_coach_product_addendum_v5.md",
);
const demoProfileIds = new Set([
  "demo-sharing",
  "demo-mistakes",
  "demo-change",
]);
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

function demoProfileId(value: unknown): string | null {
  const parsed = childIdSchema.safeParse(value);
  return parsed.success && demoProfileIds.has(parsed.data) ? parsed.data : null;
}

function landingPage(publicBaseUrl: string): string {
  const origin = publicBaseUrl.replace(/"/g, "&quot;");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resilience Coach &middot; Practice together</title>
<style>
:root{color:#17342f;background:#fbf7ed;font:18px/1.55 "Avenir Next","Segoe UI",system-ui,sans-serif}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 10%,#fbd893 0,transparent 25%),#fbf7ed}main{width:min(1080px,calc(100% - 36px));margin:0 auto;padding:42px 0 40px}.hero{display:grid;grid-template-columns:minmax(0,1.02fr) minmax(320px,.98fr);gap:42px;align-items:center}.hero img{width:100%;border:8px solid #fff;border-radius:32px;box-shadow:0 22px 55px rgba(24,70,62,.14)}.eyebrow{color:#35665d;font-size:14px;font-weight:850;letter-spacing:.1em;text-transform:uppercase}h1{max-width:760px;margin:10px 0 18px;font-size:clamp(48px,8vw,76px);line-height:.98;letter-spacing:-.045em}.lead{max-width:720px;font-size:clamp(21px,3vw,27px);line-height:1.4}.actions{display:flex;flex-wrap:wrap;gap:14px;margin:30px 0}.primary,.secondary{display:inline-flex;min-height:58px;padding:14px 22px;align-items:center;border-radius:16px;font-weight:850;text-decoration:none}.primary{color:#fff;background:#17685d;box-shadow:0 5px 0 #0d463f}.secondary{border:2px solid #17685d;color:#174f48;background:#fff}.note{margin-top:30px;padding:16px 18px;border:2px solid #a77718;border-radius:16px;background:#fff0c4}.features{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:34px 0}.feature{padding:22px;border:1px solid #bdd6d0;border-radius:20px;background:#fff}.feature b{display:block;margin-bottom:6px;font-size:20px}.small{color:#4b645f;font-size:15px}code{font-size:14px}@media(max-width:800px){.hero{grid-template-columns:1fr}.hero img{order:-1}.features{grid-template-columns:1fr}main{padding-top:24px}}
</style></head>
<body><main><section class="hero"><div><p class="eyebrow">OpenAI Build Week 2026 &middot; Education</p><h1>Practice hard moments, together.</h1>
<p class="lead">Picture stories and short type-or-tap conversations help children ages 6&ndash;8 practice one small next step with a grown-up nearby.</p>
<div class="actions"><a class="primary" href="${origin}/demo">Choose a practice</a><a class="secondary" href="${origin}/demo#grown-up-view">Grown-up view</a></div></div><img src="${origin}/assets/brand/welcome-practice-together.webp" alt="Child and grown-up sitting together and looking at picture cards."></section>
<div class="note"><strong>Synthetic demo only.</strong> An AI helps guide the practice, so a grown-up should stay nearby. Do not enter names or private information. This is an evidence-informed practice aid, not therapy, diagnosis, crisis care, or a replacement for care.</div>
<section class="features" aria-label="What the app includes"><div class="feature"><b>Picture Story</b>Look, point, and choose through a familiar illustrated moment.</div><div class="feature"><b>Talk It Through</b>Type a few made-up words or tap a clear coach choice.</div><div class="feature"><b>Make a plan</b>Finish with a visual if-then plan and transcript-free grown-up summary.</div></section>
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

  app.use(
    "/assets",
    expressStatic(resolve(process.cwd(), "assets", "web"), {
      immutable: true,
      maxAge: "1y",
      fallthrough: false,
    }),
  );

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

  app.get("/favicon.ico", (_req, res) => {
    res.status(204).end();
  });

  app.get("/", (_req, res) => {
    res.type("html").send(landingPage(config.publicBaseUrl));
  });

  const sendWidget = (res: Response, childId: string): void => {
    const assetOrigin = new URL(config.publicBaseUrl).origin;
    res
      .setHeader(
        "Content-Security-Policy",
        `default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self' ${assetOrigin}; img-src 'self' ${assetOrigin}; base-uri 'none'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com`,
      )
      .type("html")
      .send(buildWidgetHtml(config.publicBaseUrl, childId));
  };

  app.get("/demo", (_req, res) => {
    sendWidget(res, "demo-sharing");
  });

  app.get("/demo/profile/:childId", async (req, res) => {
    const childId = demoProfileId(req.params.childId);
    if (!childId) {
      res.status(404).send("Unknown synthetic demo profile");
      return;
    }
    try {
      const profile = await repository.getProfile(childId);
      if (!profile) {
        res.status(404).send("Unknown synthetic demo profile");
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.json({
        data: "synthetic_demo_only",
        locked: profile.locked,
        ...practiceSummary(profile),
      });
    } catch (error) {
      console.error("Grown-up summary route failed", error);
      res.status(500).json({ error: "The summary is taking a short pause." });
    }
  });

  app.get("/demo/:childId", (req, res) => {
    const childId = demoProfileId(req.params.childId);
    if (!childId) {
      res.status(404).send("Unknown synthetic demo profile");
      return;
    }
    sendWidget(res, childId);
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
  const fixedPrompt = readFileSync(coachPromptPath, "utf8");
  const productAddendum = readFileSync(productAddendumPath, "utf8");
  const systemPrompt = `${fixedPrompt}\n\n${productAddendum}`;
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
