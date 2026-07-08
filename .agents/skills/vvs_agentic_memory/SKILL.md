---
name: VVS Agentic Memory
description: Triggers when reading or updating agent memory, starting a delivery loop, or needing cross-session context without re-exploring the repo.
---

# Agentic Memory

## Location

`.agents/memory/` — see [`README.md`](../../memory/README.md)

## When to read (start of task)

1. `docs/visual_to_text_fidelity.md` — **text-shaped graphs** + **canvas is the source of truth** (locked — read before codegen/features)
2. `docs/current_state.md` — **canonical implementation truth** (UI shell, graph isolation, backend Phase 2, transpiler/syntax packs)
3. `docs/deployment.md` — **Phase 2 persistence/auth** (Go+pgx, self-hosted Supabase, no PostgREST for app CRUD)
4. `docs/node_system.md` — nodes, pins, conversion, property schema
5. `.agents/memory/workspace-facts.md` — entry points, contexts, events, auth/API paths
6. `.agents/memory/incomplete-ui.md` — **open UI work** (if doing UI slices; **48/48 done** July 2026)
7. `.agents/memory/decisions.md` — do not violate locked choices (incl. canvas source of truth, no sidebar preamble)

## Canvas source of truth (locked)

When fidelity rules change, update `decisions.md` § Canvas source of truth and `workspace-facts.md` § Codegen fidelity — **never undo** canvas-as-codegen-source or reintroduce sidebar preamble. Point agents to `vvs_visual_code_fidelity/SKILL.md` for the checklist.

**Skill cross-refs** (read when task matches trigger):

| Task | Skill |
|------|--------|
| Go API, MCP, Postgres | `vvs_backend_development/SKILL.md` |
| Wire UI to HTTP/auth | `vvs_ui_api_loop/SKILL.md` |
| Editor shell, React Flow | `vvs_ui_development/SKILL.md` |
| Panels, collapse, trees | `vvs_progressive_disclosure/SKILL.md` |
| Monorepo deps, deploy | `vvs_architecture_boundaries/SKILL.md` |
| Syntax packs / Rosetta | `vvs_syntax_packs/SKILL.md` |
| Transpiler pipeline | `vvs_transpiler_development/SKILL.md` |
| Symbol/codegen fidelity | `vvs_visual_code_fidelity/SKILL.md` |

## When to write (end of task)

Update **only** if the session produced durable changes:

| File | Update if… |
|------|------------|
| `incomplete-ui.md` | Completed or discovered a UI gap; change row status or add row |
| `decisions.md` | User or team locked a new architectural/product rule |
| `workspace-facts.md` | New canonical paths, packages, env vars, or build commands |
| `index.json` | Any memory file changed — bump `lastUpdated` |
| `docs/current_state.md` | Implementation changed (prefer over duplicating in memory) |
| `.agents/skills/*/SKILL.md` | Durable pattern/trigger change agents must follow (link docs, don't copy) |

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
5. Update relevant skill if a new canonical path or anti-pattern emerged
