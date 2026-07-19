import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const widgetScript = readFileSync(
  resolve(process.cwd(), "web", "widget.js"),
  "utf8",
);
const widgetStyles = readFileSync(
  resolve(process.cwd(), "web", "widget.css"),
  "utf8",
);

function safeInlineJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export function buildWidgetHtml(
  serverOrigin: string,
  childId = "demo-sharing",
): string {
  const config = safeInlineJson({ serverOrigin, childId });
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>Resilience Coach</title>
    <style>${widgetStyles}</style>
  </head>
  <body>
    <main class="coach-shell" id="coach-shell">
      <header class="coach-header">
        <div class="coach-mark" aria-hidden="true">RC</div>
        <div>
          <p class="eyebrow">Practice, not therapy</p>
          <h1>Resilience Coach</h1>
        </div>
      </header>

      <div class="demo-note" role="note">
        Synthetic demo only &middot; Use with a grown-up nearby
      </div>

      <section id="conversation" class="conversation" aria-live="polite">
        <div class="message coach-message">
          <p>What felt hard today?</p>
        </div>
      </section>

      <section id="starter-choices" class="choices" aria-label="Ways to start">
        <button data-starter="Someone would not share with me.">A turn felt hard</button>
        <button data-starter="I made a mistake and felt upset.">I made a mistake</button>
        <button data-starter="Something changed and I did not like it.">Something changed</button>
        <button data-starter="I do not know what to say.">I don't know</button>
      </section>

      <section id="response-choices" class="choices" aria-label="Response choices"></section>

      <form id="coach-form" class="coach-form">
        <label for="child-message">Or say a few words</label>
        <div class="input-row">
          <input
            id="child-message"
            name="message"
            maxlength="300"
            autocomplete="off"
            placeholder="Type here"
          />
          <button class="send-button" type="submit">Send</button>
        </div>
      </form>

      <div class="footer-actions">
        <button id="dont-know" class="quiet-button" type="button">I don't know</button>
        <button id="end-session" class="quiet-button" type="button">I'm done for now</button>
      </div>
    </main>
    <script>window.__RESILIENCE_COACH_CONFIG__ = ${config};</script>
    <script>${widgetScript}</script>
  </body>
</html>`;
}
