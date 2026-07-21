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

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildWidgetHtml(
  serverOrigin: string,
  childId = "demo-sharing",
): string {
  const origin = serverOrigin.replace(/\/$/, "");
  const assetBase = `${origin}/assets`;
  const config = safeInlineJson({ serverOrigin: origin, childId, assetBase });
  const asset = (path: string): string =>
    escapeAttribute(`${assetBase}/${path}`);

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
        <a class="brand" href="${escapeAttribute(origin)}/demo" aria-label="Resilience Coach home">
          <img src="${asset("completion/small-progress-motif.png")}" alt="" width="48" height="48" />
          <span><small>Practice together</small><strong>Resilience Coach</strong></span>
        </a>
        <div class="header-actions">
          <button id="preferences-button" class="text-button" type="button" aria-expanded="false">Make it easier</button>
          <button id="grown-up-button" class="text-button" type="button">Grown-up view</button>
        </div>
      </header>

      <aside class="demo-note" role="note">
        <span class="demo-dot" aria-hidden="true"></span>
        <p><strong>Practice demo:</strong> use made-up examples only. A grown-up stays nearby.</p>
      </aside>

      <section id="preferences-panel" class="sheet" hidden aria-label="Accessibility choices">
        <div class="sheet-heading">
          <div><p class="eyebrow">Change anytime</p><h2>What would make this easier?</h2></div>
          <button id="close-preferences" class="close-button" type="button">Close</button>
        </div>
        <div class="preference-grid">
          <label><input id="read-aloud-toggle" type="checkbox" /><span><strong>Read the coach words aloud</strong><small>Uses this device's voice</small></span></label>
          <label><input id="large-text-toggle" type="checkbox" /><span><strong>Make the words bigger</strong><small>Keeps the same pictures</small></span></label>
          <label><input id="reduce-motion-toggle" type="checkbox" /><span><strong>Use less movement</strong><small>Turns off animated transitions</small></span></label>
        </div>
      </section>

      <section id="welcome-panel" class="welcome-panel">
        <div class="welcome-copy">
          <p class="eyebrow">Two ways to practice - ages 6-8</p>
          <h1>Hard moments happen. We can practice what to try.</h1>
          <p class="welcome-lead">Choose pictures or a short conversation. Both help a child and grown-up practice one small skill together.</p>
          <p class="pathway-prompt"><strong>A grown-up is here. How should we practice?</strong></p>
          <div class="pathway-grid" aria-label="Choose how to practice">
            <button id="begin-picture-button" class="pathway-card" type="button">
              <img src="${asset("scenarios/sharing/card-sharing-and-waiting.webp")}" alt="Two children sit near a toy while one waits for a turn." width="800" height="600" />
              <span><small>Look, point, and choose</small><strong>Picture Story</strong><em>Follow an illustrated moment and practice a skill.</em></span>
            </button>
            <button id="begin-words-button" class="pathway-card" type="button">
              <img src="${asset("grown-up/grown-up-listens-nearby.webp")}" alt="Child speaks while a grown-up sits nearby and listens." width="800" height="600" />
              <span><small>Type or tap together</small><strong>Talk It Through</strong><em>Use a few made-up words and clear choices.</em></span>
            </button>
          </div>
          <p class="time-note">About 3-5 minutes. You can stop anytime.</p>
        </div>
        <figure class="welcome-art">
          <img src="${asset("brand/welcome-practice-together.webp")}" alt="Child and grown-up sitting together and looking at three picture cards." width="1600" height="1000" />
        </figure>
      </section>

      <section id="conversation-panel" class="conversation-panel" hidden>
        <div class="conversation-topline">
          <button id="conversation-back" class="quiet-button" type="button">Choose another way</button>
          <p id="conversation-progress" aria-live="polite">Step 1 of 6</p>
        </div>
        <div class="conversation-heading">
          <div>
            <p class="eyebrow">Talk it through</p>
            <h1>A few words are enough.</h1>
            <p>The coach will ask one small question at a time. Tap a choice or type a made-up example together.</p>
          </div>
          <img src="${asset("grown-up/grown-up-listens-nearby.webp")}" alt="Child speaks while a grown-up sits nearby and listens." width="800" height="600" />
        </div>

        <div class="conversation-steps" aria-label="Conversation practice progress">
          <span class="is-current">Notice</span><span>Name</span><span>Choose</span><span>Try</span><span>Check</span><span>Plan</span>
        </div>

        <div id="word-starters" class="word-starters">
          <p><strong>Pick a made-up moment, or write your own.</strong></p>
          <div class="word-starter-grid">
            <button type="button" data-word-starter="sharing">
              <img src="${asset("scenarios/sharing/card-sharing-and-waiting.webp")}" alt="Two children sit near a toy while one waits for a turn." width="800" height="600" />
              <span><strong>Waiting for a turn</strong><small>Waiting felt hard.</small></span>
            </button>
            <button type="button" data-word-starter="mistakes">
              <img src="${asset("scenarios/mistakes/card-making-a-mistake.webp")}" alt="Child notices a torn piece in a paper collage." width="800" height="600" />
              <span><strong>A mistake</strong><small>Something did not go as planned.</small></span>
            </button>
            <button type="button" data-word-starter="change">
              <img src="${asset("scenarios/change/card-change-of-plans.webp")}" alt="Child and grown-up talk beside a rainy window and indoor toys." width="800" height="600" />
              <span><strong>A changed plan</strong><small>What I expected was different.</small></span>
            </button>
          </div>
        </div>

        <div id="conversation" class="conversation-log" role="log" aria-live="polite" aria-label="Practice conversation">
          <div class="conversation-message coach-message-bubble">
            <img src="${asset("completion/small-progress-motif.png")}" alt="" width="40" height="40" />
            <div><span>Coach</span><p>What small made-up hard moment should we practice?</p></div>
          </div>
        </div>
        <div id="word-response-choices" class="word-response-choices" aria-label="Coach choices"></div>

        <form id="conversation-form" class="conversation-form">
          <label for="conversation-input">Type a few made-up words. Do not type names or private information.</label>
          <div class="input-row"><input id="conversation-input" maxlength="300" autocomplete="off" placeholder="A made-up example..." /><button class="primary-button compact" type="submit">Tell the coach</button></div>
        </form>
        <div class="conversation-help">
          <button id="word-dont-know" class="quiet-button" type="button">I don't know yet</button>
          <button id="word-dont-understand" class="quiet-button" type="button">I don't understand</button>
          <button id="word-finish" class="quiet-button danger-quiet" type="button">Stop and make my plan</button>
        </div>
        <p class="privacy-note"><strong>No conversation transcript is saved.</strong> Only one brief skill summary and next-time plan can be remembered.</p>
      </section>

      <section id="scenario-panel" class="scenario-panel" hidden>
        <div class="section-heading centered-heading">
          <p class="eyebrow">Choose one small hard moment</p>
          <h1>What should we practice together?</h1>
          <p>There is no wrong choice. We are only practicing.</p>
        </div>
        <div class="scenario-grid" aria-label="Picture stories">
          <button class="scenario-card" type="button" data-scenario="sharing">
            <img src="${asset("scenarios/sharing/card-sharing-and-waiting.webp")}" alt="Two children sit near a toy while one waits for a turn." width="800" height="600" />
            <span><strong>Sharing and waiting</strong><small>Someone else has the toy</small></span>
          </button>
          <button class="scenario-card" type="button" data-scenario="mistakes">
            <img src="${asset("scenarios/mistakes/card-making-a-mistake.webp")}" alt="Child notices a torn piece in a paper collage." width="800" height="600" />
            <span><strong>Making a mistake</strong><small>Something did not go as planned</small></span>
          </button>
          <button class="scenario-card" type="button" data-scenario="change">
            <img src="${asset("scenarios/change/card-change-of-plans.webp")}" alt="Child and grown-up talk beside a rainy window and indoor toys." width="800" height="600" />
            <span><strong>A change of plans</strong><small>What I expected is different</small></span>
          </button>
        </div>
        <button id="scenario-back" class="quiet-button centered-button" type="button">Back</button>
      </section>

      <section id="story-panel" class="story-panel" hidden>
        <div class="story-topline">
          <button id="story-exit" class="quiet-button" type="button">Choose a different story</button>
          <p id="story-progress" aria-live="polite">Picture 1 of 5</p>
        </div>
        <div class="story-card">
          <figure><img id="story-image" src="" alt="" width="800" height="600" /></figure>
          <div class="story-copy">
            <p id="story-eyebrow" class="eyebrow">First</p>
            <h1 id="story-title">Someone else has the toy.</h1>
            <p id="story-text"></p>
            <div class="story-actions">
              <button id="story-previous" class="quiet-button" type="button">Previous picture</button>
              <button id="story-next" class="primary-button" type="button">Next picture</button>
            </div>
          </div>
        </div>
      </section>

      <section id="practice-panel" class="practice-panel" hidden>
        <nav class="practice-steps" aria-label="Practice progress">
          <ol>
            <li data-step="notice"><span>1</span>Notice</li>
            <li data-step="choose"><span>2</span>Choose</li>
            <li data-step="try"><span>3</span>Practice</li>
            <li data-step="check"><span>4</span>Check</li>
            <li data-step="plan"><span>5</span>Plan</li>
          </ol>
        </nav>

        <aside id="coach-note" class="coach-note" aria-live="polite" aria-busy="false">
          <img src="${asset("completion/small-progress-motif.png")}" alt="" width="44" height="44" />
          <div><p class="coach-label">Coach says</p><p id="coach-message">We can take this one small step at a time.</p></div>
        </aside>

        <section id="activity-stage" class="activity-stage" aria-live="polite"></section>

        <div class="practice-footer">
          <button id="grown-up-help" class="quiet-button" type="button">I want my grown-up's help</button>
          <button id="stop-practice" class="quiet-button danger-quiet" type="button">Stop and make my plan</button>
        </div>

        <details class="own-words">
          <summary>Want to use your own words?</summary>
          <p class="own-words-switch-note">This pauses the picture story and opens <strong>Talk It Through</strong>, where the coach will answer what you type.</p>
          <form id="own-words-form">
            <label for="own-words-input">A few made-up words are enough. Do not type names or private information.</label>
            <div class="input-row"><input id="own-words-input" maxlength="300" autocomplete="off" /><button class="primary-button compact" type="submit">Switch and tell the coach</button></div>
          </form>
        </details>
      </section>

      <section id="plan-card" class="plan-card" hidden aria-live="polite">
        <img class="completion-image" src="${asset("completion/practice-finished.webp")}" alt="Child continues an ordinary craft activity while a grown-up stays nearby." width="800" height="600" />
        <div class="completion-copy">
          <p class="eyebrow">Practice finished</p>
          <h1 id="plan-heading">You practiced one small hard moment.</h1>
          <div class="saved-plan"><span>My next-time plan</span><p id="plan-text"></p></div>
          <div id="plan-strategies" class="strategy-tags"></div>
          <p class="plan-note">A plan is an idea, not a rule. It can change next time.</p>
          <div class="completion-actions">
            <button id="show-grown-up-summary" class="primary-button" type="button">Show my grown-up</button>
            <button id="new-practice" class="quiet-button" type="button">Practice another moment</button>
          </div>
        </div>
      </section>

      <section id="grown-up-view" class="grown-up-view" hidden tabindex="-1">
        <div class="sheet-heading"><div><p class="eyebrow">For the nearby adult</p><h1>Grown-up view</h1></div><button id="close-grown-up" class="close-button" type="button">Close</button></div>
        <div class="grown-up-intro">
          <img src="${asset("grown-up/grown-up-notices-effort.webp")}" alt="Grown-up notices a child's effort during a paper activity." width="800" height="600" />
          <div><h2>Notice effort, not a perfect result.</h2><p>Try: "I noticed you stayed with a hard moment and chose something to try."</p></div>
        </div>
        <div id="grown-up-status" class="summary-status">Loading the synthetic practice summary...</div>
        <dl id="grown-up-summary" class="summary-grid" hidden>
          <div><dt>Skills practiced</dt><dd id="grown-up-strategies">None saved yet</dd></div>
          <div><dt>Next-time plan</dt><dd id="grown-up-plan">No plan saved yet</dd></div>
          <div><dt>Practice support</dt><dd id="grown-up-preference">Pictures and words</dd></div>
          <div><dt>Completed practices</dt><dd id="grown-up-count">0</dd></div>
        </dl>
        <p class="privacy-note"><strong>No transcript is shown or saved.</strong> This synthetic summary contains only practiced skills and one next-time plan.</p>
      </section>
    </main>
    <script>window.__RESILIENCE_COACH_CONFIG__ = ${config};</script>
    <script>${widgetScript}</script>
  </body>
</html>`;
}
