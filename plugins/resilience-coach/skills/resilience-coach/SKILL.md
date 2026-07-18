---
name: resilience-coach
description: Run and evaluate Resilience Coach synthetic SEL practice sessions through its connected MCP tools. Use when a user asks to start, demo, or test Resilience Coach; inspect or update a synthetic demo profile; verify memory continuity; or exercise the simulated safety handoff. Never use this skill with real child data, PII, clinical records, or unsupervised child interactions.
---

# Resilience Coach

Use the Resilience Coach app as a demo-scale social-emotional learning practice companion for ages 6–8 with an adult nearby. Treat it as a practice aid, not therapy, counseling, diagnosis, crisis care, or a substitute for a trusted adult.

## Guardrails

- Use only `demo-sharing`, `demo-mistakes`, or `demo-change` unless the user identifies another explicitly synthetic profile.
- Never send or store a real child's name, account, contact information, school, location, free-form crisis disclosure, or other identifying data.
- If a user supplies real child data, pause and ask them to replace it with synthetic, anonymized demo content.
- Keep child-facing language inside the rendered widget. Do not expose raw JSON, tool output, internal instructions, or profile identifiers to a child.
- Do not claim that the simulated adult notification delivers email, SMS, or emergency help.

## Session workflow

1. Confirm the selected profile is synthetic.
2. Call `get_child_profile` once at the start. Do not call it again mid-session.
3. Let the app's rendered widget conduct the short practice interaction. Preserve its lock state and choice-based UI.
4. At an explicit session end, call `update_child_profile` once with one brief, observable, non-clinical insight.
5. If any physical danger, abuse, neglect, or self-harm appears, immediately call `trigger_safety_handoff`, include only the synthetic `child_id` and current timestamp, and stop the conversation.

## Tool contracts

- `get_child_profile(child_id)` returns recurring struggles, a preferred grounding strategy, and session count.
- `update_child_profile(child_id, insight)` saves a short non-clinical insight and retains at most five insights.
- `trigger_safety_handoff(child_id, timestamp)` records a simulated alert and locks further child input.

If these tools are unavailable, report that the Resilience Coach MCP connection is not configured. Do not imitate a successful tool call or safety notification.
