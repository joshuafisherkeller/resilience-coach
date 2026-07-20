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
        <div class="coach-title">
          <p class="eyebrow">Adult-guided AI practice</p>
          <h1>Resilience Coach</h1>
        </div>
        <div class="header-actions">
          <button id="preferences-button" class="icon-button" type="button" aria-expanded="false">Make it easier</button>
          <button id="grown-up-button" class="icon-button" type="button">Grown-up view</button>
        </div>
      </header>

      <div class="demo-note" role="note">
        <strong>Synthetic demo.</strong> Do not type names or private information.
      </div>

      <section id="preferences-panel" class="preferences-panel" hidden aria-label="Accessibility choices">
        <h2>Make this easier to use</h2>
        <label><input id="read-aloud-toggle" type="checkbox" /> Read coach words aloud</label>
        <label><input id="large-text-toggle" type="checkbox" /> Make words bigger</label>
        <label><input id="reduce-motion-toggle" type="checkbox" /> Use less movement</label>
      </section>

      <section id="welcome-panel" class="welcome-panel">
        <div class="welcome-copy">
          <p class="section-kicker">Talk it through</p>
          <h2>Practice one small hard moment, together.</h2>
          <p>I am an AI practice coach, not a person. I can make mistakes. A grown-up should stay nearby and help choose what fits.</p>
        </div>

        <fieldset class="support-picker">
          <legend>What kind of help sounds good?</legend>
          <label><input type="radio" name="support" value="two clear choices" checked /> <span aria-hidden="true">A / B</span> Clear choices</label>
          <label><input type="radio" name="support" value="pictures and words" /> <span aria-hidden="true">&#9633;</span> Pictures + words</label>
          <label><input type="radio" name="support" value="movement break" /> <span aria-hidden="true">&#8596;</span> Move my body</label>
          <label><input type="radio" name="support" value="quiet pause" /> <span aria-hidden="true">&#9675;</span> Quiet pause</label>
          <label><input type="radio" name="support" value="grown-up help" /> <span aria-hidden="true">&#9825;</span> Grown-up help</label>
        </fieldset>

        <button id="start-practice" class="primary-button" type="button">A grown-up is here &mdash; start</button>
        <p class="time-note">About 3&ndash;5 minutes &middot; You can stop anytime</p>
      </section>

      <section id="practice-panel" hidden>
        <div class="practice-progress" aria-label="Practice steps">
          <ol id="loop-steps">
            <li class="is-current">Notice</li><li>Name</li><li>Choose</li><li>Try</li><li>Check</li><li>Plan</li>
          </ol>
          <p id="turn-progress">Step 1 of 6</p>
        </div>

        <section id="conversation" class="conversation" aria-live="polite" aria-atomic="false">
          <div class="message coach-message">
            <p>What felt hard today? You can pick a picture or use your own words.</p>
          </div>
        </section>

        <section id="starter-choices" class="starter-grid" aria-label="Ways to start">
          <button data-child-id="demo-sharing" data-starter="Someone would not share with me."><span aria-hidden="true">&#8644;</span><strong>A turn felt hard</strong><small>Sharing or waiting</small></button>
          <button data-child-id="demo-mistakes" data-starter="I made a mistake and felt upset."><span aria-hidden="true">&#8635;</span><strong>I made a mistake</strong><small>Trying again</small></button>
          <button data-child-id="demo-change" data-starter="Something changed and I did not like it."><span aria-hidden="true">&#8646;</span><strong>Something changed</strong><small>A plan was different</small></button>
          <button data-child-id="demo-sharing" data-starter="I do not know what to say."><span aria-hidden="true">?</span><strong>I don't know</strong><small>Help me begin</small></button>
        </section>

        <section id="response-choices" class="choices" aria-label="Response choices"></section>

        <details class="tool-drawer">
          <summary>Try a tool</summary>
          <p>Pick one. If it does not help, we can switch.</p>
          <div class="tool-grid">
            <button type="button" data-tool="Can we try one slow belly breath?">One slow breath</button>
            <button type="button" data-tool="Can we try a small movement break?">Move a little</button>
            <button type="button" data-tool="Can we try a quiet pause?">Quiet pause</button>
            <button type="button" data-tool="I want help from my grown-up.">Ask my grown-up</button>
          </div>
        </details>

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

        <p id="wait-cue" class="wait-cue">Take your time. There is no rush.</p>
        <div class="footer-actions">
          <button id="dont-understand" class="quiet-button" type="button">I don't understand</button>
          <button id="dont-know" class="quiet-button" type="button">I don't know</button>
          <button id="end-session" class="quiet-button end-button" type="button">Make my plan + finish</button>
        </div>
      </section>

      <section id="plan-card" class="plan-card" hidden aria-live="polite">
        <p class="section-kicker">My next-time plan</p>
        <h2 id="plan-heading">Practice complete</h2>
        <p id="plan-text" class="plan-text">When something feels hard, I will pause and ask my grown-up what to try.</p>
        <div id="plan-strategies" class="strategy-tags"></div>
        <p class="plan-note">This is a practice idea, not a rule. We can change it next time.</p>
        <div class="plan-actions">
          <button id="show-grown-up-summary" class="primary-button" type="button">Show my grown-up</button>
          <button id="new-practice" class="quiet-button" type="button">Practice another time</button>
        </div>
      </section>

      <section id="grown-up-view" class="grown-up-view" hidden tabindex="-1">
        <div class="grown-up-heading">
          <div>
            <p class="section-kicker">Grown-up view</p>
            <h2>Practice summary</h2>
          </div>
          <button id="close-grown-up" class="icon-button" type="button">Close</button>
        </div>
        <div id="grown-up-status" class="summary-status">Loading the synthetic practice summary&hellip;</div>
        <dl id="grown-up-summary" hidden>
          <div><dt>Skills practiced</dt><dd id="grown-up-strategies">None saved yet</dd></div>
          <div><dt>Next-time plan</dt><dd id="grown-up-plan">No plan saved yet</dd></div>
          <div><dt>Support preference</dt><dd id="grown-up-preference">Two clear choices</dd></div>
          <div><dt>Completed practices</dt><dd id="grown-up-count">0</dd></div>
        </dl>
        <aside class="praise-prompt"><strong>Process-praise prompt</strong><p>“I noticed you stayed with a hard moment and chose something to try.”</p></aside>
        <p class="privacy-note"><strong>No transcript is shown or saved.</strong> This summary contains only synthetic skills, a support preference, and a next-time plan.</p>
      </section>
    </main>
    <script>window.__RESILIENCE_COACH_CONFIG__ = ${config};</script>
    <script>${widgetScript}</script>
  </body>
</html>`;
}
