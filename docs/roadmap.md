# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) · **Code panel UX:** [code_panel.md](code_panel.md)

**Product default (locked):** client-first editor — **no VVS accounts**, **no dedicated app server**, **no live code execution**. Edit graphs, **Generate** ordinary source, run **logical checks** / import from existing code.

In-app: **Development roadmap** → Open / Done (mirrors this doc).

---

## Now (August 2026)

### Active

| Focus | IDs | Status |
|-------|-----|--------|
| Verse GetInput | CL-014 | **Open** — honest `(x)` + prompt; no invented player API |
| Switch `match` | CL-017 | Optional — if-cascade is the shipped shape |
| Components | U103 | Open — only if a language has a real Component construct |
| Library remaining (auth / upload) | U90 | Frozen — client-first; no accounts as product |

### Long-term

| Focus | IDs | Notes |
|-------|-----|--------|
| Code → visual (reverse of Generate) | U93 | Research — must keep canvas source of truth |

### Just shipped (August 2026 emit / OOP wave + earlier catalog lock)

| Focus | IDs |
|-------|-----|
| **Node vs option vs pin** locked; catalog leftovers (spawn excludes, Wait expression, On role, Declare spawn) | Aug 2026 |
| **Function argument pins end-to-end** (define, implement, call, emit) | U98 |
| **Function return with arguments** (Return node & value pin codegen) | U99 |
| **Library backend API** (Go service) | U90+ |
| **Multi-language test project examples** (5 fixtures × 8 langs = 40 goldens; Inheritance Lab + Go asserted) | U92 |
| Function graph disk path uniqueness (`Name__{id}.graph.json`) so two `Speak` methods don't collide | U92 follow-on |
| **Catalog & add-node menu audit** (synonyms, module import spawn) | U97 |
| **Client-first Library** page redesign (Git repo import, OpenAPI/AsyncAPI templates) | U90 |
| **AI / MCP Autonomy & Safety Guard** (dual consent, inventory audit, activity indicator) | U91 |
| **References** viewer redesign (huge-project metrics & flat tree mode) | U89 |
| Target-language emit + OOP | CL-006, CL-008–CL-010, CL-012–CL-013, CL-015–CL-016, CL-018, U101, U105, U106, Call Super |
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
1  Web editor + 8 packs        6  Leftover fidelity                4  Session collab (P2P)
2  Persistence + local MCP        CL-014 honest (x)                  5  UE6 Verse plugin
   U77–U83 · U89–U92 shipped      optional CL-017                    3  Library repo + web UI
   emit/OOP wave shipped          U93 code→visual (long-term)
   U90 Library API done
```

Not current focus: dedicated VPS / self-hosted auth-Postgres product; any live code execution / Play / interpreter / runner.

---

## Next (open only)

Agent IDs in `.agents/memory/incomplete-ui.md` §13–§18. In-app: Development roadmap → **Open**.  
Emit-fidelity findings: **CL-*** log in [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) § Issues log.

### Priority

| # | Item | Notes |
|---|------|--------|
| **CL-014** | Verse GetInput | Honest `(x)` + prompt shipped. Real player/string read is not a plain-class API — do not invent one. |
| **CL-017** | Switch `match` | Optional native match. If-cascade is the shipped shape. |
| **U103** | Components | Only if a language has a real Component construct. |

Shipped this wave (moved to Recently completed): CL-006, CL-008, CL-009, CL-010, CL-015, CL-016, CL-018, U101, U105, U106, Call Super.

### Editor & AI

| # | Item | Notes |
|---|------|--------|
| **U90** | **Library** API done → **web UI** | Wiring to browse/search/import; upload form; auth integration |
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
| **U98** | Function argument pins | Done — Define / implement / call / emit end-to-end; auto-sync across documents |
| **U99** | Function return with arguments | Done — Return statement node (`flow_return`) with value pin lowering across 8 target languages |
| **U100** | Event listeners | **Cut** — subscribe/emit hidden runtime rejected; Dispatch only |
| **U101** | Cross-language async concept | **Done** — one Wait node; `isAsync` option; pack-complete await/sleep |
| **CL-018** | Dim ineffective async | **Done** — U66/U67 chips; Wait.isAsync does not flip the function |
| **Call Super** | Parent call option | **Done** — option on Call (and Dispatch); emit `super()` / `base` / `Parent::` / `self.base` |
| **U103** | Components | Open only if a language has a real Component construct |
| **U104** | Overloading | Done — UX/emit audited under real fixtures; floating overload panel |
| **U105** | Overwriting (override) | **Done** — option on Declare/Define; emit + dim per language |
| **U106** | Inheritance | **Done** — canvas authoring + per-language lowering (pairs CL-010) |
| **Flow Control** | Generic Return, Break, Continue | **Done** — `flow_return` / `flow_break` / `flow_continue` |

Also strengthening: analyzer / portability / `(x)` / dim / compiler log — **no** live run.

### Emit fidelity — open plans (CL log)

| Priority | CL IDs | Cluster | Plan needed for |
|----------|--------|---------|-----------------|
| **P0** | CL-010 | Rust inheritance / lowering | **Done** — composition + `self.base` projection |
| **P0** | CL-014 | Verse GetInput | No blocking string read on a plain class; `(x)` + prompt shipped |
| **P1** | CL-008, CL-009 | Rust static/const + imports | **Done** — module `static` / associated `const`; generated `use std::collections::HashMap;` |
| **P1** | CL-012, CL-013 | GDScript temps + GetInput | **Done** — Switch temp `var`; GetInput prints prompt |
| **P1** | CL-016 | Verse field defaults | **Done** — class-typed `Host = Machine{}` (archetype value, not constructor) |
| **P2** | CL-017 | Switch `match` | Optional native match — if-cascade is intentional ship shape |
| **P2** | CL-018 | Async chips | **Done** — rust `isAsync` dimmed (no Tokio; Wait is `thread::sleep`); Call Super is a Call option |

Validate: `bun apps/web/scripts/validate_test_projects_folder.ts`.

---

## Recently completed

| Wave | Items |
|------|--------|
| **CL-016 Verse class defaults** | Class-typed field default is `Type{}` (Coverage Lab `Host = Machine{}`), not logic `false` |
| **CL-006 C# async Task** | Void+async methods emit `async Task` / `async Task<T>`, not `async void` |
| **CL-008 / CL-009 Rust static/const + HashMap** | Module `pub static`; associated `pub const` in `impl`; file-top `use std::collections::HashMap;` |
| **CL-018 rust async dim + Call Super option** | Rust `isAsync` ineffective (no Tokio). Super is an option on Call / Dispatch, not a node |
| **CL-015 Verse for** | Range `for (i := first..last):` and for-each `for (val : xs):` |
| **Node catalog (August 2026)** | Node vs option vs pin lock; spawn excludes; Wait seconds as wired expression; On role entry/tick emit; Function Declare spawn only for C++ / abstract |
| **Library backend (this sprint)** | Go service, Postgres, TypeScript client, GitHub workflow scaffolding |
| **Undo, settings & safety (U108–U119)** | Action history · File/Edit/View/Help · Settings (Shortcuts / Audio / About / Naming / Safety) · rebindable shortcuts · audio cues · **VVS Web** naming |
| **Code panel** | Selection highlight · double-click → node · **hover → yellow node/tab outline** · error/warning toggles · Files pin · [code_panel.md](code_panel.md) |
| **Find & gestures** | U84 all-graphs search · U85 Ctrl+F this graph / Ctrl+Shift+F all · U94 tooltips · U95 first-open help · U107 pan/select |
| **Chrome & wires** | U86 Details compact · U87 log language scope · U88 tabs · U89 References (breadth/prefs/type filter) · U96 pins/edge menu/auto-connect · U102 symbols overlay |
| **Fidelity & scale** | U64–U71 · U75 layout · U79 Y-order · U80–U82 · U83 virtualization · U66/U67 `(x)` + dim · U68/U69 comments |

Detail notes for older IDs: prior revisions of this file and `.agents/memory/incomplete-ui.md`.

---

## Phase notes

| Phase | Status | One-liner |
|-------|--------|-----------|
| **1** Web editor & transpiler | Closed | Seven packs, `.vvs/`, canvas source of truth |
| **2** Persistence & AI | **Redirected** | Client-first: local/folder / `.vvs/`; local MCP paste; packs via GitHub; **no dedicated server** as product |
| **6** Fidelity, canvas scale & polish | **Active** | Catalog lock + August emit/OOP + U89–U92 shipped. Open: CL-014 honest `(x)`, optional CL-017, U103 only if real construct, U93 long-term. |
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
