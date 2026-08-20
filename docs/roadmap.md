# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) · **Code panel UX:** [code_panel.md](code_panel.md)

**Product default (locked):** client-first editor — **no VVS accounts**, **no dedicated app server**, **no live code execution**. Edit graphs, **Generate** ordinary source, run **logical checks** / import from existing code.

In-app: **Development roadmap** → Open / Done / Research, grouped frontend / backend (mirrors this doc).

---

## Now (August 2026)

### Active

| Focus | IDs | Status |
|-------|-----|--------|
| Verse GetInput | CL-014 | **Open** — honest `(x)` + prompt; no invented player API |
| Library remaining (auth / upload) | U90 | Frozen — client-first; no accounts as product |

### Long-term

| Focus | IDs | Notes |
|-------|-----|--------|
| Code → visual (reverse of Generate) | U93 | Research tab: deterministic IR reverse (ship), LLM graph guess (reject), deterministic + confirmed leftovers (later) |

### Just shipped (August 2026 emit / OOP wave + later fidelity)

| Focus | IDs |
|-------|-----|
| **Extends multi-base emit** (python `class Child(Parent, Mixin):` / C++ `: public Parent, public Mixin`; js/gd/verse/cs still first parent) | Aug 2026 |
| **Yield statement** (`yield_stmt` python + gdscript; typed value pin; hidden elsewhere) | Aug 2026 |
| **Switch match** (same Switch node; Python `match` / Rust `match`; C#/JS/C++/Go keep `switch`; Add Case uses `case_*` indices) | CL-017 |
| **TypeSpec → manifest** CLI (`--typespec` / `--tsp` → apiSurface; not in Pages bundle) | Aug 2026 |
| **Multi-overload codegen** (C++ out-of-line loops; call-site selected overload args; Python extra overloads stay `(x)`) | Aug 2026 |
| **Language profiles as JSON packs** | Aug 2026 |
| **Off-thread transpile worker** | Aug 2026 |
| **Rust + Go console packs** (`env.rust.console-app`, `env.go.console-app`) + optional `devcontainer` host file | Aug 2026 |
| **Library client token search** | Aug 2026 |
| **Implements list + Class form** (cs/rs UI + emit; python does not print Implements; Super stays first Extends parent) | Aug 2026 |
| **Library language chips** (filter templates by default/supported target; active chip stays at count 0; empty copy names search + chip; token search stays, no embeddings) | Aug 2026 |
| **C# data-script + Go HTTP service packs** (`env.csharp.data-script`, `env.go.http-service`) | Aug 2026 |
| **Mobile agent-hide + coarse pin snap + hit targets** (gestures still planned) | Aug 2026 |
| **Host skip/emit UI** in Graph settings | Aug 2026 |
| **Non-destructive template upgrade** (Refresh line-based 3-way merge: `merged` / `applied` / `kept-yours` / `already-current`; no merge IDE) | Aug 2026 |
| **Host file in-editor contents** (Graph settings textarea persists on snapshot; Generate emit uses edited text; skip stays skip; no merge IDE) | Aug 2026 |
| **First-party project templates** (17 built-in env packs across console / web / data / api / game; Library lists all; community catalog is Phase 3) | Aug 2026 |
| **Per-tab folder graph files** (`graph-doc-split`) | Aug 2026 |
| **Component = Class** (U103 locked — no Component node) | Aug 2026 |
| **Function constructor/destructor role** (py `__init__`, js `constructor()`, cpp ctor/dtor, cs ctor no finalizer, gd `_init`; rust/go/verse dim) | Aug 2026 |
| **Leftover-construct roles lock** (no `constructor_define` / `property_define` / `implements_define` / `flow_match`) | Aug 2026 |
| **Settings search/structure audit** (every section searchable; honest Editor blurb; Project grouping; Audio cards) | Aug 2026 |
| **Server/MCP spawn leftovers excluded** (On Start, Emit/Subscribe, Sequence, Await Wait, graph_ref) | Aug 2026 |
| **Node vs option vs pin** locked; catalog leftovers (spawn excludes, Wait expression, On role, Declare spawn) | Aug 2026 |
| **Function argument pins end-to-end** (define, implement, call, emit) | U98 |
| **Function return with arguments** (Return node & value pin codegen) | U99 |
| **Library backend API** (Go service) | U90+ |
| **Multi-language test project examples** (5 fixtures × 8 langs = 40 goldens; Inheritance Lab + Go asserted) | U92 |
| Function graph disk path uniqueness (`Name__{id}.graph.json`) so two `Speak` methods don't collide | U92 follow-on |
| **Catalog & add-node menu audit** (synonyms, module import spawn) | U97 |
| **Client-first Library** page redesign (Git repo import, OpenAPI/AsyncAPI templates) | U90 |
| **In-page TypeScript agent** (hosted path; live canvas; `agentAllowWrites` write gate). U91 dual-consent / MCP Ready are **not** product chrome | U91 |
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
2  Persistence + in-page agent    CL-014 honest (x)                  5  UE6 Verse plugin
   U77–U83 · U89–U92 shipped      U93 code→visual (long-term)        3  Library repo + web UI
   emit/OOP + ctor role shipped   U90 Library auth/upload frozen
   U103 locked (Component=Class)
   CL-017 Switch match shipped
   Yield + multi-base emit
   TypeSpec CLI + overload codegen
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

Shipped this wave (moved to Recently completed): CL-006, CL-008, CL-009, CL-010, CL-015, CL-016, CL-017, CL-018, U101, U105, U106, Call Super, Yield, Extends multi-base emit, TypeSpec CLI, overload codegen.

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
| **U99** | Function return with arguments | Done — Return statement node (`flow_return`) with typed value pin (`resolvePinValueExpr`) lowering across 8 target languages |
| **U100** | Event listeners | **Cut** — subscribe/emit hidden runtime rejected; Dispatch only |
| **Event Bind** | Event Bind (honest registration) | **Partial** — C# `+=`, JS `.on`, GDScript `.connect` printers and spawn shipped; one visible registration line; Declare/On/Dispatch unchanged; extra On illegal until a Bind is on the graph; no `_subscribe` helper, no hidden listener list; other langs unspawned or `(x)` Bind. Details picker + rename write-through shipped. Still partial for other langs. Not U100. Not Done — not all targets. |
| **U101** | Cross-language async concept | **Done** — one Wait node; `isAsync` option; pack-complete await/sleep |
| **CL-018** | Dim ineffective async | **Done** — U66/U67 chips; Wait.isAsync does not flip the function |
| **Call Super** | Parent call option | **Done** — option on Call (and Dispatch); emit `super()` / `base` / `Parent::` / `self.base` |
| **U104** | Overloading | Done — UX/emit audited under real fixtures; floating overload panel |
| **U105** | Overwriting (override) | **Done** — option on Declare/Define; emit + dim per language |
| **U106** | Inheritance | **Done** — canvas authoring + per-language lowering (pairs CL-010). Generate prints all Extends rows for python/cpp; js/gd/verse/cs still first parent. Super still first Extends parent. Implements list + Class form shipped for cs/rs. |
| **Extends list** | Multiple inheritance visual | **Done** — list UI + generate. Python `class Child(Parent, Mixin):`. C++ `class Child : public Parent, public Mixin`. js/gd/verse/cs still first parent (extras stored; C# Extends extras are not auto-migrated to Implements). go/rust list hidden. Super still first Extends parent. No Inherit node. See [catalog](design/language_capability_catalog.md#multiple-inheritance-locked-visual). |
| **Implements list + Class form** | Interface / trait | **Done** — `form` + `implementsTypes` on Class / `class_define`. UI + emit for csharp/rust only. C# `class Child : Base, IFoo` or `interface IFoo`. Rust `pub trait` + `impl Trait for Type` when Implements has names. Python does not print Implements. Super stays first Extends parent. No `implements_define`. |
| **Flow Control** | Generic Return, Break, Continue | **Done** — `flow_return` / `flow_break` / `flow_continue` |
| **Lambda** | Expression node | **Done** — `lambda_define` (python / javascript / csharp / rust / gdscript). Capture option. |
| **Try** | Flow node | **Done** — `flow_try` (python / javascript / cpp / csharp / gdscript). Empty finally omitted. Hidden in Go/Rust. |
| **Yield** | Statement node | **Done** — `yield_stmt` (python / gdscript). Typed value pin. Hidden elsewhere. No invented generator syntax. |
| **Switch match** | CL-017 | **Done** — same Switch node. Python `match` / Rust `match`. C#/JS/C++/Go keep `switch`. Add Case uses `case_*` indices. |

Also strengthening: analyzer / portability / `(x)` / dim / compiler log — **no** live run.

### Emit fidelity — open plans (CL log)

| Priority | CL IDs | Cluster | Plan needed for |
|----------|--------|---------|-----------------|
| **P0** | CL-010 | Rust inheritance / lowering | **Done** — composition + `self.base` projection |
| **P0** | CL-014 | Verse GetInput | No blocking string read on a plain class; `(x)` + prompt shipped |
| **P1** | CL-008, CL-009 | Rust static/const + imports | **Done** — module `static` / associated `const`; generated `use std::collections::HashMap;` |
| **P1** | CL-012, CL-013 | GDScript temps + GetInput | **Done** — Switch temp `var`; GetInput prints prompt |
| **P1** | CL-016 | Verse field defaults | **Done** — class-typed `Host = Machine{}` (archetype value, not constructor) |
| **P2** | CL-017 | Switch `match` | **Done** — Python `match` / Rust `match`; C#/JS/C++ keep `switch`; GDScript/Go/Verse keep if-cascade |
| **P2** | CL-018 | Async chips | **Done** — rust `isAsync` dimmed (no Tokio; Wait is `thread::sleep`); Call Super is a Call option |

Validate: `bun apps/web/scripts/validate_test_projects_folder.ts`.

---

## Recently completed

| Wave | Items |
|------|--------|
| **search leftover (this pass)** | Language chip stays visible at count 0; empty copy names search + chip so a stuck Verse filter cannot blame `rust`. Embeddings still TBD — search stays partial. |
| **env-template-upgrade (this pass)** | Refresh line-based 3-way merge: template additions apply on non-overlapping hunks (`merged`); conflict stays `kept-yours` + skip; no merge IDE |
| **templates (this pass)** | First-party 17 env packs Done; docs table + catalog F catch-up; community catalog stays Phase 3 |
| **U81 symbol-delete Define leftover (`4ea967e` follow-on)** | `removeDefineNodesForSymbol` drops `function_implement` with `function_define` on symbol delete and deleteClass |
| **Consume-path completeness (`1f2c051`)** | Settings env/host/export tab; class/var/event write-through; define-node sync; extract-to-function keeps body + Declare; Yield/Return typed pins; Switch `case_*` indices; eight-language docs |
| **Implements / form / language chips / env packs** | Implements list + Class form (cs/rs); Library language chips (no embeddings; active chip stays at count 0; empty copy names search + chip); `env.csharp.data-script` + `env.go.http-service`. Search stays partial. Templates **Done** — 17 first-party packs; community catalog is Phase 3 (`library-backend`). |
| **U65 goldens + roadmap sync** | Home-preview goldens for Coverage Lab Switch `match` (python/rust) and New Features Lab overload emit; public/in-app roadmap Open vs Done aligned to HEAD `1fcf4a3` era |
| **Multi-base / Yield / Switch match / TypeSpec** | Extends list generate for python/cpp; `yield_stmt` py/gd; Switch → Python/Rust `match`; TypeSpec CLI → apiSurface |
| **Overload codegen + profiles + worker** | C++ out-of-line overload loop; call-site selected args; language profile JSON packs; off-thread transpile worker |
| **Console packs + host/mobile chrome** | rust/go console + optional `devcontainer`; host skip/emit UI; Library token search; mobile agent-hide + pin snap + hit targets; folder `graph-doc-split` |
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
| **1** Web editor & transpiler | Closed | Eight packs, `.vvs/`, canvas source of truth |
| **2** Persistence & AI | **Redirected** | Client-first: local/folder / `.vvs/`; **in-page TS agent** (hosted); optional localhost Go sidecar for other apps; packs via GitHub; **no dedicated server** as product |
| **6** Fidelity, canvas scale & polish | **Active** | Ctor/dtor Function role + leftover-role locks + settings audit + August emit/OOP + in-page TS agent + U89 / U92 shipped. U91 dual-consent / MCP Ready not product chrome. **U103 locked** as Class (field or Extends; no Component node). Open: CL-014 honest `(x)`, U93 long-term, U90 frozen. Shipped this wave: CL-017 Switch match + `case_*` indices, Yield/Return typed pins, Extends multi-base emit, TypeSpec CLI, overload codegen, JSON profiles, transpile worker, rust/go console, skip/emit UI, graph-doc-split, settings env tab + define-node write-through (`1f2c051`); Refresh 3-way merge + host Contents + 17 first-party templates. |
| **3** Community library | **In progress** | Go backend done; create `vvs-library` repo · GitHub Actions CI · web UI wiring |
| **4** Collaboration | Planned | **Session client/host**, not account cloud. Research tab: lobby-host LWW (ship), Yjs-as-SoT (reject), local Go WS (later) |
| **5** UE6 plugin | Planned | Same graph → Verse text; not Blueprint VM |

Detail: [design/fidelity_streamline.md](design/fidelity_streamline.md) · backlog `.agents/memory/incomplete-ui.md` · lang emit [cross_language_mapping/SKILL.md](../.agents/skills/vvs_cross_language_mapping/SKILL.md) · library [library-backend-api.md](library-backend-api.md)

---

## Non-goals (for now)

- Bundled LLM — bring your own via the in-page agent (optional local key) or a later MCP wrapper  
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
| **MCP / AI** | Hosted app = **in-page TS agent** (starts with the editor, no extra install). Other apps / Cursor = later thin MCP wrapper over the same package; today optional localhost Go sidecar |
| **Collab** | Session **client/host**, not account cloud. See in-app Research tab |

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
