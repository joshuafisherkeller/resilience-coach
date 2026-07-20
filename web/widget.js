(function () {
  "use strict";

  const config = window.__RESILIENCE_COACH_CONFIG__ || {};
  const preferenceKey = "resilience-coach-display-preferences-v2";
  const MODES = {
    "two clear choices": {
      slug: "two-clear-choices",
      title: "Clear choices",
      description: "I will show two things you can pick.",
      icon: "choice",
      choiceLimit: 2,
      intro: "What felt hard today? Pick one idea, or use your own words.",
      label: "Or say a few words",
      placeholder: "Type here",
    },
    "pictures and words": {
      slug: "pictures-and-words",
      title: "Pictures + words",
      description: "Each idea has a picture and words.",
      icon: "pictures",
      choiceLimit: 3,
      intro: "What felt hard today? Look at the pictures and pick one.",
      label: "Or use your own words",
      placeholder: "Type a few words",
    },
    "movement break": {
      slug: "movement-break",
      title: "Move my body",
      description: "Try a safe small movement, then check your body.",
      icon: "move",
      choiceLimit: 2,
      intro: "You can move first. Then pick one small hard moment.",
      label: "Or tell me what happened",
      placeholder: "Type a few words",
    },
    "quiet pause": {
      slug: "quiet-pause",
      title: "Quiet pause",
      description: "Use fewer words and take quiet time.",
      icon: "pause",
      choiceLimit: 2,
      intro: "We can be quiet first. Start when you are ready.",
      label: "Words are optional",
      placeholder: "Type only if you want",
    },
    "grown-up help": {
      slug: "grown-up-help",
      title: "Grown-up help",
      description: "Use a short grown-up and child script together.",
      icon: "grownup",
      choiceLimit: 2,
      intro: "Your grown-up can read the together script, then you can pick.",
      label: "The child or grown-up can type",
      placeholder: "A few words is enough",
    },
  };
  const MOVEMENTS = {
    shake: {
      title: "Shake hands",
      instruction: "Gently shake both hands. Keep your feet still.",
    },
    stretch: {
      title: "Reach up",
      instruction: "Reach both hands up. Slowly lower them to your sides.",
    },
    press: {
      title: "Press hands",
      instruction: "Put palms together. Press gently, then let go.",
    },
    march: {
      title: "March in place",
      instruction: "Take small, slow steps without moving across the room.",
    },
  };

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
    lastChoices: [],
    timerId: null,
    timerKind: null,
    timerRemaining: 0,
    timerTotal: 0,
    selectedMovement: null,
    pauseSeconds: 20,
  };

  const byId = (id) => document.getElementById(id);
  const shell = byId("coach-shell");
  const welcomePanel = byId("welcome-panel");
  const practicePanel = byId("practice-panel");
  const planCard = byId("plan-card");
  const grownUpView = byId("grown-up-view");
  const preferencesPanel = byId("preferences-panel");
  const preferencesButton = byId("preferences-button");
  const grownUpButton = byId("grown-up-button");
  const startPractice = byId("start-practice");
  const conversation = byId("conversation");
  const starterChoices = byId("starter-choices");
  const responseChoices = byId("response-choices");
  const form = byId("coach-form");
  const input = byId("child-message");
  const toolDrawer = byId("tool-drawer");
  const dontUnderstand = byId("dont-understand");
  const dontKnow = byId("dont-know");
  const endSession = byId("end-session");
  const turnProgress = byId("turn-progress");
  const loopSteps = Array.from(document.querySelectorAll("#loop-steps li"));
  const readAloudToggle = byId("read-aloud-toggle");
  const largeTextToggle = byId("large-text-toggle");
  const reduceMotionToggle = byId("reduce-motion-toggle");
  const modeBanner = byId("support-mode-banner");
  const supportWorkspace = byId("support-workspace");
  const pictureWorkspace = byId("picture-workspace");
  const movementWorkspace = byId("movement-workspace");
  const quietWorkspace = byId("quiet-workspace");
  const grownupWorkspace = byId("grownup-workspace");
  const movementGuide = byId("movement-guide");
  const breathingOrb = byId("breathing-orb");

  function mode() {
    return MODES[state.supportPreference] || MODES["two clear choices"];
  }

  function makeIcon(name, className) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    if (className) svg.setAttribute("class", className);
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#rc-icon-${name}`);
    svg.appendChild(use);
    return svg;
  }

  function setIcon(svg, name) {
    const use = svg.querySelector("use");
    if (use) use.setAttribute("href", `#rc-icon-${name}`);
  }

  function iconForChoice(text) {
    const value = String(text).toLowerCase();
    if (/grown|adult|help|tell|ask/.test(value)) return "grownup";
    if (/breath|air|belly/.test(value)) return "breath";
    if (/move|shake|march|stretch|body/.test(value)) return "move";
    if (/quiet|pause|wait|still/.test(value)) return "pause";
    if (/feel|sad|mad|upset|worried/.test(value)) return "feeling";
    if (/again|try|step|plan/.test(value)) return "try";
    if (/share|turn/.test(value)) return "sharing";
    return "choice";
  }

  function applyDisplayPreferences() {
    document.body.classList.toggle("large-text", Boolean(state.displayPreferences.largeText));
    document.body.classList.toggle("reduce-motion", Boolean(state.displayPreferences.reduceMotion));
    readAloudToggle.checked = Boolean(state.displayPreferences.readAloud);
    largeTextToggle.checked = Boolean(state.displayPreferences.largeText);
    reduceMotionToggle.checked = Boolean(state.displayPreferences.reduceMotion);
  }

  function saveDisplayPreferences() {
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify(state.displayPreferences));
    } catch (_error) {
      // Display preferences are optional and stay on this device when available.
    }
  }

  function maybeSpeak(text) {
    if (!state.displayPreferences.readAloud || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
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

  function updateGrownUpGuide() {
    const steps = [
      ["I am here. Pick one small hard moment.", "Point, tap a choice, or use a few words."],
      ["Let us notice what your body is doing.", "Point to a feeling or name one body clue."],
      ["We only need one small thing to try.", "Choose one of the two ideas."],
      ["We can try it together, and we can stop.", "Try the small tool with your grown-up."],
      ["Did it help a little, a lot, or not yet?", "Tap the answer that fits. Any answer is okay."],
      ["Let us read your next-time plan together.", "Keep the plan, or ask to change it."],
    ];
    const selected = steps[Math.min(state.turnCount, steps.length - 1)];
    byId("grownup-script").textContent = selected[0];
    byId("child-script").textContent = selected[1];
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
    updateGrownUpGuide();
  }

  function renderChoices(choices) {
    state.lastChoices = Array.isArray(choices) ? choices.slice(0, 3) : [];
    responseChoices.replaceChildren();
    for (const value of state.lastChoices.slice(0, mode().choiceLimit)) {
      const choice = String(value).slice(0, 80);
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.message = choice;
      if (state.supportPreference === "pictures and words") {
        button.classList.add("picture-choice");
        button.appendChild(makeIcon(iconForChoice(choice), "choice-icon"));
        const label = document.createElement("span");
        label.textContent = choice;
        button.appendChild(label);
      } else {
        button.textContent = choice;
      }
      button.addEventListener("click", function () {
        void sendMessage(button.dataset.message || "");
      });
      responseChoices.appendChild(button);
    }
  }

  function stopTimer() {
    if (state.timerId !== null) window.clearInterval(state.timerId);
    state.timerId = null;
    breathingOrb.classList.remove("is-breathing");
    byId("start-movement-timer").textContent = "Start 20 seconds";
    byId("start-quiet-timer").textContent = "Start quiet pause";
  }

  function timerElements(kind) {
    return kind === "movement"
      ? { ring: byId("movement-timer-ring"), text: byId("movement-timer-text"), button: byId("start-movement-timer") }
      : { ring: byId("quiet-timer-ring"), text: byId("quiet-timer-text"), button: byId("start-quiet-timer") };
  }

  function paintTimer(kind) {
    const elements = timerElements(kind);
    const elapsed = Math.max(0, state.timerTotal - state.timerRemaining);
    const progress = state.timerTotal ? Math.round((elapsed / state.timerTotal) * 100) : 0;
    elements.ring.style.setProperty("--timer-progress", String(progress));
    elements.text.textContent = String(state.timerRemaining);
  }

  function startTimer(kind, total) {
    const elements = timerElements(kind);
    if (state.timerId !== null && state.timerKind === kind) {
      stopTimer();
      elements.button.textContent = "Keep going";
      return;
    }
    stopTimer();
    if (state.timerRemaining <= 0 || state.timerKind !== kind || state.timerTotal !== total) {
      state.timerRemaining = total;
      state.timerTotal = total;
    }
    state.timerKind = kind;
    elements.button.textContent = "Pause";
    if (kind === "quiet") {
      breathingOrb.classList.add("is-breathing");
      byId("quiet-cue").textContent = "Breathe normally. You can finish anytime.";
    }
    paintTimer(kind);
    state.timerId = window.setInterval(function () {
      state.timerRemaining -= 1;
      paintTimer(kind);
      if (state.timerRemaining <= 0) {
        stopTimer();
        elements.button.textContent = "Done";
        if (kind === "quiet") byId("quiet-cue").textContent = "The quiet pause is done. Notice what feels different.";
      }
    }, 1000);
  }

  function finishSupportActivity(kind) {
    stopTimer();
    if (state.turnCount === 0) {
      const message = kind === "movement"
        ? "Movement done. Now pick one small hard moment below."
        : "Quiet pause done. When you are ready, pick one small hard moment below.";
      const status = kind === "movement" ? byId("movement-instruction") : byId("quiet-cue");
      status.textContent = message;
      starterChoices.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      starterChoices.querySelector("button")?.focus();
      return;
    }
    if (kind === "movement") {
      const title = state.selectedMovement ? MOVEMENTS[state.selectedMovement].title : "a small movement";
      void sendMessage(`I tried ${title.toLowerCase()} with my grown-up. Please help me check if it helped.`);
    } else {
      void sendMessage("I took a quiet pause with my grown-up. Please help me notice what feels different.");
    }
  }

  function syncModeRadios(value) {
    for (const radio of document.querySelectorAll('input[type="radio"][name^="support-"]')) {
      radio.checked = radio.value === value;
    }
  }

  function applySupportMode(value, announce) {
    if (!MODES[value]) value = "two clear choices";
    stopTimer();
    state.timerKind = null;
    state.supportPreference = value;
    const active = mode();
    syncModeRadios(value);
    document.body.dataset.supportMode = active.slug;
    setIcon(byId("active-support-icon"), active.icon);
    byId("active-support-title").textContent = active.title;
    byId("active-support-description").textContent = active.description;
    byId("child-message-label").textContent = active.label;
    input.placeholder = active.placeholder;

    pictureWorkspace.hidden = value !== "pictures and words";
    movementWorkspace.hidden = value !== "movement break";
    quietWorkspace.hidden = value !== "quiet pause";
    grownupWorkspace.hidden = value !== "grown-up help";
    supportWorkspace.hidden = !["pictures and words", "movement break", "quiet pause", "grown-up help"].includes(value);
    toolDrawer.hidden = ["movement break", "quiet pause", "grown-up help"].includes(value);
    modeBanner.hidden = false;
    renderChoices(state.lastChoices);
    updateGrownUpGuide();

    if (state.turnCount === 0) {
      const firstCoachMessage = conversation.querySelector(".coach-message p");
      if (firstCoachMessage) firstCoachMessage.textContent = active.intro;
    }
    if (announce) {
      byId("support-change-status").textContent = `${active.title} is on. Your practice is still here.`;
      maybeSpeak(`${active.title} is on.`);
    }
  }

  function showLockedScreen() {
    state.locked = true;
    stopTimer();
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
    belief.textContent = "Thank you for telling. This is important, and it is not your fault.";
    const message = document.createElement("p");
    message.textContent = "Please show this screen to a caregiver, teacher, counselor, or another trusted grown-up nearby.";
    const note = document.createElement("p");
    note.className = "locked-note";
    note.textContent = "The chat is paused. A simulated demo alert was recorded.";
    panel.append(icon, heading, belief, message, note);
    shell.appendChild(panel);
    document.title = "Find a safe grown-up - Resilience Coach";
  }

  function toolMeta(result) {
    return result?._meta?.resilienceCoach || result?.metadata?._meta?.resilienceCoach || null;
  }

  function applyToolResult(result) {
    const metadata = toolMeta(result);
    if (metadata?.child_id) state.childId = metadata.child_id;
    if (metadata?.server_origin) state.serverOrigin = String(metadata.server_origin).replace(/\/$/, "");
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
    stopTimer();
    state.summary = summary || null;
    practicePanel.hidden = true;
    welcomePanel.hidden = true;
    grownUpView.hidden = true;
    planCard.hidden = false;
    byId("plan-heading").textContent = String(closingMessage || "Practice complete").slice(0, 180);
    byId("plan-text").textContent = summary?.next_time_plan || "When something feels hard, I will pause and ask my grown-up what to try.";
    tagList(byId("plan-strategies"), Array.isArray(summary?.practiced_strategies) ? summary.practiced_strategies : []);
    planCard.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
    maybeSpeak(byId("plan-text").textContent || "");
  }

  async function sendMessage(message, end) {
    const clean = String(message || "").replace(/\s+/g, " ").trim();
    if (!clean || state.busy || state.locked) return;
    stopTimer();
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
      addMessage("A grown-up needs to help me connect. We can pause here.", "coach");
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
    const status = byId("grown-up-status");
    const details = byId("grown-up-summary");
    byId("grown-up-strategies").textContent = Array.isArray(summary?.practiced_strategies) && summary.practiced_strategies.length > 0 ? summary.practiced_strategies.join(", ") : "None saved yet";
    byId("grown-up-plan").textContent = summary?.next_time_plan || "No plan saved yet";
    byId("grown-up-preference").textContent = summary?.support_preference || state.supportPreference;
    byId("grown-up-count").textContent = String(Number(summary?.session_count) || 0);
    status.hidden = true;
    details.hidden = false;
  }

  async function openGrownUpView() {
    if (state.locked) return;
    stopTimer();
    state.previousPanel = currentPanel();
    selectPanel("grown-up");
    const status = byId("grown-up-status");
    const details = byId("grown-up-summary");
    status.hidden = false;
    status.textContent = "Loading the synthetic practice summary...";
    details.hidden = true;
    grownUpView.focus();
    if (state.summary) renderGrownUpSummary(state.summary);
    try {
      const response = await fetch(`${state.serverOrigin}/demo/profile/${encodeURIComponent(state.childId)}`, { headers: { accept: "application/json" } });
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

  function openPreferences() {
    preferencesPanel.hidden = false;
    preferencesButton.setAttribute("aria-expanded", "true");
    syncModeRadios(state.supportPreference);
    preferencesPanel.querySelector("input")?.focus();
  }

  function closePreferences() {
    preferencesPanel.hidden = true;
    preferencesButton.setAttribute("aria-expanded", "false");
    preferencesButton.focus();
  }

  startPractice.addEventListener("click", function () {
    const selected = document.querySelector('input[name="support-welcome"]:checked');
    applySupportMode(selected?.value || "two clear choices", false);
    state.started = true;
    selectPanel("practice");
    const matchingStarter = starterChoices.querySelector(`[data-child-id="${state.childId}"]`);
    if (matchingStarter) matchingStarter.classList.add("is-suggested");
    if (state.supportPreference === "movement break") {
      movementWorkspace.querySelector("button")?.focus();
    } else if (state.supportPreference === "quiet pause") {
      byId("start-quiet-timer").focus();
    } else if (state.supportPreference === "grown-up help") {
      byId("grownup-two-choices").focus();
    } else {
      matchingStarter?.focus();
    }
  });

  for (const button of starterChoices.querySelectorAll("button")) {
    button.addEventListener("click", function () {
      if (state.turnCount === 0 && button.dataset.childId) state.childId = button.dataset.childId;
      void sendMessage(button.dataset.starter || button.textContent || "");
    });
  }

  for (const button of document.querySelectorAll("[data-tool]")) {
    button.addEventListener("click", function () {
      void sendMessage(button.dataset.tool || button.textContent || "");
    });
  }

  for (const button of document.querySelectorAll("[data-movement]")) {
    button.addEventListener("click", function () {
      state.selectedMovement = button.dataset.movement;
      const selected = MOVEMENTS[state.selectedMovement];
      for (const option of document.querySelectorAll("[data-movement]")) option.classList.toggle("is-selected", option === button);
      movementGuide.hidden = false;
      byId("movement-title").textContent = selected.title;
      byId("movement-instruction").textContent = selected.instruction;
      state.timerRemaining = 20;
      state.timerTotal = 20;
      paintTimer("movement");
      byId("start-movement-timer").focus();
    });
  }

  for (const button of document.querySelectorAll("[data-pause-seconds]")) {
    button.addEventListener("click", function () {
      stopTimer();
      state.pauseSeconds = Number(button.dataset.pauseSeconds) || 20;
      state.timerRemaining = state.pauseSeconds;
      state.timerTotal = state.pauseSeconds;
      for (const option of document.querySelectorAll("[data-pause-seconds]")) option.classList.toggle("is-selected", option === button);
      paintTimer("quiet");
      byId("quiet-cue").textContent = "Get comfortable. Start when you are ready.";
    });
  }

  byId("start-movement-timer").addEventListener("click", function () { startTimer("movement", 20); });
  byId("finish-movement").addEventListener("click", function () { finishSupportActivity("movement"); });
  byId("start-quiet-timer").addEventListener("click", function () { startTimer("quiet", state.pauseSeconds); });
  byId("finish-quiet").addEventListener("click", function () { finishSupportActivity("quiet"); });

  byId("grownup-two-choices").addEventListener("click", function () {
    if (state.turnCount === 0) {
      byId("grownup-together-status").textContent = "Choose one hard-moment card below.";
      starterChoices.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
      starterChoices.querySelector("button")?.focus();
    } else {
      void sendMessage("Please give the child and grown-up exactly two short choices for the next step.");
    }
  });
  byId("grownup-read-together").addEventListener("click", function () {
    byId("grownup-together-status").textContent = "You read it together. Take your time with the next choice.";
    responseChoices.querySelector("button")?.focus();
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    void sendMessage(input.value);
  });
  dontUnderstand.addEventListener("click", function () { void sendMessage("I don't understand. Please make it simpler."); });
  dontKnow.addEventListener("click", function () { void sendMessage("I don't know."); });
  endSession.addEventListener("click", function () { void sendMessage("I am ready to make my next-time plan and stop.", true); });

  preferencesButton.addEventListener("click", function () {
    if (preferencesPanel.hidden) openPreferences(); else closePreferences();
  });
  byId("change-support-inline").addEventListener("click", openPreferences);
  byId("close-preferences").addEventListener("click", closePreferences);
  byId("apply-support-mode").addEventListener("click", function () {
    const selected = document.querySelector('input[name="support-settings"]:checked');
    applySupportMode(selected?.value || state.supportPreference, true);
    if (state.started) {
      window.setTimeout(function () {
        preferencesPanel.hidden = true;
        preferencesButton.setAttribute("aria-expanded", "false");
        modeBanner.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
        modeBanner.focus?.();
      }, 450);
    }
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

  grownUpButton.addEventListener("click", function () { void openGrownUpView(); });
  byId("show-grown-up-summary").addEventListener("click", function () { void openGrownUpView(); });
  byId("close-grown-up").addEventListener("click", closeGrownUpView);
  byId("new-practice").addEventListener("click", function () { window.location.assign(`${state.serverOrigin}/demo`); });

  window.addEventListener("message", function (event) {
    if (event.source !== window.parent) return;
    const message = event.data;
    if (!message || message.jsonrpc !== "2.0") return;
    if (message.method === "ui/notifications/tool-result") applyToolResult(message.params);
  }, { passive: true });

  window.addEventListener("openai:set_globals", function (event) {
    applyToolResult(event.detail?.globals?.toolOutput);
  }, { passive: true });

  applyDisplayPreferences();
  applySupportMode("two clear choices", false);
  applyToolResult(window.openai?.toolOutput);
  if (window.location.hash === "#grown-up-view") void openGrownUpView();
})();
