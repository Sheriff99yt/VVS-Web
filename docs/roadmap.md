# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) · **Code panel UX:** [code_panel.md](code_panel.md)

**Product default (locked):** client-first editor — **no VVS accounts**, **no dedicated app server**, **no live code execution**. Edit graphs, **Generate** ordinary source, run **logical checks** / import from existing code.

In-app: **Development roadmap** → Open / Done (mirrors this doc).

---

## Now (July 2026)

### Active

| Focus | IDs | Status |
|-------|-----|--------|
| **Library backend API** | U90+ | **Shipped** — Go service, Postgres schema, TypeScript client, GitHub workflow |
| Target-language emit fidelity plans | CL backlog | Open — plans before code |
| References viewer redesign | U89 | Partial (name filter done) |
| AI / MCP autonomy audit | U91 | Partial |
| More examples (cross-lang + lang-specific) | U92 | Partial |
| Catalog / functions / async / OOP | U97–U101, U103–U106 | Partial — U97 done; U102 done |

### Long-term

| Focus | IDs | Notes |
|-------|-----|--------|
| Code → visual (reverse of Generate) | U93 | Research — must keep canvas source of truth |

### Just shipped (Library API, examples, catalog audit, library redesign, MCP safety, references redesign)

| Focus | IDs |
|-------|-----|
| **Library backend API** (Go service) | U90+ |
| **Multi-language test project examples** (24 goldens across 8 languages) | U92 |
| **Catalog & add-node menu audit** (synonyms, module import spawn) | U97 |
| **Client-first Library** page redesign (Git repo import, OpenAPI/AsyncAPI templates) | U90 |
| **AI / MCP Autonomy & Safety Guard** (write consent guard, activity indicator) | U91 |
| **References** viewer redesign (huge-project metrics & flat tree mode) | U89 |
| Target-language emit fidelity fixes | CL-006, CL-012–CL-015 |
| **Pack versions** manager view | U78 |
| **Go** target language pack (8th language) | U77 |
| Action history · menus · settings · shortcuts · audio · naming | U108–U113 |
| Symbol / class undo · tab-stable undo · lean canvas snapshots | U114–U117 |
| Dynamic naming conventions · Bad practices / safety settings | U118, U119 |
| Code → graph **hover** (yellow node/tab outline) + full [code_panel.md](code_panel.md) | U71 follow-on |
| Canvas gestures · symbols overlay · wires · tabs · search/help | U84–U88, U94–U96, U102, U107 |
| Canvas virtualization | U83 |

```text
CLOSED                         ACTIVE                              PLANNED
─────────────────────────────  ──────────────────────────────────  ─────────────────────
1  Web editor + 8 packs        6  Polish                          4  Session collab (P2P)
2  Persistence (local)            CL emit plans                      5  UE6 Verse plugin
   + local MCP paste              U89–U92 chrome · AI                3  Library (git · API done)
   U77 Go pack done               U97–U106 graph / OOP                  vvs-library repo · web UI
   U78 Pack manager done          U93 code→visual (long-term)          wiring & integration
   U83 virtualization done     3  Library backend                    
   **U90 Library API done**        Go service · Postgres schema
                                  GitHub PR workflow · TZ types
```

Not current focus: dedicated VPS / self-hosted auth-Postgres product; any live code execution / Play / interpreter / runner.

---

## Next (open only)

Agent IDs in `.agents/memory/incomplete-ui.md` §13–§18. In-app: Development roadmap → **Open**.  
Emit-fidelity findings: **CL-*** log in [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) § Issues log.

### Priority

| # | Item | Notes |
|---|------|--------|
| **CL** | Emit fidelity plans | See clusters below — plans before code |
| **Library** | Web UI integration | Import dialog, share button, search page |

### Editor & AI

| # | Item | Notes |
|---|------|--------|
| **U89** | **References** redesign | Partial — tree name filter shipped; huge-project nav still open |
| **U90** | **Library** API done → **web UI** | Wiring to browse/search/import; upload form; auth integration |
| **U91** | **AI / MCP** audit | Partial — Windsurf paste + consent; full autonomy audit open |
| **U92** | **New examples** | Partial — Branch Lab shipped; more cross-lang / lang-specific open |
| **U93** | **Code → visual** | Long-term reverse import research |

### Library backend (U90+)

Completed this sprint:

| # | Task | Status |
|---|------|--------|
| **API** | Go service + handlers | ✓ Done |
| **DB** | Postgres schema + indexes | ✓ Done |
| **Client** | TypeScript types + fetch client | ✓ Done |
| **Workflow** | GitHub PR automation placeholder | ✓ Done |
| **Docs** | Full API reference ([library-backend-api.md](library-backend-api.md)) | ✓ Done |

Remaining (Phase 3):

| # | Task | Notes |
|---|------|--------|
| **vvs-library repo** | Create public community library repo | Directory structure + _index.json generator |
| **GitHub Actions CI** | Validate + generate metadata | Rosetta test + graph schema check |
| **Web UI** | Browse/search/import/upload pages | Connect to backend; auth integration |
| **Wire main.go** | Instantiate LibraryService + register routes | Database init + migrations |
| **Auth middleware** | JWT validation for uploads | GitHub OAuth integration |
| **GitHub API impl** | Fill PR creation function | Real GitHub API calls, PR auto-merge |

See [library-backend-api.md](library-backend-api.md) for full API spec.

### Graph model (U97–U106)

| # | Item | Notes |
|---|------|--------|
| **U97** | Add-node menu audit | Done — Full catalog audit + naming convention integration |
| **U98** | Function argument pins | Define / call / emit end-to-end |
| **U99** | Function return with arguments | Pins / multi-return where languages support it |
| **U100** | Event listeners | Listen / subscribe visuals across targets |
| **U101** | Cross-language async concept | Language-neutral model for all packs |
| **U103** | Components | Visual concept + multi-lang Test Project proof |
| **U104** | Overloading | Revise UX/emit; stress-test |
| **U105** | Overwriting (override) | Study vs current modifiers |
| **U106** | Inheritance | Canvas authoring + per-language lowering (pairs CL-010) |

Also strengthening: analyzer / portability / `(x)` / dim / compiler log — **no** live run.

### Emit fidelity — open plans (CL log)

| Priority | CL IDs | Cluster | Plan needed for |
|----------|--------|---------|-----------------|
| **P0** | CL-010 | Rust inheritance / lowering | Composition `base:` vs `self.Power` / `new` |
| **P0** | CL-014, CL-015 | Verse GetInput + for-loop | Real string input; Verse `for` shape |
| **P1** | CL-006 | C# async return type | `async void` vs `async Task` |
| **P1** | CL-008, CL-009 | Rust static/const + imports | Modifier emit; `HashMap` `use` |
| **P1** | CL-012, CL-013 | GDScript temps + GetInput | `var` on Switch temp; print prompt |
| **P1** | CL-016 | Verse field defaults | Class-typed default → correct default |
| **P2** | CL-017, CL-018 | Switch `match` / async chips | Optional native match; disable ineffective async |

Validate: `bun apps/web/scripts/validate_test_projects_folder.ts`.

---

## Recently completed

| Wave | Items |
|------|--------|
| **Library backend (this sprint)** | Go service, Postgres, TypeScript client, GitHub workflow scaffolding |
| **Undo, settings & safety (U108–U119)** | Action history · File/Edit/View/Help · Settings (Shortcuts / Audio / About / Naming / Safety) · rebindable shortcuts · audio cues · **VVS Web** naming |
| **Code panel** | Selection highlight · double-click → node · **hover → yellow node/tab outline** · error/warning toggles · Files pin · [code_panel.md](code_panel.md) |
| **Find & gestures** | U84 all-graphs search · U85 Ctrl+F this graph / Ctrl+Shift+F all · U94 tooltips · U95 first-open help · U107 pan/select |
| **Chrome & wires** | U86 Details compact · U87 log language scope · U88 tabs · U96 pins/edge menu/auto-connect · U102 symbols overlay |
| **Fidelity & scale** | U64–U71 · U75 layout · U79 Y-order · U80–U82 · U83 virtualization · U66/U67 `(x)` + dim · U68/U69 comments |

Detail notes for older IDs: prior revisions of this file and `.agents/memory/incomplete-ui.md`.

---

## Phase notes

| Phase | Status | One-liner |
|-------|--------|-----------|
| **1** Web editor & transpiler | Closed | Seven packs, `.vvs/`, canvas source of truth |
| **2** Persistence & AI | **Redirected** | Client-first: local/folder / `.vvs/`; local MCP paste; packs via GitHub; **no dedicated server** as product |
| **6** Fidelity, canvas scale & polish | **Active** | U64–U88 / U94–U96 / U102 / U107–U119 + U77 Go + U78 Packs done; next **U89–U92** + **U97–U106**; CL plans; **U93** long-term |
| **3** Community library | **In progress** | Go backend done; create `vvs-library` repo · GitHub Actions CI · web UI wiring |
| **4** Collaboration | Planned | **Session client/host**, not account cloud collab |
| **5** UE6 plugin | Planned | Same graph → Verse text; not Blueprint VM |

Detail: [design/fidelity_streamline.md](design/fidelity_streamline.md) · backlog `.agents/memory/incomplete-ui.md` · lang emit [cross_language_mapping/SKILL.md](../.agents/skills/vvs_cross_language_mapping/SKILL.md) · library [library-backend-api.md](library-backend-api.md)

---

## Non-goals (for now)

- Bundled LLM — bring your own via MCP  
- Proprietary runtime / Blueprint VM  
- Hidden transforms or invented emit without canvas nodes  
- **Live code execution** — no Play, interpreter, runner, or "run from VVS"  
- Reviving mock Play/Pause graph simulation  
- **Dedicated server hosting** — static Pages + local projects only  

---

## Client-first direction (locked intent — July 2026)

Product default: **no VVS accounts, no dedicated app server**. Browser/editor + local / folder / git; optional GitHub for packs, library links, and **static** web hosting (e.g. Pages).

**Do not delete** legacy hosted/cloud/`server/` paths — keep for reference and local experiments; they are **not** an active product track.

| Pillar | Direction |
|--------|-----------|
| **Edit + Generate** | Entirely client-side; **no** required backend |
| **Persist** | Local storage, **folder / `.vvs/`**, git |
| **Checks** | In-app **logical** analysis and **warnings** only |
| **Execution** | **Out of scope** — third-party IDEs, engines, CI |
| **Hosting** | **No dedicated server** — static showcase (Pages) OK |
| **Canvas scale** | Virtualization (U83) shipped — keep measuring large graphs |
| **Pack updates** | Fetch from GitHub; versions **accumulate**; Pack versions view (U78) |
| **Library** | Separate official **library git repo**; public links only; API for search/browse/upload |
| **MCP / AI** | Paste config; user runs **local MCP**; **desktop only** — **mobile: no AI** |
| **Collab** | Session **client/host**, not account cloud multiplayer |

---

## Follow progress

| Source | Role |
|--------|------|
| [current_state.md](current_state.md) | Implementation truth |
| [code_panel.md](code_panel.md) | Code panel navigation & highlight UX |
| [design/fidelity_streamline.md](design/fidelity_streamline.md) | Fidelity program |
| [design/user_types.md](design/user_types.md) | TypeRef / declare → type → use |
| [library-backend-api.md](library-backend-api.md) | Library API spec & implementation guide |
| [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) | Per-language emit docs + CL issues log |
| In-app **Development roadmap** | Open vs Done tracks |
| [deployment.md](deployment.md) | Legacy self-host notes — **not** product direction |
