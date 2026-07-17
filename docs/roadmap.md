# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md) · **Code panel UX:** [code_panel.md](code_panel.md)

**Product default (locked):** client-first editor — **no VVS accounts**, **no dedicated app server**, **no live code execution**. Edit graphs, **Generate** ordinary source, run **logical checks / warnings** in-app. Persist via **local / folder / git**. **Executing** code and **hosting** a backend are left to third parties / static Pages. Scale the **canvas** as needed (virtualization **U83** shipped).

In-app: **Development roadmap** → Open / Done (mirrors this doc).

---

## Now (July 2026)

### Active

| Focus | IDs | Status |
|-------|-----|--------|
| **Go** language pack | U77 | Open |
| **Pack versions** manager view | U78 | Open |
| Target-language emit fidelity plans | CL backlog | Open — plans before code |
| References viewer redesign | U89 | Partial (name filter done) |
| Library page redesign | U90 | Open |
| AI / MCP autonomy audit | U91 | Partial |
| More examples (cross-lang + lang-specific) | U92 | Partial |
| Catalog / functions / async / OOP | U97–U101, U103–U106 | Partial — U97 open; U102 done |

### Long-term

| Focus | IDs | Notes |
|-------|-----|--------|
| Code → visual (reverse of Generate) | U93 | Research — must keep canvas source of truth |

### Just shipped (editor chrome & undo)

| Focus | IDs |
|-------|-----|
| Action history · menus · settings · shortcuts · audio · naming | U108–U113 |
| Symbol / class undo · tab-stable undo · lean canvas snapshots | U114–U117 |
| Code → graph **hover** (yellow node/tab outline) + full [code_panel.md](code_panel.md) | U71 follow-on |
| Canvas gestures · symbols overlay · wires · tabs · search/help | U84–U88, U94–U96, U102, U107 |
| Canvas virtualization | U83 |

```text
CLOSED                         ACTIVE                              PLANNED
─────────────────────────────  ──────────────────────────────────  ──────────────────
1  Web editor + packs          6  Polish                          3  Library (git · U90)
2  Persistence (local)            U77 Go · U78 pack versions         4  Session collab (P2P)
   + local MCP paste              CL emit plans                      5  UE6 Verse plugin
   U83 virtualization done        U89–U92 chrome · AI
                                  U97–U106 graph / OOP
                                  U93 code→visual (long-term)
```

Not current focus: dedicated VPS / self-hosted auth-Postgres product; any live code execution / Play / interpreter / runner.

---

## Next (open only)

Agent IDs in `.agents/memory/incomplete-ui.md` §13–§18. In-app: Development roadmap → **Open**.  
Emit-fidelity findings: **CL-*** log in [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) § Issues log.

### Priority

| # | Item | Notes |
|---|------|--------|
| **U77** | **Go** language pack | Eighth target — pack + emit + Test Project coverage |
| **U78** | **Pack versions** manager | Releases accumulate; list / activate; GitHub updates add a version |
| **CL** | Emit fidelity plans | See clusters below — plans before code |

### Editor & AI

| # | Item | Notes |
|---|------|--------|
| **U89** | **References** redesign | Partial — tree name filter shipped; huge-project nav still open |
| **U90** | **Library** redesign | After client-first / git-catalog direction (no hosted blob library) |
| **U91** | **AI / MCP** audit | Partial — Windsurf paste + consent; full autonomy audit open |
| **U92** | **New examples** | Partial — Branch Lab shipped; more cross-lang / lang-specific open |
| **U93** | **Code → visual** | Long-term reverse import research |

### Graph model (U97–U106)

| # | Item | Notes |
|---|------|--------|
| **U97** | Add-node menu audit | Partial — Import Module + synonyms; full catalog audit open |
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
| **Undo & chrome (U108–U117)** | Action history · File/Edit/View/Help · Settings (Shortcuts / Audio / About) · rebindable shortcuts · audio cues · **VVS Web** naming · symbol/class undo · tab-stable history · lean canvas snapshots |
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
| **6** Fidelity, canvas scale & polish | **Active** | U64–U88 / U94–U96 / U102 / U107–U117 done; next **U77–U78** + **U89–U92** + **U97–U106**; CL plans; **U93** long-term |
| **3** Community library | Planned | Separate **library git repo**; public links only · **U90** redesign |
| **4** Collaboration | Planned | **Session client/host**, not account cloud collab |
| **5** UE6 plugin | Planned | Same graph → Verse text; not Blueprint VM |

Detail: [design/fidelity_streamline.md](design/fidelity_streamline.md) · backlog `.agents/memory/incomplete-ui.md` · lang emit [cross_language_mapping/SKILL.md](../.agents/skills/vvs_cross_language_mapping/SKILL.md).

---

## Non-goals (for now)

- Bundled LLM — bring your own via MCP  
- Proprietary runtime / Blueprint VM  
- Hidden transforms or invented emit without canvas nodes  
- **Live code execution** — no Play, interpreter, runner, or “run from VVS”  
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
| **Library** | Separate official **library git repo**; public links only |
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
| [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) | Per-language emit docs + CL issues log |
| In-app **Development roadmap** | Open vs Done tracks |
| [deployment.md](deployment.md) | Legacy self-host notes — **not** product direction |
