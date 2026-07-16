# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md)

---

## Now (July 2026)

**Active:** Phase 6 polish — Test Project goldens locked (U65); Coverage Lab primary.  
**Next:** Editor UX + fidelity (U68–U77) · pack versions / new views (U78+) · client-first MCP.

| Focus | Status |
|-------|--------|
| Multi-class / graph = file / Generate honesty (U54–U58) | **Done** |
| User types (TypeRef: enum / class / Array / Map) | **Done** — [design/user_types.md](design/user_types.md) |
| Deeper fidelity (U64) | **Done** — switch + GetInput line temps pack-driven |
| Test Project rethink + expected compare (U65) | **Done** — stable localStorage seeds + `test_project_goldens/` |
| Verify as the user sees | **Locked** — Code panel emit vs goldens (`usabilityExampleGoldens.test.ts`) |
| Comment / chrome / highlight / Go (U68–U77) | **Planned** — see Next |
| Pack versions + new app views (U78+) | **Planned** — see Next |
| Canvas Y → code order rethink (U79) | **Planned** — investigate & redesign |

Not current focus: hosted cloud auth / Postgres as product default (prefer client + git).

```text
CLOSED                     ACTIVE                         PLANNED
─────────────────────────  ─────────────────────────────  ──────────────────
1  Web editor + packs      6  Fidelity polish               3  Library (git repos)
2  Persistence (local)                                       4  Session collab (P2P)
   + local MCP paste                                         5  UE6 Verse plugin
```

---

## Next (planned — Phase 6+)

Agent IDs **U68–U79** in `.agents/memory/incomplete-ui.md` §13–§14. In-app: Development roadmap → Open.

| # | Item | Notes |
|---|------|--------|
| **U68** | Comment **[C]** for selected nodes | Comment emits into generated code ordered by **canvas Y** (higher first). **Lock toggle** (default **off**): off = free move/resize of nodes inside; on = grouped lock (current behavior). |
| **U69** | Code panel — **user comments** toggle | Separate from language-gated `(x)` unsupported comments; shows/hides author comment lines in the preview. |
| **U70** | AI / MCP panel | Paste-ready IDE/CLI config; user runs **local MCP** on **desktop** when needed; consent toggle for dangerous tools. **No AI on mobile for now.** No VVS account. |
| **U71** | Code ↔ graph highlight rethink | Maintainable mapping that does not need hand updates per new node kind; **reverse select** — double-click text in Code panel selects the representing canvas node. |
| **U72** | Top bar right button collection | Unify style of the right-side TopNav control cluster. |
| **U73** | Code panel top bar UX | Revise usage, layout, and controls of the Code \| Files header. |
| **U74** | Left panel **Output** view | Rethink how Output is useful (logs, navigation, density). |
| **U75** | Node chain **auto-layout** | User selects first node + button → organize entire connected exec chain and keep it selected for move. |
| **U76** | Format **JSON** in Code panel | When a JSON file/selection is active, pretty-format on demand. |
| **U77** | **Go** language pack | Eighth target language (pack + emit + Test Project coverage). |
| **U78** | **Pack versions** manager view | Downloaded pack releases **accumulate** (never overwrite). User lists versions, activates one. First of **multiple new top-level views** (with Library, etc.). GitHub update check prompts to add a version, not replace. |
| **U79** | **Investigate / rethink canvas Y → code order** | Audit member/event/flow emit ordering vs `position.y` (topo + Y tie-break, event peers, comments). Document intended model; redesign if chain wires and height still conflict for authors. |

---

## Phase notes

| Phase | Status | One-liner |
|-------|--------|-----------|
| **1** Web editor & transpiler | Closed | Seven packs, `.vvs/`, canvas source of truth |
| **2** Persistence & AI | **Redirecting** | Client-first: local/folder save; local MCP paste config; pack updates via GitHub; no accounts required |
| **6** Fidelity & polish | **Active** | U64–U67 done; **next U68–U79** (comments, reverse highlight, chrome, Go, pack versions, Y-order rethink) |
| **3** Community library | Planned | Separate **library git repo**; public links only; PR/submit workflow — not hosted blob storage |
| **4** Collaboration | Planned | **Session client/host** (game-lobby style), not account cloud collab |
| **5** UE6 plugin | Planned | Same graph model → Verse; not Blueprint VM |

Detail: [design/fidelity_streamline.md](design/fidelity_streamline.md) · backlog `.agents/memory/incomplete-ui.md` §11–§14.

---

## Non-goals (for now)

- Bundled LLM — bring your own via MCP  
- Proprietary runtime / Blueprint VM  
- Hidden transforms or invented emit without canvas nodes  

---

## Client-first direction (locked intent — July 2026)

Product default: **no VVS accounts, no required server**. Browser/editor + local storage; optional GitHub for pack/library data.

**Do not delete** hosted/cloud/MCP-server paths — keep them in the codebase but **inactive / disabled / hidden** in the default client-only experience until explicitly re-enabled (env flag or settings). Examples: Auth, Connect AI cloud probe, HTTP API mode chrome, cloud save wording, marketplace Library backend hooks.

| Pillar | Direction |
|--------|-----------|
| **Runtime** | Entirely client-side for edit + Generate; server not required on PC |
| **Pack updates** | Fetch from GitHub; versions **accumulate**; Pack versions view (U78) to list / set active |
| **Library** | Separate official **library git repo**; users submit **public** repo links (private denied); no blob hosting |
| **MCP / AI** | AI panel paste config; user runs **local MCP** on device; **desktop only for now** — **mobile: no AI** |
| **Collab** | Session **client/host** (game-lobby style), not account cloud multiplayer |
| **Auth / cloud API** | Present but **disabled by default**; optional self-host / `API_MODE=http` remains for later |

---

## Follow progress

| Source | Role |
|--------|------|
| [current_state.md](current_state.md) | Implementation truth |
| [design/fidelity_streamline.md](design/fidelity_streamline.md) | Fidelity program |
| [design/user_types.md](design/user_types.md) | TypeRef / declare → type → use |
| In-app **Development roadmap** | Open vs Done tracks |
| [deployment.md](deployment.md) | Ops / VPS |
