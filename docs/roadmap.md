# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md)

---

## Now (July 2026)

**Active:** Phase 6 polish — Go pack, pack versions, Y-order.  
**Just shipped:** U75 chain select/layout (S / A / S S; above·below·below-extended; head-anchor; multi-chain separate; comment-safe) · U71 Code↔graph highlight · U68/U69 Comment [C] (create locks) · U81/U82 Declare ≠ Define · U66/U67 `(x)` + dim · U64–U65 · U70–U74/U76 · U80.

| Focus | Status |
|-------|--------|
| Multi-class / graph = file / Generate honesty (U54–U58) | **Done** |
| User types (TypeRef: enum / class / Array / Map) | **Done** — [design/user_types.md](design/user_types.md) |
| Deeper fidelity (U64) + Test Project goldens (U65) | **Done** |
| Unsupported nodes (U66/U67) | **Done** — `(x)` comments + canvas dim |
| Function Declare ≠ Define (U81) + C++ prototypes (U82) | **Done** — [visual_to_text_fidelity.md](visual_to_text_fidelity.md) § per language |
| Same-file function emit (U80) | **Done** |
| Editor chrome (U70 stub, U72–U74, U76) | **Done** |
| Go / packs / Y-order (U77–U79) | **Open** — see Next |
| Author comments (U68/U69) | **Done** — Comment [C] emit + `showUserComments` separate from `(x)` |
| Code ↔ graph highlight (U71) | **Done** — reverse select; Switch sourceMap; smooth scroll; nest-as-text gate |
| Node chain auto-layout (U75) | **Done** — S / A / S S; attrs above/below/below-extended; head-anchored; multi-chain Y-separate; comment-safe |
| Canvas Y → code order rethink (U79) | **Partial** — comment attach Y locked; member/flow rethink still open |

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

Agent IDs in `.agents/memory/incomplete-ui.md` §13–§14. In-app: Development roadmap → **Open**.

| # | Item | Notes |
|---|------|--------|
| **U77** | **Go** language pack | Eighth target language (pack + emit + Test Project coverage). |
| **U78** | **Pack versions** manager view | Downloaded pack releases **accumulate** (never overwrite). User lists versions, activates one. First of **multiple new top-level views**. |
| **U79** | **Investigate / rethink canvas Y → code order** | **Partial:** comments attach to topmost member absolute Y. Still open: member/event/flow when chain vs height conflict. |

### Recently completed (Phase 6)

| # | Item | Notes |
|---|------|--------|
| **U75** | Node chain **auto-layout** | **S** forward + data attrs; **A** full chain; **S S** `lane-topo-v1` (above / below / below-extended stair + spine buffer); head-anchored; multi-chain vertical separate; works inside locked comments |
| **U71** | Code ↔ graph highlight rethink | Reverse select; generic `sourceMap` UI; Switch structured sink; smooth auto-scroll; Coverage Lab completeness + sink nest-as-text CI gate |
| **U68** | Comment **[C]** on selection | Soft members; lock = move-comment-moves-members + recapture; unlock follow + snap; pack prefix (not `(x)`) |
| **U69** | Code panel user-comments toggle | `showUserComments` / `emitUserComments` — independent of `(x)` |
| **U64** | Deeper fidelity temps | Pack + expressionSpans for switch / GetInput |
| **U65** | Test Project goldens | `test_project_goldens/` + Code panel extract path |
| **U66** | `(x)` unsupported comments | Imports + Function Declare (incl. abstract on non-C++/C#); Code panel toggle; Coverage Lab lock |
| **U67** | Canvas dim unsupported nodes | Same `nodeEffectiveness` resolver; TopNav Dim toggle |
| **U70** | AI / MCP paste config | Stub — local paste + dangerous-tools consent |
| **U72–U74, U76** | Chrome polish | TopNav buttons, Code top bar, Output view, Format JSON |
| **U80** | Same-file function emit | Function tabs = Edit function body only |
| **U81** | Function Declare ≠ Define | `function_define` + `function_implement`; Call / Declare / Define menu |
| **U82** | C++ Declare / Define emit | Prototypes + out-of-line; other langs `(x)` + in-class Define |

---

## Phase notes

| Phase | Status | One-liner |
|-------|--------|-----------|
| **1** Web editor & transpiler | Closed | Seven packs, `.vvs/`, canvas source of truth |
| **2** Persistence & AI | **Redirecting** | Client-first: local/folder save; local MCP paste config; pack updates via GitHub; no accounts required |
| **6** Fidelity & polish | **Active** | U64–U71, U75, U80–U82 done; **next U77–U79** |
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
