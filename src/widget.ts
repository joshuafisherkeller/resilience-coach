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

function supportOption(
  group: "welcome" | "settings",
  value: string,
  icon: string,
  title: string,
  description: string,
  checked = false,
): string {
  return `<label class="support-option">
    <input type="radio" name="support-${group}" value="${value}"${checked ? " checked" : ""} />
    <svg class="support-option-icon" aria-hidden="true"><use href="#rc-icon-${icon}"></use></svg>
    <span class="support-card-content"><strong>${title}</strong><small>${description}</small></span>
  </label>`;
}

function supportOptions(group: "welcome" | "settings"): string {
  return [
    supportOption(group, "two clear choices", "choice", "Clear choices", "Show two things I can pick", true),
    supportOption(group, "pictures and words", "pictures", "Pictures + words", "Add a picture to each idea"),
    supportOption(group, "movement break", "move", "Move my body", "Try a small movement first"),
    supportOption(group, "quiet pause", "pause", "Quiet pause", "Use fewer words and a calm timer"),
    supportOption(group, "grown-up help", "grownup", "Grown-up help", "Give us a together script"),
  ].join("\n");
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
  <body data-support-mode="two-clear-choices">
    <svg class="icon-sprite" aria-hidden="true">
      <symbol id="rc-icon-choice" viewBox="0 0 48 48"><rect x="5" y="10" width="15" height="15" rx="4"/><path d="m9 17 4 4 7-9"/><rect x="28" y="10" width="15" height="15" rx="4"/><path d="M6 36h36"/></symbol>
      <symbol id="rc-icon-pictures" viewBox="0 0 48 48"><rect x="5" y="7" width="38" height="34" rx="6"/><circle cx="16" cy="18" r="4"/><path d="m9 36 10-10 7 7 5-5 8 8"/></symbol>
      <symbol id="rc-icon-move" viewBox="0 0 48 48"><circle cx="24" cy="8" r="4"/><path d="M24 13v15m0-10L12 24m12-6 12 6M24 28 14 41m10-13 10 13"/></symbol>
      <symbol id="rc-icon-pause" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><path d="M19 16v16m10-16v16"/></symbol>
      <symbol id="rc-icon-grownup" viewBox="0 0 48 48"><circle cx="18" cy="14" r="6"/><circle cx="34" cy="19" r="5"/><path d="M7 40c1-10 5-16 11-16s10 6 11 16m-4 0c1-7 4-12 9-12 4 0 7 5 8 12"/></symbol>
      <symbol id="rc-icon-sharing" viewBox="0 0 48 48"><path d="M8 16h29m-6-7 7 7-7 7M40 32H11m6 7-7-7 7-7"/></symbol>
      <symbol id="rc-icon-mistake" viewBox="0 0 48 48"><path d="M39 20A16 16 0 1 0 35 35M39 20V8m0 12H27"/><path d="m18 23 4 4 8-9"/></symbol>
      <symbol id="rc-icon-change" viewBox="0 0 48 48"><path d="M9 14h25m-6-7 7 7-7 7M39 34H14m6 7-7-7 7-7"/></symbol>
      <symbol id="rc-icon-unknown" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><path d="M18 18c1-7 13-7 13 1 0 5-7 5-7 10m0 7h.1"/></symbol>
      <symbol id="rc-icon-breath" viewBox="0 0 48 48"><path d="M7 19h22c8 0 8-11 1-11-4 0-6 3-6 6M7 27h29c8 0 8 12 0 12-4 0-6-3-6-6"/></symbol>
      <symbol id="rc-icon-shake" viewBox="0 0 48 48"><path d="M15 10v18m6-21v20m6-17v18m6-13v16M15 20c-6-3-9 3-5 8l8 11h14c5-5 6-12 1-17"/></symbol>
      <symbol id="rc-icon-stretch" viewBox="0 0 48 48"><circle cx="24" cy="16" r="4"/><path d="M24 21v13m0-8-9 6m9-6 9 6M24 34l-7 8m7-8 7 8M17 17 9 8m22 9 8-9"/></symbol>
      <symbol id="rc-icon-press" viewBox="0 0 48 48"><path d="M19 10v24m-5-20v17m-5-12v10m20-19v24m5-20v17m5-12v10M19 23h10"/></symbol>
      <symbol id="rc-icon-march" viewBox="0 0 48 48"><circle cx="24" cy="8" r="4"/><path d="M24 13v15m0-10-10 6m10-6 10 6m-10 4-11 5m11-5 7 13m-18-8 4 9"/></symbol>
      <symbol id="rc-icon-check" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><path d="m14 24 7 7 14-16"/></symbol>
      <symbol id="rc-icon-feeling" viewBox="0 0 48 48"><circle cx="24" cy="24" r="18"/><circle cx="18" cy="20" r="2"/><circle cx="30" cy="20" r="2"/><path d="M16 32c5-4 11-4 16 0"/></symbol>
      <symbol id="rc-icon-try" viewBox="0 0 48 48"><path d="M9 39h30M14 34l9-25 6 17m-12-2h16"/></symbol>
    </svg>

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

      <section id="preferences-panel" class="preferences-panel" hidden aria-label="Accessibility and support choices">
        <div class="preferences-heading">
          <div><p class="section-kicker">Change anytime</p><h2>Make this easier to use</h2></div>
          <button id="close-preferences" class="quiet-button" type="button">Close</button>
        </div>
        <div class="display-preferences">
          <label><input id="read-aloud-toggle" type="checkbox" /> Read coach words aloud</label>
          <label><input id="large-text-toggle" type="checkbox" /> Make words bigger</label>
          <label><input id="reduce-motion-toggle" type="checkbox" /> Use less movement</label>
        </div>
        <fieldset class="support-picker support-settings">
          <legend>Choose a kind of help</legend>
          ${supportOptions("settings")}
        </fieldset>
        <button id="apply-support-mode" class="primary-button compact-button" type="button">Use this kind of help</button>
        <p id="support-change-status" class="inline-status" aria-live="polite"></p>
      </section>

      <section id="welcome-panel" class="welcome-panel">
        <div class="welcome-copy">
          <p class="section-kicker">Talk it through</p>
          <h2>Practice one small hard moment, together.</h2>
          <p>I am an AI practice coach, not a person. I can make mistakes. A grown-up should stay nearby and help choose what fits.</p>
        </div>

        <fieldset class="support-picker welcome-support-picker">
          <legend>What kind of help sounds good?</legend>
          ${supportOptions("welcome")}
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

        <section id="support-mode-banner" class="support-mode-banner" aria-live="polite" tabindex="-1">
          <svg id="active-support-icon" aria-hidden="true"><use href="#rc-icon-choice"></use></svg>
          <div><strong id="active-support-title">Clear choices</strong><span id="active-support-description">I will show two things you can pick.</span></div>
          <button id="change-support-inline" class="quiet-button" type="button">Change</button>
        </section>

        <section id="support-workspace" class="support-workspace" aria-label="Selected support tool">
          <div id="picture-workspace" class="mode-workspace picture-workspace" hidden>
            <svg aria-hidden="true"><use href="#rc-icon-pictures"></use></svg>
            <p><strong>Look for the pictures.</strong> Every idea will keep its words too.</p>
          </div>

          <div id="movement-workspace" class="mode-workspace movement-workspace" hidden>
            <div class="workspace-heading"><div><p class="section-kicker">Move my body</p><h3>Pick one small movement</h3></div><svg aria-hidden="true"><use href="#rc-icon-move"></use></svg></div>
            <p class="safety-cue">A grown-up stays nearby. Stop if a movement feels uncomfortable.</p>
            <div class="movement-grid">
              <button type="button" data-movement="shake"><svg aria-hidden="true"><use href="#rc-icon-shake"></use></svg><strong>Shake hands</strong><small>Soft and loose</small></button>
              <button type="button" data-movement="stretch"><svg aria-hidden="true"><use href="#rc-icon-stretch"></use></svg><strong>Reach up</strong><small>Then slowly lower</small></button>
              <button type="button" data-movement="press"><svg aria-hidden="true"><use href="#rc-icon-press"></use></svg><strong>Press hands</strong><small>Palm to palm</small></button>
              <button type="button" data-movement="march"><svg aria-hidden="true"><use href="#rc-icon-march"></use></svg><strong>March in place</strong><small>Small slow steps</small></button>
            </div>
            <div id="movement-guide" class="activity-guide" hidden>
              <div class="timer-ring" id="movement-timer-ring" style="--timer-progress:0"><span id="movement-timer-text">20</span></div>
              <div><h3 id="movement-title">Shake hands</h3><p id="movement-instruction">Gently shake both hands. Keep your feet still.</p><div class="activity-actions"><button id="start-movement-timer" class="primary-button compact-button" type="button">Start 20 seconds</button><button id="finish-movement" class="quiet-button" type="button">Done &mdash; check my body</button></div></div>
            </div>
          </div>

          <div id="quiet-workspace" class="mode-workspace quiet-workspace" hidden>
            <div class="workspace-heading"><div><p class="section-kicker">Quiet pause</p><h3>Take a little quiet time</h3></div><svg aria-hidden="true"><use href="#rc-icon-pause"></use></svg></div>
            <p>No sound. No need to talk. A grown-up can stay quietly nearby.</p>
            <div class="duration-picker" aria-label="Quiet pause length"><button type="button" data-pause-seconds="20" class="is-selected">20 seconds</button><button type="button" data-pause-seconds="40">40 seconds</button></div>
            <div class="quiet-activity">
              <div id="breathing-orb" class="breathing-orb" aria-hidden="true"></div>
              <div class="timer-ring" id="quiet-timer-ring" style="--timer-progress:0"><span id="quiet-timer-text">20</span></div>
            </div>
            <p id="quiet-cue" class="quiet-cue">Get comfortable. Start when you are ready.</p>
            <div class="activity-actions"><button id="start-quiet-timer" class="primary-button compact-button" type="button">Start quiet pause</button><button id="finish-quiet" class="quiet-button" type="button">Finish early</button></div>
          </div>

          <div id="grownup-workspace" class="mode-workspace grownup-workspace" hidden>
            <div class="workspace-heading"><div><p class="section-kicker">Grown-up help</p><h3>Use these words together</h3></div><svg aria-hidden="true"><use href="#rc-icon-grownup"></use></svg></div>
            <div class="together-script"><div><span>Grown-up says or does</span><p id="grownup-script">I am here. Pick one small hard moment.</p></div><div><span>Child can</span><p id="child-script">Point, tap a choice, or use a few words.</p></div></div>
            <div class="activity-actions"><button id="grownup-two-choices" class="primary-button compact-button" type="button">Give us two choices</button><button id="grownup-read-together" class="quiet-button" type="button">We read it together</button></div>
            <p id="grownup-together-status" class="inline-status" aria-live="polite"></p>
          </div>
        </section>

        <section id="conversation" class="conversation" aria-live="polite" aria-atomic="false">
          <div class="message coach-message">
            <p>What felt hard today? You can pick one idea or use your own words.</p>
          </div>
        </section>

        <section id="starter-choices" class="starter-grid" aria-label="Ways to start">
          <button data-icon="sharing" data-child-id="demo-sharing" data-starter="Someone would not share with me."><svg aria-hidden="true"><use href="#rc-icon-sharing"></use></svg><strong>A turn felt hard</strong><small>Sharing or waiting</small></button>
          <button data-icon="mistake" data-child-id="demo-mistakes" data-starter="I made a mistake and felt upset."><svg aria-hidden="true"><use href="#rc-icon-mistake"></use></svg><strong>I made a mistake</strong><small>Trying again</small></button>
          <button data-icon="change" data-child-id="demo-change" data-starter="Something changed and I did not like it."><svg aria-hidden="true"><use href="#rc-icon-change"></use></svg><strong>Something changed</strong><small>A plan was different</small></button>
          <button data-icon="unknown" data-child-id="demo-sharing" data-starter="I do not know what to say."><svg aria-hidden="true"><use href="#rc-icon-unknown"></use></svg><strong>I don&rsquo;t know</strong><small>Help me begin</small></button>
        </section>

        <section id="response-choices" class="choices" aria-label="Response choices"></section>

        <details id="tool-drawer" class="tool-drawer">
          <summary>Try a tool</summary>
          <p>Pick one. If it does not help, we can switch.</p>
          <div class="tool-grid">
            <button type="button" data-tool="Can we try one slow belly breath?"><svg aria-hidden="true"><use href="#rc-icon-breath"></use></svg>One slow breath</button>
            <button type="button" data-tool="Can we try a small movement break?"><svg aria-hidden="true"><use href="#rc-icon-move"></use></svg>Move a little</button>
            <button type="button" data-tool="Can we try a quiet pause?"><svg aria-hidden="true"><use href="#rc-icon-pause"></use></svg>Quiet pause</button>
            <button type="button" data-tool="I want help from my grown-up."><svg aria-hidden="true"><use href="#rc-icon-grownup"></use></svg>Ask my grown-up</button>
          </div>
        </details>

        <form id="coach-form" class="coach-form">
          <label id="child-message-label" for="child-message">Or say a few words</label>
          <div class="input-row">
            <input id="child-message" name="message" maxlength="300" autocomplete="off" placeholder="Type here" />
            <button class="send-button" type="submit">Send</button>
          </div>
        </form>

        <p id="wait-cue" class="wait-cue">Take your time. There is no rush.</p>
        <div class="footer-actions">
          <button id="dont-understand" class="quiet-button" type="button">I don&rsquo;t understand</button>
          <button id="dont-know" class="quiet-button" type="button">I don&rsquo;t know</button>
          <button id="end-session" class="quiet-button end-button" type="button">Make my plan + finish</button>
        </div>
      </section>

      <section id="plan-card" class="plan-card" hidden aria-live="polite">
        <svg class="plan-icon" aria-hidden="true"><use href="#rc-icon-check"></use></svg>
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
        <div class="grown-up-heading"><div><p class="section-kicker">Grown-up view</p><h2>Practice summary</h2></div><button id="close-grown-up" class="icon-button" type="button">Close</button></div>
        <div id="grown-up-status" class="summary-status">Loading the synthetic practice summary&hellip;</div>
        <dl id="grown-up-summary" hidden>
          <div><dt>Skills practiced</dt><dd id="grown-up-strategies">None saved yet</dd></div>
          <div><dt>Next-time plan</dt><dd id="grown-up-plan">No plan saved yet</dd></div>
          <div><dt>Support preference</dt><dd id="grown-up-preference">Two clear choices</dd></div>
          <div><dt>Completed practices</dt><dd id="grown-up-count">0</dd></div>
        </dl>
        <aside class="praise-prompt"><strong>Process-praise prompt</strong><p>&ldquo;I noticed you stayed with a hard moment and chose something to try.&rdquo;</p></aside>
        <p class="privacy-note"><strong>No transcript is shown or saved.</strong> This summary contains only synthetic skills, a support preference, and a next-time plan.</p>
      </section>
    </main>
    <script>window.__RESILIENCE_COACH_CONFIG__ = ${config};</script>
    <script>${widgetScript}</script>
  </body>
</html>`;
}
