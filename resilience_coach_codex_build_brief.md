# CODEX BUILD BRIEF: Resilience Coach

## Context
You are building "Resilience Coach" for the OpenAI Build Week hackathon (Education track). It is an SEL practice companion for children ages 6–8, delivered as a ChatGPT App (Apps SDK widget backed by an MCP server), packaged as an installable Codex plugin. The child-facing agent's behavior is fully specified in `resilience_coach_system_prompt.md` (attached/provided separately) — do not rewrite that file's content; your job is to build the system that makes its three tool calls real, and the interface it renders in.

## What to build

### 1. MCP Server (Node/TypeScript preferred)
Expose exactly three tools, matching these contracts:

**`get_child_profile`**
- Input: `child_id: string`
- Output: `{ recurring_struggles: string[], preferred_grounding_strategy: string | null, session_count: number }`
- Storage: simple local JSON or SQLite file for the hackathon demo — no real user accounts, no PII. Seed with 2–3 synthetic demo profiles (e.g., a child who struggles with sharing and responds well to breathing exercises) so the memory continuity is demoable on first run.

**`update_child_profile`**
- Input: `child_id: string`, `insight: string` (short, non-clinical, e.g. "Struggles with sharing; responded well to breathing exercises")
- Behavior: appends/merges into the same local store. Keep a simple cap (e.g., last 5 insights) so profiles stay short and don't balloon into a clinical record.

**`trigger_safety_handoff`**
- Input: `child_id: string`, `timestamp: string`
- Behavior: this must have a real, demoable effect — not a no-op. For the hackathon: (a) write a timestamped entry to a local "alerts" log, (b) set a `locked: true` flag the widget checks and renders as a calm, simple "Let's find a grown-up together" screen with no further chat input, (c) simulate a parent/educator notification (e.g., print/log a message — do not attempt real SMS/email delivery for the demo unless you have time to do it safely and it's clearly a simulation in the README).
- This tool's existence and behavior should be easy for judges to trigger and see during testing.

### 2. Apps SDK Widget (the ChatGPT-rendered UI)
- Simple, high-contrast, large-text interface appropriate for a 6–8 year old with adult supervision nearby.
- Renders the agent's short text turns plus any offered choices as clearly tappable buttons (not raw text the child has to type, where avoidable — early readers benefit from choice-based interaction).
- Must visually reflect the `locked` state from `trigger_safety_handoff` distinctly from normal conversation state.
- No code blocks, JSON, or raw markdown artifacts ever rendered to the child — sanitize agent output if needed.
- Keep the visual design warm and simple over flashy; judges are scoring "coherent product experience," not visual complexity.

### 3. System Prompt Wiring
- Load `resilience_coach_system_prompt.md` as the system/developer message for the GPT-5.6-backed conversation.
- Wire the three MCP tools into the model's available tools for that conversation.
- Do not alter the pedagogical content of that file — if something needs to change there, flag it back to me rather than silently editing it.

### 4. Codex Plugin Packaging
- Package as an installable Codex plugin: `plugin.json` manifest, the MCP server, and a `SKILL.md` describing what Resilience Coach does and when to invoke it.
- Include install instructions in the README clear enough that a judge can install and test without rebuilding from scratch, per the hackathon's submission requirements.

### 5. README requirements (per hackathon rules — don't skip this)
- Explain what was built and how it works.
- Explicitly narrate the Codex collaboration: where Codex accelerated the build, what decisions were made by the human vs. suggested by Codex, and how GPT-5.6 specifically is used (system-prompt-driven Socratic scaffolding + tool-calling, not just "we called the API").
- State plainly that all demo data is synthetic and no real children's data is collected or stored — this is a demo-scale project, not a production child-data system.
- Include the `/feedback` Codex Session ID for the thread where core functionality was built (grab this early, don't forget it at the end).

## Constraints
- No real PII, no real child accounts, no production data handling — synthetic profiles only, and say so explicitly in the UI and README.
- Do not implement real parent notification delivery (email/SMS) unless there's clear time to do it correctly; a clearly-labeled simulation is safer and still demoable.
- Favor a small number of working, polished features over a large number of half-working ones — the judging rubric rewards a complete, coherent experience over technical sprawl.

## Deliverable checklist
- [ ] MCP server with three working tools + seeded demo data
- [ ] Apps SDK widget rendering conversation + choices + locked state
- [ ] System prompt wired in unmodified
- [ ] Plugin manifest + SKILL.md
- [ ] README with Codex narrative, safety/data disclaimer, install instructions, session ID
- [ ] End-to-end test: a full happy-path session (validate → scaffold → frustration ceiling → grounding → graceful exit) and a full safety-trigger path, both demoable live
