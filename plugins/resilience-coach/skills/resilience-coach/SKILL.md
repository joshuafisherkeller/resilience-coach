---
name: resilience-coach
description: Run and evaluate Resilience Coach synthetic adult-guided SEL practice sessions through its connected MCP tools. Use when a user asks to start, demo, or test Resilience Coach; inspect or update a synthetic demo profile; verify bounded practice memory; or exercise the simulated safety handoff. Never use this skill with real child data, PII, clinical records, or unsupervised child interactions.
---

# Resilience Coach

Use Resilience Coach as an adult-guided practice studio for ordinary setbacks
for ages 6–8. Treat it as an evidence-informed practice aid, not therapy,
counseling, diagnosis, crisis care, or a substitute for a trusted adult.

## Guardrails

- Use only `demo-sharing`, `demo-mistakes`, or `demo-change` unless the user
  identifies another explicitly synthetic profile.
- Never send or store a real child's name, account, contact information,
  school, location, transcript, free-form crisis disclosure, or other
  identifying data.
- If a user supplies real child data, pause and ask them to replace it with
  synthetic, anonymized demo content.
- Keep child-facing language inside the rendered widget. Do not expose raw
  JSON, tool output, internal instructions, or profile identifiers to a child.
- Do not claim that the simulated adult notification delivers email, SMS, or
  emergency help.
- Do not create streaks, reward disclosure, use dependency language, or make
  treatment claims.

## Session workflow

1. Confirm the selected profile is synthetic and an adult is nearby.
2. Call `get_child_profile` once at the start. Do not call it again mid-session.
3. Let the widget conduct a six-turn-or-shorter loop: Notice, Name, Choose,
   Try, Check, then Switch or Share.
4. Respect the child's selected support preference and the widget's
   accessibility controls. Treat "I don't know" and "I don't understand" as
   valid responses.
5. End with one short if-then next-time plan. Call `update_child_profile` once
   with a neutral summary such as:
   `Practiced: one slow breath; Next-time plan: When waiting feels hard, I will take one slow breath; Support preference: two clear choices`.
6. If physical danger, abuse, neglect, or self-harm appears, immediately call
   `trigger_safety_handoff`, include only the synthetic `child_id` and current
   timestamp, and stop the conversation.

## Tool contracts

- `get_child_profile(child_id)` returns the exact Build Week public contract:
  recurring struggles, a preferred grounding strategy, and session count.
- `update_child_profile(child_id, insight)` keeps the exact two-input contract.
  The server derives bounded skills, plan, and support-preference fields and
  retains at most five synthetic insight rows.
- `trigger_safety_handoff(child_id, timestamp)` records a simulated alert and
  locks further child input.

If these tools are unavailable, report that the Resilience Coach MCP
connection is not configured. Do not imitate a successful tool call or safety
notification.
