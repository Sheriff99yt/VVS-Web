# VVS — Public Roadmap

Directional phases — not schedule commitments.  
**Ships today:** [current_state.md](current_state.md) · **North star:** [visual_to_text_fidelity.md](visual_to_text_fidelity.md)

---

## Now (July 2026)

**Active:** Phase 6 polish — Test Project goldens locked (U65); Coverage Lab primary.  
**Next:** Editor UX + fidelity (U68–U77) — comments, reverse code↔node select, chrome rethink, Go language.

| Focus | Status |
|-------|--------|
| Multi-class / graph = file / Generate honesty (U54–U58) | **Done** |
| User types (TypeRef: enum / class / Array / Map) | **Done** — [design/user_types.md](design/user_types.md) |
| Deeper fidelity (U64) | **Done** — switch + GetInput line temps pack-driven |
| Test Project rethink + expected compare (U65) | **Done** — stable localStorage seeds + `test_project_goldens/` |
| Verify as the user sees | **Locked** — Code panel emit vs goldens (`usabilityExampleGoldens.test.ts`) |
| Comment / chrome / highlight / Go (U68–U77) | **Planned** — see Next |

Not current focus: Phase 3 library backend · deploy/ops track.

```text
CLOSED                     ACTIVE                         PLANNED
─────────────────────────  ─────────────────────────────  ──────────────────
1  Web editor + packs      6  Fidelity polish               3  Community library
2  Persistence + MCP                                         4  Real-time collab
                                                             5  UE6 Verse plugin
```

---

## Next (planned — Phase 6+)

Agent IDs **U68–U77** in `.agents/memory/incomplete-ui.md` §13. In-app: Development roadmap → Open.

| # | Item | Notes |
|---|------|--------|
| **U68** | Comment **[C]** for selected nodes | Comment emits into generated code ordered by **canvas Y** (higher first). **Lock toggle** (default **off**): off = free move/resize of nodes inside; on = grouped lock (current behavior). |
| **U69** | Code panel — **user comments** toggle | Separate from language-gated `(x)` unsupported comments; shows/hides author comment lines in the preview. |
| **U70** | AI / MCP capabilities revision | Review tool surface; **consent toggle** for more dangerous capabilities (user opt-in). |
| **U71** | Code ↔ graph highlight rethink | Maintainable mapping that does not need hand updates per new node kind; **reverse select** — double-click text in Code panel selects the representing canvas node. |
| **U72** | Top bar right button collection | Unify style of the right-side TopNav control cluster. |
| **U73** | Code panel top bar UX | Revise usage, layout, and controls of the Code \| Files header. |
| **U74** | Left panel **Output** view | Rethink how Output is useful (logs, navigation, density). |
| **U75** | Node chain **auto-layout** | User selects first node + button → organize entire connected exec chain and keep it selected for move. |
| **U76** | Format **JSON** in Code panel | When a JSON file/selection is active, pretty-format on demand. |
| **U77** | **Go** language pack | Eighth target language (pack + emit + Test Project coverage). |

---

## Phase notes

| Phase | Status | One-liner |
|-------|--------|-----------|
| **1** Web editor & transpiler | Closed | Seven packs, `.vvs/`, canvas source of truth |
| **2** Persistence, auth & MCP | Closed in-repo | PostgresStore, JWT, cloud save; VPS/OAuth = ops track |
| **6** Fidelity & polish | **Active** | U64–U67 done; **next U68–U77** (comments, reverse highlight, chrome, Go) |
| **3** Community library | Planned | Upload/browse/install; UI skeleton today |
| **4** Collaboration | Planned | Go WebSockets + op log |
| **5** UE6 plugin | Planned | Same graph model → Verse; not Blueprint VM |

Detail: [design/fidelity_streamline.md](design/fidelity_streamline.md) · backlog `.agents/memory/incomplete-ui.md` §11–§13.

---

## Non-goals (for now)

- Bundled LLM — bring your own via MCP  
- Proprietary runtime / Blueprint VM  
- Hidden transforms or invented emit without canvas nodes  

---

## Follow progress

| Source | Role |
|--------|------|
| [current_state.md](current_state.md) | Implementation truth |
| [design/fidelity_streamline.md](design/fidelity_streamline.md) | Fidelity program |
| [design/user_types.md](design/user_types.md) | TypeRef / declare → type → use |
| In-app **Development roadmap** | Open vs Done tracks |
| [deployment.md](deployment.md) | Ops / VPS |
