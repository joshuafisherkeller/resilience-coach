(function () {
  "use strict";

  const config = window.__RESILIENCE_COACH_CONFIG__ || {};
  const preferenceKey = "resilience-coach-display-preferences-v4";
  const assetBase = String(config.assetBase || "").replace(/\/$/, "");
  const asset = (path) => `${assetBase}/${path}`;

  const FEELINGS = {
    frustrated: {
      label: "Frustrated",
      image: "emotions/frustrated.webp",
      alt: "Child looks frustrated while working on a drawing.",
    },
    disappointed: {
      label: "Disappointed",
      image: "emotions/disappointed.webp",
      alt: "Child looks down with softened shoulders beside a toy.",
    },
    worried: {
      label: "Worried",
      image: "emotions/worried.webp",
      alt: "Child holds hands close and looks worried beside a small plant.",
    },
    confused: {
      label: "Confused",
      image: "emotions/confused.webp",
      alt: "Child pauses over a puzzle with a questioning expression.",
    },
    unsure: {
      label: "Unsure",
      image: "emotions/unsure.webp",
      alt: "Child looks between a ball and blocks with an unsure expression.",
    },
  };

  const BODY_CUES = {
    "tight-hands": {
      label: "Tight hands",
      image: "body-cues/tight-hands.webp",
      alt: "Child looks down at two gently tightened hands.",
    },
    "hot-face": {
      label: "Warm face",
      image: "body-cues/hot-face.webp",
      alt: "Child touches one warm cheek.",
    },
    "fast-heart": {
      label: "Fast heartbeat",
      image: "body-cues/fast-heart.webp",
      alt: "Child rests a hand on the chest with soft pulse rings over the shirt.",
    },
    "tight-tummy": {
      label: "Tight tummy",
      image: "body-cues/tight-tummy.webp",
      alt: "Child rests both hands on the tummy with soft tension rings over clothing.",
    },
    "watery-eyes": {
      label: "Watery eyes",
      image: "body-cues/watery-eyes.webp",
      alt: "Child has glossy watery eyes and a serious expression.",
    },
    "frozen-still": {
      label: "Frozen still",
      image: "body-cues/frozen-still.webp",
      alt: "Child stands still beside a half-started block structure.",
    },
  };

  const STRATEGIES = {
    "ask-for-a-turn": {
      title: "Ask for a turn",
      description: "Practice one short sentence together.",
      image: "strategies/ask-for-a-turn.webp",
      alt: "Two children practice asking for a turn with a toy.",
      kind: "words",
      grownup: "Say the words slowly once. Let the child point or speak.",
      childChoices: [
        "Can I have a turn when you are done?",
        "Can you help me wait for a turn?",
      ],
    },
    "shake-hands-softly": {
      title: "Soften tight hands",
      description: "Shake hands gently, then let them rest.",
      image: "strategies/shake-hands-softly.webp",
      alt: "Seated child softly shakes two relaxed hands.",
      kind: "movement",
      grownup: "Try the small movement too. Stop if it feels uncomfortable.",
      childChoices: ["I can shake softly with you.", "I want a different idea."],
    },
    "ask-grown-up-for-help": {
      title: "Ask a grown-up for help",
      description: "A grown-up can help with the next small step.",
      image: "strategies/ask-grown-up-for-help.webp",
      alt: "Child asks a nearby grown-up for help with a picture activity.",
      kind: "words",
      grownup: "Come to the child's level and offer two small choices.",
      childChoices: ["Can you help me?", "Can we choose the next step together?"],
    },
    "try-one-smaller-step": {
      title: "Try one smaller step",
      description: "Pick one little part instead of the whole thing.",
      image: "strategies/try-one-smaller-step.webp",
      alt: "Child places one paper shape into an unfinished collage.",
      kind: "action",
      grownup: "Point out one manageable part without taking over.",
      childChoices: ["I can try this one part.", "Please help me pick one part."],
    },
    "switch-and-try-something-else": {
      title: "Switch and try something else",
      description: "The first idea is not the only idea.",
      image: "strategies/switch-and-try-something-else.webp",
      alt: "Child moves a choice marker from one picture card to another.",
      kind: "action",
      grownup: "Show two possible next ideas and let the child choose.",
      childChoices: ["I want to try a different way.", "Show me two ideas."],
    },
    "choose-what-happens-next": {
      title: "Choose what happens next",
      description: "The plan changed, but one next choice is still yours.",
      image: "strategies/choose-what-happens-next.webp",
      alt: "Child chooses between two simple activity pictures.",
      kind: "choice",
      grownup: "Offer two real choices that are both possible now.",
      childChoices: ["I choose this next.", "Please show me two choices."],
    },
    "quiet-pause": {
      title: "Take a quiet pause",
      description: "Use fewer words for a short time.",
      image: "strategies/quiet-pause.webp",
      alt: "Child and grown-up sit quietly near a small timer.",
      kind: "quiet",
      grownup: "Stay nearby without asking questions. The child can finish early.",
      childChoices: ["I want quiet with you nearby.", "I want a different idea."],
    },
  };

  const SCENARIOS = {
    sharing: {
      id: "sharing",
      childId: "demo-sharing",
      label: "sharing and waiting",
      title: "Sharing and waiting",
      starter: "Someone else has the toy, and waiting for a turn feels hard.",
      feelings: ["frustrated", "disappointed", "worried"],
      bodyCues: ["tight-hands", "hot-face", "fast-heart"],
      strategies: ["ask-for-a-turn", "shake-hands-softly", "ask-grown-up-for-help"],
      story: [
        {
          image: "scenarios/sharing/sharing-01-someone-has-the-toy.webp",
          alt: "One child watches while another child plays with a wooden toy.",
          eyebrow: "First",
          title: "Someone else has the toy.",
          text: "Waiting can feel hard when you really want a turn.",
        },
        {
          image: "scenarios/sharing/sharing-02-notice-body-clues.webp",
          alt: "Child notices two tight hands while waiting for the toy.",
          eyebrow: "Notice",
          title: "The body gives clues.",
          text: "Hands might feel tight. A face might feel warm. These clues help us notice the hard moment.",
        },
        {
          image: "scenarios/sharing/sharing-03-pause-and-choose.webp",
          alt: "Child pauses with a nearby grown-up while the other child keeps playing.",
          eyebrow: "Choose",
          title: "A small pause makes room for a choice.",
          text: "The grown-up stays close. The child can soften their hands, ask for a turn, or ask for help.",
        },
        {
          image: "scenarios/sharing/sharing-04-practice-turn-words.webp",
          alt: "Children practice turn-taking words while a grown-up stays nearby.",
          eyebrow: "Practice",
          title: "They practice simple turn words.",
          text: "Practicing does not make the other child hurry. It helps the child know what they can try.",
        },
        {
          image: "scenarios/sharing/sharing-05-check-and-plan.webp",
          alt: "Child and grown-up look at two simple picture choices while another child still has the toy.",
          eyebrow: "Check and plan",
          title: "There is a next step.",
          text: "The toy may still be busy. The child can check their body and remember one plan for next time.",
        },
      ],
      planFor(strategyId) {
        const plans = {
          "ask-for-a-turn": "When waiting for a turn feels hard, I will ask for a turn with one short sentence.",
          "shake-hands-softly": "When waiting makes my hands feel tight, I will shake them softly and ask what I can do next.",
          "ask-grown-up-for-help": "When waiting for a turn feels hard, I will ask my grown-up to help me choose a next step.",
        };
        return plans[strategyId] || plans["ask-grown-up-for-help"];
      },
    },
    mistakes: {
      id: "mistakes",
      childId: "demo-mistakes",
      label: "making a mistake",
      title: "Making a mistake",
      starter: "I noticed a mistake in something I was making, and I felt upset.",
      feelings: ["frustrated", "disappointed", "confused"],
      bodyCues: ["tight-hands", "watery-eyes", "tight-tummy"],
      strategies: ["try-one-smaller-step", "switch-and-try-something-else", "ask-grown-up-for-help"],
      story: [
        {
          image: "scenarios/mistakes/mistake-01-notice-the-mistake.webp",
          alt: "Child notices a misplaced shape in a paper collage.",
          eyebrow: "First",
          title: "Something did not go as planned.",
          text: "A mistake can feel big when you worked hard on something.",
        },
        {
          image: "scenarios/mistakes/mistake-02-notice-body-clues.webp",
          alt: "Child notices a tight tummy while looking at the collage.",
          eyebrow: "Notice",
          title: "The child notices body clues.",
          text: "Hands, eyes, or the tummy might feel different. Noticing comes before fixing.",
        },
        {
          image: "scenarios/mistakes/mistake-03-pause-and-find-small-step.webp",
          alt: "Child and grown-up look closely at one small repair step.",
          eyebrow: "Choose",
          title: "They find one smaller step.",
          text: "The whole project does not need to be solved at once.",
        },
        {
          image: "scenarios/mistakes/mistake-04-try-or-repair.webp",
          alt: "Child tries one repair while a grown-up stays nearby.",
          eyebrow: "Practice",
          title: "The child tries or asks for help.",
          text: "Trying one part is practice, even when the result stays imperfect.",
        },
        {
          image: "scenarios/mistakes/mistake-05-check-and-plan.webp",
          alt: "Child and grown-up review a simple picture plan beside the collage.",
          eyebrow: "Check and plan",
          title: "They remember what to try next time.",
          text: "A mistake can still feel disappointing. The plan gives the child a next action.",
        },
      ],
      planFor(strategyId) {
        const plans = {
          "try-one-smaller-step": "When a mistake feels too big, I will choose one smaller part to try.",
          "switch-and-try-something-else": "When my first idea is not helping yet, I will switch and try one different way.",
          "ask-grown-up-for-help": "When a mistake feels too big, I will ask my grown-up to help me find one small step.",
        };
        return plans[strategyId] || plans["ask-grown-up-for-help"];
      },
    },
    change: {
      id: "change",
      childId: "demo-change",
      label: "a change of plans",
      title: "A change of plans",
      starter: "The plan changed because it started raining, and I did not like the new plan.",
      feelings: ["disappointed", "worried", "unsure"],
      bodyCues: ["tight-tummy", "frozen-still", "fast-heart"],
      strategies: ["choose-what-happens-next", "quiet-pause", "ask-grown-up-for-help"],
      story: [
        {
          image: "scenarios/change/change-01-hear-the-plan-changed.webp",
          alt: "Child hears that outdoor play changed because rain is falling.",
          eyebrow: "First",
          title: "The expected plan changes.",
          text: "The rain is not the child's choice. Feeling disappointed makes sense.",
        },
        {
          image: "scenarios/change/change-02-notice-body-clues.webp",
          alt: "Child hugs a ball and notices body clues beside a rainy window.",
          eyebrow: "Notice",
          title: "The child notices disappointment.",
          text: "The tummy might feel tight. The body might become very still.",
        },
        {
          image: "scenarios/change/change-03-what-can-i-choose.webp",
          alt: "Grown-up shows two possible indoor activity pictures.",
          eyebrow: "Choose",
          title: "Some choices are still possible.",
          text: "The child cannot choose the weather, but they can choose one thing that happens next.",
        },
        {
          image: "scenarios/change/change-04-practice-the-new-plan.webp",
          alt: "Child begins an indoor block activity with a grown-up nearby.",
          eyebrow: "Practice",
          title: "They begin the new plan together.",
          text: "The child does not have to love the change before trying one next step.",
        },
        {
          image: "scenarios/change/change-05-check-and-plan.webp",
          alt: "Child and grown-up check a simple picture plan near indoor blocks.",
          eyebrow: "Check and plan",
          title: "They make a plan for another change.",
          text: "The feeling can stay for a while. The next-time plan keeps one useful choice close.",
        },
      ],
      planFor(strategyId) {
        const plans = {
          "choose-what-happens-next": "When a plan changes, I will choose one thing I can do next.",
          "quiet-pause": "When a change feels like too much, I will take a short quiet pause with my grown-up nearby.",
          "ask-grown-up-for-help": "When a plan changes, I will ask my grown-up to show me two possible next choices.",
        };
        return plans[strategyId] || plans["ask-grown-up-for-help"];
      },
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
    displayPreferences: loadDisplayPreferences(),
    scenario: null,
    storyIndex: 0,
    stage: "notice",
    selectedFeeling: null,
    selectedBodyCue: null,
    selectedStrategy: null,
    selectedPracticeWords: null,
    selectedCheck: null,
    selectedPlan: null,
    busy: false,
    locked: false,
    summary: null,
    currentPanel: "welcome",
    previousPanel: "welcome",
    timerId: null,
    timerRemaining: 20,
    requestVersion: 0,
  };

  const byId = (id) => document.getElementById(id);
  const panelIds = {
    welcome: "welcome-panel",
    scenario: "scenario-panel",
    story: "story-panel",
    practice: "practice-panel",
    plan: "plan-card",
    "grown-up": "grown-up-view",
  };

  function showPanel(name) {
    for (const [panelName, id] of Object.entries(panelIds)) {
      byId(id).hidden = panelName !== name;
    }
    state.currentPanel = name;
    window.scrollTo({ top: 0, behavior: state.displayPreferences.reduceMotion ? "auto" : "smooth" });
  }

  function saveDisplayPreferences() {
    try {
      window.localStorage.setItem(preferenceKey, JSON.stringify(state.displayPreferences));
    } catch (_error) {
      // Preferences are optional and remain on this device when storage is available.
    }
  }

  function applyDisplayPreferences() {
    document.body.classList.toggle("large-text", Boolean(state.displayPreferences.largeText));
    document.body.classList.toggle("reduce-motion", Boolean(state.displayPreferences.reduceMotion));
    byId("read-aloud-toggle").checked = Boolean(state.displayPreferences.readAloud);
    byId("large-text-toggle").checked = Boolean(state.displayPreferences.largeText);
    byId("reduce-motion-toggle").checked = Boolean(state.displayPreferences.reduceMotion);
  }

  function maybeSpeak(text) {
    if (!state.displayPreferences.readAloud || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(String(text));
    utterance.rate = 0.86;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  function setCoachMessage(message) {
    const clean = String(message || "").trim();
    if (!clean) return;
    byId("coach-message").textContent = clean;
    maybeSpeak(clean);
  }

  function setBusy(value) {
    state.busy = value;
    byId("coach-note").setAttribute("aria-busy", String(value));
    byId("coach-note").classList.toggle("is-thinking", value);
    if (value) byId("coach-message").textContent = "The coach is thinking about what you chose...";
    for (const button of byId("activity-stage").querySelectorAll("button")) {
      button.disabled = value || button.dataset.ready === "false";
    }
  }

  function stopTimer() {
    if (state.timerId !== null) window.clearInterval(state.timerId);
    state.timerId = null;
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

  function showLockedScreen() {
    state.locked = true;
    stopTimer();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    const shell = byId("coach-shell");
    shell.replaceChildren();
    const panel = document.createElement("section");
    panel.className = "locked-panel";
    panel.innerHTML = `<div class="locked-symbol" aria-hidden="true">!</div><p class="eyebrow">The practice is paused</p><h1>Let's find a safe grown-up now.</h1><p>Thank you for telling. This is important, and it is not your fault.</p><p>Please show this screen to a caregiver, teacher, counselor, or another trusted grown-up nearby.</p><small>A simulated demo alert was recorded. No message was sent.</small>`;
    shell.appendChild(panel);
    document.title = "Find a safe grown-up - Resilience Coach";
  }

  async function coachTurn(message, step, endSession) {
    if (state.busy || state.locked || !state.scenario) return null;
    const requestVersion = state.requestVersion;
    stopTimer();
    setBusy(true);
    try {
      const response = await fetch(`${state.serverOrigin}/coach`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          child_id: state.childId,
          session_id: state.sessionId,
          message: String(message).replace(/\s+/g, " ").trim(),
          end_session: Boolean(endSession),
          support_preference: "pictures and words",
          scenario: state.scenario.id,
          experience_step: step,
        }),
      });
      const result = await response.json();
      if (requestVersion !== state.requestVersion) return null;
      if (result.locked) {
        showLockedScreen();
        return result;
      }
      if (!response.ok) throw new Error("coach unavailable");
      if (result.ended) {
        renderCompletion(result.summary, result.message);
        return result;
      }
      setCoachMessage(result.message);
      return result;
    } catch (_error) {
      if (requestVersion === state.requestVersion) {
        setCoachMessage("The coach connection needs a grown-up's help. The picture practice can pause here.");
      }
      return null;
    } finally {
      if (!state.locked && requestVersion === state.requestVersion) setBusy(false);
    }
  }

  function resetJourney() {
    stopTimer();
    state.requestVersion += 1;
    state.sessionId = newSessionId();
    state.scenario = null;
    state.storyIndex = 0;
    state.stage = "notice";
    state.selectedFeeling = null;
    state.selectedBodyCue = null;
    state.selectedStrategy = null;
    state.selectedPracticeWords = null;
    state.selectedCheck = null;
    state.selectedPlan = null;
    state.summary = null;
    state.busy = false;
    setCoachMessage("We can take this one small step at a time.");
  }

  function selectScenario(scenarioId) {
    const scenario = SCENARIOS[scenarioId];
    if (!scenario) return;
    resetJourney();
    state.scenario = scenario;
    state.childId = scenario.childId;
    state.storyIndex = 0;
    renderStory();
    showPanel("story");
    void coachTurn(scenario.starter, "start", false);
  }

  function renderStory() {
    const scene = state.scenario?.story[state.storyIndex];
    if (!scene) return;
    byId("story-image").src = asset(scene.image);
    byId("story-image").alt = scene.alt;
    byId("story-eyebrow").textContent = scene.eyebrow;
    byId("story-title").textContent = scene.title;
    byId("story-text").textContent = scene.text;
    byId("story-progress").textContent = `Picture ${state.storyIndex + 1} of ${state.scenario.story.length}`;
    byId("story-previous").hidden = state.storyIndex === 0;
    byId("story-next").textContent = state.storyIndex === state.scenario.story.length - 1 ? "Practice this moment" : "Next picture";
  }

  function pictureButton(id, item, group, selected) {
    return `<button class="picture-choice${selected ? " is-selected" : ""}" type="button" data-group="${group}" data-value="${id}" aria-pressed="${selected ? "true" : "false"}"><img src="${asset(item.image)}" alt="${item.alt}" width="512" height="512"><span><strong>${item.label || item.title}</strong>${item.description ? `<small>${item.description}</small>` : ""}</span></button>`;
  }

  function updateStepper() {
    const order = ["notice", "choose", "try", "check", "plan"];
    const activeIndex = order.indexOf(state.stage);
    for (const item of document.querySelectorAll(".practice-steps li")) {
      const index = order.indexOf(item.dataset.step);
      item.classList.toggle("is-current", index === activeIndex);
      item.classList.toggle("is-complete", index < activeIndex);
    }
  }

  function stageHeader(eyebrow, title, text) {
    return `<div class="stage-heading"><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p>${text}</p></div>`;
  }

  function renderNoticeStage() {
    const scenario = state.scenario;
    const feelings = scenario.feelings.map((id) => pictureButton(id, FEELINGS[id], "feeling", state.selectedFeeling === id)).join("");
    const bodyCues = scenario.bodyCues.map((id) => pictureButton(id, BODY_CUES[id], "body", state.selectedBodyCue === id)).join("");
    return `${stageHeader("Notice", "What might this child notice?", "Pick one feeling and one body clue. More than one answer could fit.")}
      <div class="notice-layout">
        <figure class="stage-story-image"><img src="${asset(scenario.story[1].image)}" alt="${scenario.story[1].alt}" width="800" height="600"></figure>
        <div class="notice-choices">
          <fieldset><legend>A feeling</legend><div class="picture-grid three">${feelings}</div></fieldset>
          <fieldset><legend>A body clue</legend><div class="picture-grid three">${bodyCues}</div></fieldset>
        </div>
      </div>
      <button id="stage-continue" class="primary-button stage-continue" type="button" data-ready="${Boolean(state.selectedFeeling && state.selectedBodyCue)}" ${state.selectedFeeling && state.selectedBodyCue ? "" : "disabled"}>Choose one thing to try</button>`;
  }

  function renderChooseStage() {
    const cards = state.scenario.strategies.map((id) => pictureButton(id, STRATEGIES[id], "strategy", state.selectedStrategy === id)).join("");
    const feeling = FEELINGS[state.selectedFeeling]?.label.toLowerCase() || "hard";
    const body = BODY_CUES[state.selectedBodyCue]?.label.toLowerCase() || "different";
    return `${stageHeader("Choose", "Pick one small thing to try.", `The child might feel ${feeling} and notice ${body}. We only need one idea.`)}
      <div class="picture-grid strategy-grid">${cards}</div>
      <p class="choice-reassurance">If it does not help yet, that is useful information. We can switch.</p>
      <button id="stage-continue" class="primary-button stage-continue" type="button" data-ready="${Boolean(state.selectedStrategy)}" ${state.selectedStrategy ? "" : "disabled"}>Practice this together</button>`;
  }

  function renderTryStage() {
    const strategy = STRATEGIES[state.selectedStrategy];
    if (!strategy) {
      state.stage = "choose";
      return renderChooseStage();
    }
    const childChoices = strategy.childChoices.map((choice) => `<button class="word-choice${state.selectedPracticeWords === choice ? " is-selected" : ""}" type="button" data-practice-words="${choice}" aria-pressed="${state.selectedPracticeWords === choice}">${choice}</button>`).join("");
    const activity = strategy.kind === "quiet"
      ? `<div class="guided-activity quiet-activity"><div class="timer-disc"><span id="timer-number">${state.timerRemaining}</span><small>seconds</small></div><div><h3>A short quiet pause</h3><p id="timer-cue">The grown-up stays nearby. Finish early whenever you want.</p><button id="timer-button" class="quiet-button" type="button">Start 20 seconds</button></div></div>`
      : strategy.kind === "movement"
        ? `<div class="guided-activity movement-activity"><div class="movement-mark" aria-hidden="true">~</div><div><h3>Small, soft movement</h3><p>Shake both hands gently. Let them rest. Stop if it feels uncomfortable.</p></div></div>`
        : "";
    return `${stageHeader("Practice", `Try: ${strategy.title}`, "The goal is to practice, not to make every hard feeling disappear.")}
      <div class="practice-together-card">
        <figure><img src="${asset(strategy.image)}" alt="${strategy.alt}" width="512" height="512"></figure>
        <div class="practice-script">
          <div class="script-card grownup-script"><span>Grown-up can</span><p>${strategy.grownup}</p></div>
          <fieldset><legend>Child can point to or say</legend><div class="word-choice-grid">${childChoices}</div></fieldset>
          ${activity}
          <button id="choose-another-strategy" class="quiet-button" type="button">Choose a different idea</button>
        </div>
      </div>
      <button id="stage-continue" class="primary-button stage-continue" type="button" data-ready="${Boolean(state.selectedPracticeWords)}" ${state.selectedPracticeWords ? "" : "disabled"}>We practiced it</button>`;
  }

  function renderCheckStage() {
    const choices = [
      { id: "helped-a-little", label: "Helped a little", image: "emotions/calm-ready.webp", alt: "Child looks steady and ready beside three blocks." },
      { id: "not-yet", label: "Not yet", image: "emotions/unsure.webp", alt: "Child looks unsure while considering two possible activities." },
      { id: "grown-up-help", label: "I want grown-up help", image: "strategies/ask-grown-up-for-help.webp", alt: "Child asks a nearby grown-up for help." },
    ];
    const cards = choices.map((item) => pictureButton(item.id, item, "check", state.selectedCheck === item.id)).join("");
    return `${stageHeader("Check", "What do you notice now?", "Any answer is okay. A strategy can help a little, a lot, or not yet.")}
      <div class="picture-grid check-grid">${cards}</div>
      <button id="stage-continue" class="primary-button stage-continue" type="button" data-ready="${Boolean(state.selectedCheck)}" ${state.selectedCheck ? "" : "disabled"}>Make my next-time plan</button>`;
  }

  function renderPlanStage() {
    const mainPlan = state.scenario.planFor(state.selectedStrategy);
    const grownupPlan = state.scenario.planFor("ask-grown-up-for-help");
    const plans = Array.from(new Set([mainPlan, grownupPlan]));
    if (!state.selectedPlan) state.selectedPlan = plans[0];
    const planButtons = plans.map((plan) => `<button class="plan-choice${state.selectedPlan === plan ? " is-selected" : ""}" type="button" data-plan="${plan}" aria-pressed="${state.selectedPlan === plan}"><span aria-hidden="true">When</span><strong>${plan}</strong></button>`).join("");
    const checkText = state.selectedCheck === "not-yet" ? "The first idea did not help yet. The plan can still keep one useful next step." : "The plan keeps one small idea ready for another hard moment.";
    return `${stageHeader("Plan", "Which plan should we remember?", checkText)}
      <div class="plan-builder">
        <img src="${asset("completion/my-next-time-plan.webp")}" alt="Child and grown-up look together at a simple picture plan." width="800" height="600">
        <div class="plan-choice-list">${planButtons}</div>
      </div>
      <p class="choice-reassurance">This is a practice idea, not a rule. You can change it next time.</p>
      <button id="stage-continue" class="primary-button stage-continue" type="button">Save this plan and finish</button>`;
  }

  function renderStage() {
    stopTimer();
    state.timerRemaining = 20;
    updateStepper();
    const stage = byId("activity-stage");
    if (state.stage === "notice") stage.innerHTML = renderNoticeStage();
    if (state.stage === "choose") stage.innerHTML = renderChooseStage();
    if (state.stage === "try") stage.innerHTML = renderTryStage();
    if (state.stage === "check") stage.innerHTML = renderCheckStage();
    if (state.stage === "plan") stage.innerHTML = renderPlanStage();
    wireStageEvents();
    if (state.busy) setBusy(true);
  }

  function selectPictureChoice(button) {
    const group = button.dataset.group;
    const value = button.dataset.value;
    if (group === "feeling") state.selectedFeeling = value;
    if (group === "body") state.selectedBodyCue = value;
    if (group === "strategy") {
      state.selectedStrategy = value;
      state.selectedPracticeWords = null;
      state.selectedPlan = null;
    }
    if (group === "check") state.selectedCheck = value;
    renderStage();
  }

  function advanceStage() {
    if (state.busy) return;
    if (state.stage === "notice") {
      const feeling = FEELINGS[state.selectedFeeling]?.label || "unsure";
      const bodyCue = BODY_CUES[state.selectedBodyCue]?.label || "a body clue";
      state.stage = "choose";
      renderStage();
      void coachTurn(`In the ${state.scenario.label} picture, I picked ${feeling} and ${bodyCue}.`, "notice", false);
      return;
    }
    if (state.stage === "choose") {
      const strategy = STRATEGIES[state.selectedStrategy];
      state.stage = "try";
      renderStage();
      void coachTurn(`For this ${state.scenario.label} practice, I chose ${strategy.title}.`, "choose", false);
      return;
    }
    if (state.stage === "try") {
      const strategy = STRATEGIES[state.selectedStrategy];
      state.stage = "check";
      renderStage();
      void coachTurn(`We practiced ${strategy.title}. The child chose: ${state.selectedPracticeWords}`, "try", false);
      return;
    }
    if (state.stage === "check") {
      const labels = { "helped-a-little": "It helped a little.", "not-yet": "It did not help yet.", "grown-up-help": "I want my grown-up's help." };
      state.stage = "plan";
      renderStage();
      void coachTurn(labels[state.selectedCheck] || "I checked what changed.", "check", false);
      return;
    }
    if (state.stage === "plan") {
      void coachTurn(`My next-time plan is: ${state.selectedPlan}`, "plan", true);
    }
  }

  function startGuidedTimer() {
    if (state.timerId !== null) {
      stopTimer();
      byId("timer-button").textContent = "Keep going";
      return;
    }
    if (state.timerRemaining <= 0) state.timerRemaining = 20;
    byId("timer-button").textContent = "Pause";
    byId("timer-cue").textContent = "Quiet is enough. No need to talk.";
    state.timerId = window.setInterval(function () {
      state.timerRemaining -= 1;
      const number = byId("timer-number");
      if (number) number.textContent = String(state.timerRemaining);
      if (state.timerRemaining <= 0) {
        stopTimer();
        byId("timer-button").textContent = "Quiet pause finished";
        byId("timer-cue").textContent = "Now notice what feels the same or different.";
      }
    }, 1000);
  }

  function wireStageEvents() {
    for (const button of byId("activity-stage").querySelectorAll("[data-group]")) {
      button.addEventListener("click", () => selectPictureChoice(button));
    }
    for (const button of byId("activity-stage").querySelectorAll("[data-practice-words]")) {
      button.addEventListener("click", function () {
        const value = button.dataset.practiceWords;
        if (/different idea/i.test(value)) {
          state.stage = "choose";
          state.selectedStrategy = null;
          state.selectedPracticeWords = null;
        } else {
          state.selectedPracticeWords = value;
        }
        renderStage();
      });
    }
    for (const button of byId("activity-stage").querySelectorAll("[data-plan]")) {
      button.addEventListener("click", function () {
        state.selectedPlan = button.dataset.plan;
        renderStage();
      });
    }
    byId("stage-continue")?.addEventListener("click", advanceStage);
    byId("choose-another-strategy")?.addEventListener("click", function () {
      state.stage = "choose";
      state.selectedStrategy = null;
      state.selectedPracticeWords = null;
      renderStage();
    });
    byId("timer-button")?.addEventListener("click", startGuidedTimer);
  }

  function tagList(container, values) {
    container.replaceChildren();
    for (const value of values || []) {
      const tag = document.createElement("span");
      tag.textContent = value;
      container.appendChild(tag);
    }
  }

  function renderCompletion(summary, closingMessage) {
    stopTimer();
    state.summary = summary || null;
    showPanel("plan");
    byId("plan-heading").textContent = "You practiced one small hard moment.";
    byId("plan-text").textContent = summary?.next_time_plan || state.selectedPlan || "When something feels hard, I will ask my grown-up what to try.";
    tagList(byId("plan-strategies"), Array.isArray(summary?.practiced_strategies) ? summary.practiced_strategies : []);
    maybeSpeak(closingMessage || byId("plan-text").textContent);
  }

  function renderGrownUpSummary(summary) {
    byId("grown-up-strategies").textContent = Array.isArray(summary?.practiced_strategies) && summary.practiced_strategies.length > 0 ? summary.practiced_strategies.join(", ") : "None saved yet";
    byId("grown-up-plan").textContent = summary?.next_time_plan || "No plan saved yet";
    byId("grown-up-preference").textContent = "Pictures and words";
    byId("grown-up-count").textContent = String(Number(summary?.session_count) || 0);
    byId("grown-up-status").hidden = true;
    byId("grown-up-summary").hidden = false;
  }

  async function openGrownUpView() {
    if (state.locked) return;
    state.previousPanel = state.currentPanel;
    showPanel("grown-up");
    byId("grown-up-status").hidden = false;
    byId("grown-up-status").textContent = "Loading the synthetic practice summary...";
    byId("grown-up-summary").hidden = true;
    byId("grown-up-view").focus();
    if (state.summary) renderGrownUpSummary(state.summary);
    try {
      const response = await fetch(`${state.serverOrigin}/demo/profile/${encodeURIComponent(state.childId)}`, { headers: { accept: "application/json" } });
      if (!response.ok) throw new Error("summary unavailable");
      renderGrownUpSummary(await response.json());
    } catch (_error) {
      if (!state.summary) byId("grown-up-status").textContent = "The grown-up summary is taking a short pause.";
    }
  }

  function closeGrownUpView() {
    showPanel(state.previousPanel || "welcome");
    byId("grown-up-button").focus();
  }

  function openPreferences() {
    byId("preferences-panel").hidden = false;
    byId("preferences-button").setAttribute("aria-expanded", "true");
    byId("preferences-panel").querySelector("input")?.focus();
  }

  function closePreferences() {
    byId("preferences-panel").hidden = true;
    byId("preferences-button").setAttribute("aria-expanded", "false");
    byId("preferences-button").focus();
  }

  byId("begin-button").addEventListener("click", () => showPanel("scenario"));
  byId("scenario-back").addEventListener("click", () => showPanel("welcome"));
  for (const button of document.querySelectorAll("[data-scenario]")) {
    button.addEventListener("click", () => selectScenario(button.dataset.scenario));
  }
  byId("story-exit").addEventListener("click", function () {
    resetJourney();
    showPanel("scenario");
  });
  byId("story-previous").addEventListener("click", function () {
    state.storyIndex = Math.max(0, state.storyIndex - 1);
    renderStory();
  });
  byId("story-next").addEventListener("click", function () {
    if (state.storyIndex < state.scenario.story.length - 1) {
      state.storyIndex += 1;
      renderStory();
      return;
    }
    state.stage = "notice";
    renderStage();
    showPanel("practice");
  });

  byId("grown-up-help").addEventListener("click", function () {
    setCoachMessage("Your grown-up can say: I am here. We only need one small next step.");
    if (state.stage === "choose" && state.scenario.strategies.includes("ask-grown-up-for-help")) {
      state.selectedStrategy = "ask-grown-up-for-help";
      renderStage();
    }
  });
  byId("stop-practice").addEventListener("click", function () {
    if (state.busy || !state.scenario) return;
    state.selectedPlan = state.selectedPlan || state.scenario.planFor(state.selectedStrategy || "ask-grown-up-for-help");
    void coachTurn(`I am ready to stop. My plan is: ${state.selectedPlan}`, "plan", true);
  });
  byId("own-words-form").addEventListener("submit", function (event) {
    event.preventDefault();
    const input = byId("own-words-input");
    const message = String(input.value || "").replace(/\s+/g, " ").trim();
    if (!message || state.busy) return;
    input.value = "";
    const currentStage = state.stage;
    if (currentStage === "notice") {
      state.selectedFeeling = state.selectedFeeling || state.scenario.feelings[0];
      state.selectedBodyCue = state.selectedBodyCue || state.scenario.bodyCues[0];
      state.stage = "choose";
    } else if (currentStage === "choose") {
      state.selectedStrategy = state.selectedStrategy || state.scenario.strategies[0];
      state.stage = "try";
    } else if (currentStage === "try") {
      state.selectedPracticeWords = state.selectedPracticeWords || STRATEGIES[state.selectedStrategy].childChoices[0];
      state.stage = "check";
    } else if (currentStage === "check") {
      state.selectedCheck = state.selectedCheck || "not-yet";
      state.stage = "plan";
    } else {
      state.selectedPlan = message;
    }
    renderStage();
    void coachTurn(message, currentStage, currentStage === "plan");
  });

  byId("preferences-button").addEventListener("click", function () {
    if (byId("preferences-panel").hidden) openPreferences(); else closePreferences();
  });
  byId("close-preferences").addEventListener("click", closePreferences);
  byId("read-aloud-toggle").addEventListener("change", function () {
    state.displayPreferences.readAloud = byId("read-aloud-toggle").checked;
    saveDisplayPreferences();
    if (state.displayPreferences.readAloud) maybeSpeak("Read aloud is on.");
  });
  byId("large-text-toggle").addEventListener("change", function () {
    state.displayPreferences.largeText = byId("large-text-toggle").checked;
    applyDisplayPreferences();
    saveDisplayPreferences();
  });
  byId("reduce-motion-toggle").addEventListener("change", function () {
    state.displayPreferences.reduceMotion = byId("reduce-motion-toggle").checked;
    applyDisplayPreferences();
    saveDisplayPreferences();
  });
  byId("grown-up-button").addEventListener("click", () => void openGrownUpView());
  byId("show-grown-up-summary").addEventListener("click", () => void openGrownUpView());
  byId("close-grown-up").addEventListener("click", closeGrownUpView);
  byId("new-practice").addEventListener("click", function () {
    resetJourney();
    showPanel("scenario");
  });

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
  applyToolResult(window.openai?.toolOutput);
  if (window.location.hash === "#grown-up-view") void openGrownUpView();
})();
