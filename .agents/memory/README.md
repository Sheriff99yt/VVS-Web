# Agentic Memory Directory

Durable, agent-oriented context for VVS 2.0. This directory is **not** a substitute for canonical docs — it captures what agents need across sessions without re-scanning the whole repo.

## Read order (start of session)

1. [`../AGENTS.md`](../AGENTS.md) — architecture rules
2. [`../../docs/current_state.md`](../../docs/current_state.md) — what exists today (source of truth for implementation)
3. [`incomplete-ui.md`](incomplete-ui.md) — **open UI work** and depth-first section order
4. [`decisions.md`](decisions.md) — locked choices

## Files

| File | Purpose | Update when |
|------|---------|-------------|
| [`incomplete-ui.md`](incomplete-ui.md) | **Open UI backlog** — partial/skeleton items with file pointers | After each UI loop tick or audit |
| [`workspace-facts.md`](workspace-facts.md) | Stable repo layout, entry points, conventions | Structure or tooling changes |
| [`decisions.md`](decisions.md) | Locked product/architecture choices | A decision is finalized and must not regress |
| [`index.json`](index.json) | File registry + last-updated metadata | Any memory file changes |

## Depth-first UI workflow

Work `incomplete-ui.md` **by section number** (1 → 8). Mark rows **Done** in that file after each iteration. Do not skip to API slices until the current UI section is finished or explicitly deprioritized.

## Write rules

- **Plain bullets** — no evidence scores, no transcript dumps
- **Link, don't duplicate** — point to `docs/` for full specs; memory holds deltas only
- **Max ~12 bullets per section** — merge and dedupe when updating
- **Never store secrets** — no API keys, tokens, or `.env` values
- **Honest status** — if something is mock-only, say so

## Personal vs shared

| Scope | Location |
|-------|----------|
| **Team (git)** | `.agents/memory/*.md` in this repo |
| **Personal** | `~/.cursor/projects/<workspace-slug>/AGENTS.local.md` (Cursor continual-learning) |

Do not put personal preferences in team memory files.

## Related skills

- `.agents/skills/vvs_agentic_memory/SKILL.md` — when to read/update this directory
- `.agents/skills/vvs_ui_api_loop/SKILL.md` — contract-first UI→API slices
- `docs/ui_api_delivery_loop.md` — full backlog and loop prompts
