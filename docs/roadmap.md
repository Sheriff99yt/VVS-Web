# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md)

**Product default (locked):** client-first editor — **no VVS accounts**, **no dedicated app server**, **no live code execution**. Edit graphs, **Generate** ordinary source, run **logical checks / warnings** in-app. Persist via **local / folder / git**. **Executing** code and **hosting** a backend are left to third parties / static Pages — VVS does not reinvent those wheels. Scale the **canvas** (virtualization) as a priority.

---

## Now (July 2026)

**Active:** Phase 6 polish — Go (**U77**), pack versions (**U78**), editor chrome (**U86–U90**), AI/examples (**U91–U92**). **U93** code→visual is long-term. Canvas virtualization (**U83**) + search/help quick wins (**U84/U85/U94/U95**) + selected-only node chrome overlay shipped.  
**Just shipped:** U84/U85/U94/U95 (find · tooltip · first-open help) · selected-only modifiers / import-lang overlay · Cross-language mapping docs · U79 Y→code order · U75 chain select/layout · U71 Code↔graph highlight · U68/U69 Comment [C] · U81/U82 Declare ≠ Define · U66/U67 `(x)` + dim · U64–U65 · U70–U74/U76 · U80 · warning realism cleanup.

| Focus | Status |
|-------|--------|
| Multi-class / graph = file / Generate honesty (U54–U58) | **Done** |
| User types (TypeRef: enum / class / Array / Map) | **Done** — [design/user_types.md](design/user_types.md) |
| Deeper fidelity (U64) + Test Project goldens (U65) | **Done** |
| Unsupported nodes (U66/U67) | **Done** — `(x)` comments + canvas dim |
| Function Declare ≠ Define (U81) + C++ prototypes (U82) | **Done** — [visual_to_text_fidelity.md](visual_to_text_fidelity.md) § per language |
| Same-file function emit (U80) | **Done** |
| Editor chrome (U70 stub, U72–U74, U76) | **Done** |
| Author comments (U68/U69) | **Done** — Comment [C] emit + `showUserComments` separate from `(x)` |
| Code ↔ graph highlight (U71) | **Done** — reverse select; Switch sourceMap; smooth scroll; nest-as-text gate |
| Node chain auto-layout (U75) | **Done** — S / A / S S; attrs above/below/below-extended; head-anchored; multi-chain Y-separate; comment-safe |
| Canvas Y → code order rethink (U79) | **Done** — chain primary; Y for heads; teaching warnings |
| Cross-language mapping skill layout + golden doc sync | **Done** — parent + one `<lang>.md` per target ([skill](../.agents/skills/vvs_cross_language_mapping/SKILL.md)) |
| **Canvas virtualization (U83)** | **Done** — `onlyRenderVisibleElements` on edit + reference canvases; pin/search re-render cuts for large graphs |
| Go / packs (U77–U78) | **Open** — see Next |
| Editor chrome / scale UX (U86–U90) | **Open** — details, log language filter, tabs, References, Library |
| AI / examples (U91–U92) | **Open** — MCP audit, new examples |
| Search / tooltip / first-open help (U84/U85/U94/U95) | **Done** |
| Code → visual (U93) | **Long-term** — reverse import research |
| Emit fidelity plans (CL backlog) | **Queued** — plans before code; see Next |

Not current focus: dedicated VPS / self-hosted auth-Postgres product; any live code execution / Play / interpreter / runner.

```text
CLOSED                     ACTIVE                              PLANNED
─────────────────────────  ──────────────────────────────────  ──────────────────
1  Web editor + packs      6  Polish · U77 Go · U78 packs      3  Library (git repos · U90)
2  Persistence (local)        CL emit plans (docs synced)        4  Session collab (P2P)
   + local MCP paste          U83 virtualization done            5  UE6 Verse plugin
                              U86–U92 chrome / AI / examples
                              U93 code→visual (long-term)
```

---

## Next (planned — Phase 6+)

Agent IDs in `.agents/memory/incomplete-ui.md` §13–§17. In-app: Development roadmap → **Open**.  
Emit-fidelity findings: canonical **CL-*** log in [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) § Issues log.

| # | Item | Notes |
|---|------|--------|
| **U77** | **Go** language pack | Eighth target language (pack + emit + Test Project coverage). |
| **U78** | **Pack versions** manager view | Downloaded pack releases **accumulate** (never overwrite). User lists versions, activates one. First of **multiple new top-level views**. |
| **U84** | Node search — **all graphs** toggle | **Done** — Layers toggle (default on); one clear X |
| **U85** | **F** / **Ctrl+F** find + symbol menu | **Done** — F = this graph; Ctrl+F = all graphs; context menu both |
| **U86** | Details panel **compact** rethink | Redesign compact / collapsed Details so it stays useful without clutter. |
| **U87** | Compiler Log **language scope** mode | Mode to show errors/warnings for the **current selected language only**. |
| **U88** | Graph **tabs** UI/UX rethink | Rethink tab bar layout, overflow, dirty/active affordances for many graphs. |
| **U89** | **References** viewer redesign | Redesign for **huge projects** — scale, navigation, usefulness beyond toy graphs. |
| **U90** | **Library** page redesign | Redesign after client-first / git-catalog directional change (no hosted blob library). |
| **U91** | **AI / MCP audit & agent autonomy** | Audit and upgrade local MCP + what agents can do autonomously in-app (tools, consent, safe write paths). Builds on U70 stub. |
| **U92** | **New examples** (cross-lang + lang-specific) | New StartScreen / Test Project examples: shared cross-language fixtures **and** language-specific ones (usability + goldens). |
| **U94** | **Custom tooltip** widget | **Done** — app-default `Tooltip.tsx` on chrome |
| **U95** | First graph open → **help** | **Done** — `canvasWelcomeDismissed` auto-open |
| **U93** | **Long-term: code → visual** | Invent a system that reads raw source and turns it into text-shaped graphs (import / reverse of Generate). Research track — must preserve canvas source of truth. |
| **Analysis / warnings** | Logical checks (not execution) | Keep strengthening analyzer, portability, `(x)` / dim, compiler log — **no** live run. |
| **CL backlog** | Target-language emit fidelity | Plans first. Docs match shipped goldens (2026-07-17). Clusters below. |

### Emit fidelity — open plans (CL log)

| Priority | CL IDs | Cluster | Plan needed for |
|----------|--------|---------|-----------------|
| **P0** | CL-010 | Rust inheritance / lowering | Composition `base:` vs `self.Power` / `new` — compile-shaped Rust |
| **P0** | CL-014, CL-015 | Verse GetInput + for-loop | Real string input; Verse `for` shape |
| **P1** | CL-006 | C# async return type | `async void` vs `async Task` |
| **P1** | CL-008, CL-009 | Rust static/const + imports | Modifier emit; `HashMap` `use` |
| **P1** | CL-012, CL-013 | GDScript temps + GetInput | `var` on Switch temp; print prompt |
| **P1** | CL-016 | Verse field defaults | Class-typed default → correct default |
| **P2** | CL-017, CL-018 | Switch `match` / async chips | Optional native match; disable ineffective async |

Validate cycle: `bun apps/web/scripts/validate_test_projects_folder.ts`.

### Recently completed (Phase 6)

| # | Item | Notes |
|---|------|--------|
| **U75** | Node chain **auto-layout** | **S** / **A** / **S S** `lane-topo-v1`; head-anchored; multi-chain Y-separate; comment-safe |
| **U71** | Code ↔ graph highlight rethink | Reverse select; Switch sourceMap; smooth scroll; nest-as-text gate |
| **U68** / **U69** | Comment **[C]** + user-comments toggle | Soft members; pack prefix; independent of `(x)` |
| **U64** / **U65** | Deeper fidelity temps + Test Project goldens | Pack spans; `test_project_goldens/` |
| **U66** / **U67** | `(x)` + canvas dim | Imports + Function Declare; TopNav Dim |
| **U70** | AI / MCP paste config | Stub — local paste + dangerous-tools consent |
| **U72–U74, U76** | Chrome polish | TopNav, Code top bar, Output view, Format JSON |
| **U80**–**U82** | Same-file emit + Declare ≠ Define + C++ prototypes | Function tabs = body only; U82 out-of-line |
| **U83** | Canvas virtualization | Viewport culling + pin/search subscription cuts |
| **U84** / **U85** | Node search all-graphs + F from symbol | Layers toggle; symbol→search |
| **U94** / **U95** | Tooltip widget + first-open help | `Tooltip.tsx`; welcome auto-open |
| — | Cross-language mapping docs | One parent skill + one doc per language; CL issues log |

---

## Phase notes

| Phase | Status | One-liner |
|-------|--------|-----------|
| **1** Web editor & transpiler | Closed | Seven packs, `.vvs/`, canvas source of truth |
| **2** Persistence & AI | **Redirected** | Client-first: local/folder / `.vvs/`; local MCP paste; packs via GitHub; **no dedicated server** as product |
| **6** Fidelity, canvas scale & polish | **Active** | U64–U83 done; next U77–U78 + U84–U95 chrome/AI/examples; CL emit plans; **U93** long-term code→visual |
| **3** Community library | Planned | Separate **library git repo**; public links only — not hosted blob storage · **U90** redesign |
| **4** Collaboration | Planned | **Session client/host** (game-lobby style), not account cloud collab |
| **5** UE6 plugin | Planned | Same graph model → Verse text; not Blueprint VM; run in-engine, not a browser simulator |

Detail: [design/fidelity_streamline.md](design/fidelity_streamline.md) · backlog `.agents/memory/incomplete-ui.md` · lang emit [cross_language_mapping/SKILL.md](../.agents/skills/vvs_cross_language_mapping/SKILL.md).

---

## Non-goals (for now)

- Bundled LLM — bring your own via MCP  
- Proprietary runtime / Blueprint VM  
- Hidden transforms or invented emit without canvas nodes  
- **Live code execution** — no Play, interpreter, runner, or “run from VVS”; leave execution to third parties  
- Reviving mock Play/Pause graph simulation  
- **Dedicated server hosting** — no official VPS / self-hosted Supabase product track; static Pages + local projects only  

---

## Client-first direction (locked intent — July 2026)

Product default: **no VVS accounts, no dedicated app server**. Browser/editor + local / folder / git; optional GitHub for packs, library links, and **static** web hosting (e.g. Pages).

**Do not delete** legacy hosted/cloud/`server/` paths — keep them in the repo for reference and local experiments, but they are **not** an active roadmap to stand up a dedicated backend. Hide/disable in the default client experience.

| Pillar | Direction |
|--------|-----------|
| **Edit + Generate** | Entirely client-side; **no** required backend |
| **Persist** | Local storage, **folder / `.vvs/`**, git — not “our server” |
| **Checks** | In-app **logical** analysis and **warnings** only — not execution |
| **Execution** | **Out of scope** — third-party IDEs, engines, compilers, CI |
| **Hosting** | **No dedicated server** — static showcase (Pages) OK; not Postgres/Auth/API as product |
| **Canvas scale** | Virtualization (U83) shipped — keep measuring large graphs; further win via narrower node subscriptions |
| **Pack updates** | Fetch from GitHub; versions **accumulate**; Pack versions view (U78) |
| **Library** | Separate official **library git repo**; public repo links only; no blob hosting |
| **MCP / AI** | Paste config; user runs **local MCP** on device; **desktop only** — **mobile: no AI** |
| **Collab** | Session **client/host**, not account cloud multiplayer |

---

## Follow progress

| Source | Role |
|--------|------|
| [current_state.md](current_state.md) | Implementation truth |
| [design/fidelity_streamline.md](design/fidelity_streamline.md) | Fidelity program |
| [design/user_types.md](design/user_types.md) | TypeRef / declare → type → use |
| [`.agents/skills/vvs_cross_language_mapping/SKILL.md`](../.agents/skills/vvs_cross_language_mapping/SKILL.md) | Per-language emit docs + CL issues log |
| In-app **Development roadmap** | Open vs Done tracks |
| [deployment.md](deployment.md) | Legacy self-host notes — **not** product direction |
