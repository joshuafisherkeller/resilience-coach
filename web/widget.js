(function () {
  "use strict";

  const config = window.__RESILIENCE_COACH_CONFIG__ || {};
  const preferenceKey = "resilience-coach-display-preferences-v2";

  function newSessionId() {
    return window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : `demo-${Date.now()}`;
  }

  function loadDisplayPreferences() {
    try {
      return {
        readAloud: false,
        largeText: false,
        reduceMotion: false,
        ...JSON.parse(window.localStorage.getItem(preferenceKey) || "{}"),
      };
    } catch (_error) {
      return { readAloud: false, largeText: false, reduceMotion: false };
    }
  }

  const state = {
    childId: config.childId || "demo-sharing",
    serverOrigin: String(config.serverOrigin || "").replace(/\/$/, ""),
    sessionId: newSessionId(),
    supportPreference: "two clear choices",
    displayPreferences: loadDisplayPreferences(),
    busy: false,
    locked: false,
    started: false,
    turnCount: 0,
    previousPanel: "welcome",
    summary: null,
  };

  const shell = document.getElementById("coach-shell");
  const welcomePanel = document.getElementById("welcome-panel");
  const practicePanel = document.getElementById("practice-panel");
  const planCard = document.getElementById("plan-card");
  const grownUpView = document.getElementById("grown-up-view");
  const preferencesPanel = document.getElementById("preferences-panel");
  const preferencesButton = document.getElementById("preferences-button");
  const grownUpButton = document.getElementById("grown-up-button");
  const startPractice = document.getElementById("start-practice");
  const conversation = document.getElementById("conversation");
  const starterChoices = document.getElementById("starter-choices");
  const responseChoices = document.getElementById("response-choices");
  const form = document.getElementById("coach-form");
  const input = document.getElementById("child-message");
  const dontUnderstand = document.getElementById("dont-understand");
  const dontKnow = document.getElementById("dont-know");
  const endSession = document.getElementById("end-session");
  const turnProgress = document.getElementById("turn-progress");
  const loopSteps = Array.from(document.querySelectorAll("#loop-steps li"));
  const readAloudToggle = document.getElementById("read-aloud-toggle");
  const largeTextToggle = document.getElementById("large-text-toggle");
  const reduceMotionToggle = document.getElementById("reduce-motion-toggle");

  function applyDisplayPreferences() {
    document.body.classList.toggle(
      "large-text",
      Boolean(state.displayPreferences.largeText),
    );
    document.body.classList.toggle(
      "reduce-motion",
      Boolean(state.displayPreferences.reduceMotion),
    );
    readAloudToggle.checked = Boolean(state.displayPreferences.readAloud);
    largeTextToggle.checked = Boolean(state.displayPreferences.largeText);
    reduceMotionToggle.checked = Boolean(state.displayPreferences.reduceMotion);
  }

  function saveDisplayPreferences() {
    try {
      window.localStorage.setItem(
        preferenceKey,
        JSON.stringify(state.displayPreferences),
      );
    } catch (_error) {
      // Display preferences are optional and stay on this device when available.
    }
  }

  function maybeSpeak(text) {
    if (
      !state.displayPreferences.readAloud ||
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(String(text));
    utterance.rate = 0.86;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function scrollBehavior() {
    return state.displayPreferences.reduceMotion ? "auto" : "smooth";
  }

  function addMessage(text, who) {
    const clean = String(text || "").trim();
    if (!clean) return;
    const wrapper = document.createElement("div");
    wrapper.className = `message ${who === "child" ? "child-message" : "coach-message"}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = clean;
    wrapper.appendChild(paragraph);
    conversation.appendChild(wrapper);
    wrapper.scrollIntoView({ behavior: scrollBehavior(), block: "nearest" });
    if (who !== "child") maybeSpeak(clean);
  }

  function setBusy(value) {
    state.busy = value;
    for (const element of document.querySelectorAll("button, input")) {
      element.disabled = value || state.locked;
    }
    document.body.classList.toggle("is-busy", value);
  }

  function updateProgress(turnCount, sessionLimit) {
    state.turnCount = Number(turnCount) || state.turnCount;
    const limit = Number(sessionLimit) || 6;
    turnProgress.textContent = `Step ${Math.min(state.turnCount + 1, limit)} of ${limit}`;
    const activeIndex = Math.min(state.turnCount, loopSteps.length - 1);
    loopSteps.forEach(function (step, index) {
      step.classList.toggle("is-current", index === activeIndex);
      step.classList.toggle("is-complete", index < activeIndex);
    });
  }

  function renderChoices(choices) {
    responseChoices.replaceChildren();
    for (const choice of Array.isArray(choices) ? choices.slice(0, 3) : []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(choice).slice(0, 80);
      button.addEventListener("click", function () {
        void sendMessage(button.textContent || "");
      });
      responseChoices.appendChild(button);
    }
  }

  function showLockedScreen() {
    state.locked = true;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    shell.replaceChildren();
    const panel = document.createElement("section");
    panel.className = "locked-panel";

    const icon = document.createElement("div");
    icon.className = "grown-up-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "!";

    const heading = document.createElement("h1");
    heading.textContent = "Let's find a safe grown-up now";

    const belief = document.createElement("p");
    belief.textContent =
      "Thank you for telling. This is important, and it is not your fault.";

    const message = document.createElement("p");
    message.textContent =
      "Please show this screen to a caregiver, teacher, counselor, or another trusted grown-up nearby.";

    const note = document.createElement("p");
    note.className = "locked-note";
    note.textContent = "The chat is paused. A simulated demo alert was recorded.";

    panel.append(icon, heading, belief, message, note);
    shell.appendChild(panel);
    document.title = "Find a safe grown-up · Resilience Coach";
  }

  function toolMeta(result) {
    return (
      result?._meta?.resilienceCoach ||
      result?.metadata?._meta?.resilienceCoach ||
      null
    );
  }

  function applyToolResult(result) {
    const metadata = toolMeta(result);
    if (metadata?.child_id) state.childId = metadata.child_id;
    if (metadata?.server_origin) {
      state.serverOrigin = String(metadata.server_origin).replace(/\/$/, "");
    }
    if (metadata?.locked === true) showLockedScreen();
  }

  function tagList(container, values) {
    container.replaceChildren();
    for (const value of values) {
      const tag = document.createElement("span");
      tag.textContent = value;
      container.appendChild(tag);
    }
  }

  function renderPlan(summary, closingMessage) {
    state.summary = summary || null;
    practicePanel.hidden = true;
    welcomePanel.hidden = true;
    grownUpView.hidden = true;
    planCard.hidden = false;
    document.getElementById("plan-heading").textContent =
      String(closingMessage || "Practice complete").slice(0, 180);
    document.getElementById("plan-text").textContent =
      summary?.next_time_plan ||
      "When something feels hard, I will pause and ask my grown-up what to try.";
    tagList(
      document.getElementById("plan-strategies"),
      Array.isArray(summary?.practiced_strategies)
        ? summary.practiced_strategies
        : [],
    );
    planCard.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    maybeSpeak(document.getElementById("plan-text").textContent || "");
  }

  async function sendMessage(message, end) {
    const clean = String(message || "").replace(/\s+/g, " ").trim();
    if (!clean || state.busy || state.locked) return;

    starterChoices.hidden = true;
    renderChoices([]);
    addMessage(clean, "child");
    input.value = "";
    setBusy(true);

    try {
      const response = await fetch(`${state.serverOrigin}/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          child_id: state.childId,
          session_id: state.sessionId,
          message: clean,
          end_session: Boolean(end),
          support_preference: state.supportPreference,
        }),
      });
      const result = await response.json();
      if (result.locked) {
        showLockedScreen();
        return;
      }
      if (!response.ok) throw new Error("coach unavailable");
      updateProgress(result.turn_count, result.session_limit);
      if (result.ended) {
        renderPlan(result.summary, result.message);
        return;
      }
      addMessage(result.message, "coach");
      renderChoices(result.choices);
    } catch (_error) {
      addMessage(
        "A grown-up needs to help me connect. We can pause here.",
        "coach",
      );
    } finally {
      if (!state.locked) setBusy(false);
    }
  }

  function selectPanel(panelName) {
    welcomePanel.hidden = panelName !== "welcome";
    practicePanel.hidden = panelName !== "practice";
    planCard.hidden = panelName !== "plan";
    grownUpView.hidden = panelName !== "grown-up";
  }

  function currentPanel() {
    if (!planCard.hidden) return "plan";
    if (!practicePanel.hidden) return "practice";
    return "welcome";
  }

  function renderGrownUpSummary(summary) {
    const status = document.getElementById("grown-up-status");
    const details = document.getElementById("grown-up-summary");
    document.getElementById("grown-up-strategies").textContent =
      Array.isArray(summary?.practiced_strategies) &&
      summary.practiced_strategies.length > 0
        ? summary.practiced_strategies.join(", ")
        : "None saved yet";
    document.getElementById("grown-up-plan").textContent =
      summary?.next_time_plan || "No plan saved yet";
    document.getElementById("grown-up-preference").textContent =
      summary?.support_preference || state.supportPreference;
    document.getElementById("grown-up-count").textContent = String(
      Number(summary?.session_count) || 0,
    );
    status.hidden = true;
    details.hidden = false;
  }

  async function openGrownUpView() {
    if (state.locked) return;
    state.previousPanel = currentPanel();
    selectPanel("grown-up");
    const view = grownUpView;
    const status = document.getElementById("grown-up-status");
    const details = document.getElementById("grown-up-summary");
    status.hidden = false;
    status.textContent = "Loading the synthetic practice summary…";
    details.hidden = true;
    view.focus();
    if (state.summary) renderGrownUpSummary(state.summary);

    try {
      const response = await fetch(
        `${state.serverOrigin}/demo/profile/${encodeURIComponent(state.childId)}`,
        { headers: { accept: "application/json" } },
      );
      if (!response.ok) throw new Error("summary unavailable");
      renderGrownUpSummary(await response.json());
    } catch (_error) {
      if (!state.summary) {
        status.hidden = false;
        status.textContent = "The grown-up summary is taking a short pause.";
      }
    }
  }

  function closeGrownUpView() {
    selectPanel(state.previousPanel || (state.started ? "practice" : "welcome"));
    grownUpButton.focus();
  }

  startPractice.addEventListener("click", function () {
    const selected = document.querySelector('input[name="support"]:checked');
    state.supportPreference = selected?.value || "two clear choices";
    state.started = true;
    selectPanel("practice");
    const matchingStarter = starterChoices.querySelector(
      `[data-child-id="${state.childId}"]`,
    );
    if (matchingStarter) matchingStarter.classList.add("is-suggested");
    matchingStarter?.focus();
  });

  for (const button of starterChoices.querySelectorAll("button")) {
    button.addEventListener("click", function () {
      if (state.turnCount === 0 && button.dataset.childId) {
        state.childId = button.dataset.childId;
      }
      void sendMessage(button.dataset.starter || button.textContent || "");
    });
  }

  for (const button of document.querySelectorAll("[data-tool]")) {
    button.addEventListener("click", function () {
      void sendMessage(button.dataset.tool || button.textContent || "");
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    void sendMessage(input.value);
  });
  dontUnderstand.addEventListener("click", function () {
    void sendMessage("I don't understand. Please make it simpler.");
  });
  dontKnow.addEventListener("click", function () {
    void sendMessage("I don't know.");
  });
  endSession.addEventListener("click", function () {
    void sendMessage("I am ready to make my next-time plan and stop.", true);
  });

  preferencesButton.addEventListener("click", function () {
    const willOpen = preferencesPanel.hidden;
    preferencesPanel.hidden = !willOpen;
    preferencesButton.setAttribute("aria-expanded", String(willOpen));
    if (willOpen) preferencesPanel.querySelector("input")?.focus();
  });
  readAloudToggle.addEventListener("change", function () {
    state.displayPreferences.readAloud = readAloudToggle.checked;
    saveDisplayPreferences();
    if (readAloudToggle.checked) maybeSpeak("Read aloud is on.");
  });
  largeTextToggle.addEventListener("change", function () {
    state.displayPreferences.largeText = largeTextToggle.checked;
    applyDisplayPreferences();
    saveDisplayPreferences();
  });
  reduceMotionToggle.addEventListener("change", function () {
    state.displayPreferences.reduceMotion = reduceMotionToggle.checked;
    applyDisplayPreferences();
    saveDisplayPreferences();
  });

  grownUpButton.addEventListener("click", function () {
    void openGrownUpView();
  });
  document
    .getElementById("show-grown-up-summary")
    .addEventListener("click", function () {
      void openGrownUpView();
    });
  document
    .getElementById("close-grown-up")
    .addEventListener("click", closeGrownUpView);
  document.getElementById("new-practice").addEventListener("click", function () {
    window.location.assign(`${state.serverOrigin}/demo`);
  });

  window.addEventListener(
    "message",
    function (event) {
      if (event.source !== window.parent) return;
      const message = event.data;
      if (!message || message.jsonrpc !== "2.0") return;
      if (message.method === "ui/notifications/tool-result") {
        applyToolResult(message.params);
      }
    },
    { passive: true },
  );

  window.addEventListener(
    "openai:set_globals",
    function (event) {
      applyToolResult(event.detail?.globals?.toolOutput);
    },
    { passive: true },
  );

  applyDisplayPreferences();
  applyToolResult(window.openai?.toolOutput);
  if (window.location.hash === "#grown-up-view") {
    void openGrownUpView();
  }
})();
