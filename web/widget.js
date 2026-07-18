(function () {
  "use strict";

  const config = window.__RESILIENCE_COACH_CONFIG__ || {};
  const state = {
    childId: config.childId || "demo-sharing",
    serverOrigin: String(config.serverOrigin || "").replace(/\/$/, ""),
    sessionId:
      window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : `demo-${Date.now()}`,
    busy: false,
    locked: false,
  };

  const conversation = document.getElementById("conversation");
  const starterChoices = document.getElementById("starter-choices");
  const responseChoices = document.getElementById("response-choices");
  const form = document.getElementById("coach-form");
  const input = document.getElementById("child-message");
  const dontKnow = document.getElementById("dont-know");
  const endSession = document.getElementById("end-session");

  function addMessage(text, who) {
    const wrapper = document.createElement("div");
    wrapper.className = `message ${who === "child" ? "child-message" : "coach-message"}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = String(text || "").trim();
    wrapper.appendChild(paragraph);
    conversation.appendChild(wrapper);
    wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function setBusy(value) {
    state.busy = value;
    for (const element of document.querySelectorAll("button, input")) {
      element.disabled = value || state.locked;
    }
    document.body.classList.toggle("is-busy", value);
  }

  function renderChoices(choices) {
    responseChoices.replaceChildren();
    for (const choice of Array.isArray(choices) ? choices.slice(0, 2) : []) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(choice).slice(0, 80);
      button.addEventListener("click", function () {
        sendMessage(button.textContent || "");
      });
      responseChoices.appendChild(button);
    }
  }

  function showLockedScreen() {
    state.locked = true;
    const shell = document.getElementById("coach-shell");
    shell.replaceChildren();
    const panel = document.createElement("section");
    panel.className = "locked-panel";

    const icon = document.createElement("div");
    icon.className = "grown-up-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "♥";

    const heading = document.createElement("h1");
    heading.textContent = "Let's find a grown-up together";

    const message = document.createElement("p");
    message.textContent = "Please show this screen to a trusted grown-up near you.";

    const note = document.createElement("p");
    note.className = "locked-note";
    note.textContent = "The chat is paused. A demo alert was recorded.";

    panel.append(icon, heading, message, note);
    shell.appendChild(panel);
    document.title = "Find a grown-up · Resilience Coach";
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
        }),
      });
      const result = await response.json();
      if (result.locked) {
        showLockedScreen();
        return;
      }
      if (!response.ok) throw new Error("coach unavailable");
      addMessage(result.message, "coach");
      renderChoices(result.choices);
      if (result.ended) {
        form.hidden = true;
        dontKnow.hidden = true;
        endSession.hidden = true;
      }
    } catch (_error) {
      addMessage("A grown-up needs to help me connect. We can pause here.", "coach");
    } finally {
      if (!state.locked) setBusy(false);
    }
  }

  for (const button of starterChoices.querySelectorAll("button")) {
    button.addEventListener("click", function () {
      sendMessage(button.dataset.starter || button.textContent || "");
    });
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    sendMessage(input.value);
  });
  dontKnow.addEventListener("click", function () {
    sendMessage("I don't know.");
  });
  endSession.addEventListener("click", function () {
    sendMessage("I am ready to stop for now.", true);
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

  applyToolResult(window.openai?.toolOutput);
})();
