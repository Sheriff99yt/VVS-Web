---
name: VVS Agentic Memory
description: Triggers when reading or updating agent memory, starting a delivery loop, or needing cross-session context without re-exploring the repo.
---

# Agentic Memory

## Location

`.agents/memory/` — see [`README.md`](../../memory/README.md)

## When to read (start of task)

1. `docs/visual_to_text_fidelity.md` — **text-shaped graphs** (locked direction — read before codegen/features)
2. `docs/current_state.md` — implementation truth (includes **graph system architecture**)
3. `docs/node_system.md` — nodes, pins, conversion, property schema
4. `.agents/memory/workspace-facts.md` — entry points, contexts, events
5. `.agents/memory/incomplete-ui.md` — **open UI work** (if doing UI slices)
6. `.agents/memory/decisions.md` — do not violate locked choices (incl. text-shaped graphs)

## When to write (end of task)

Update **only** if the session produced durable changes:

| File | Update if… |
|------|------------|
| `incomplete-ui.md` | Completed or discovered a UI gap; change row status or add row |
| `decisions.md` | User or team locked a new architectural/product rule |
| `workspace-facts.md` | New canonical paths, packages, or build commands |
| `index.json` | Any memory file changed — bump `lastUpdated` |

## Do not

- Duplicate `docs/current_state.md` — link and note deltas only
- Store secrets, credentials, or personal preferences (use `AGENTS.local.md`)
- Exceed ~12 bullets per section — merge and dedupe

## Loop integration

After each UI/API loop iteration:

1. Mark completed rows in `incomplete-ui.md`
2. Set next slice from `docs/ui_api_delivery_loop.md` backlog
3. Update `docs/current_state.md` if implementation changed
4. Update `decisions.md` if product direction or fidelity rules changed
