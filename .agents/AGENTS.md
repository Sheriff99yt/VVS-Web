# VVS Web Architecture Rules

When working on this project, strictly enforce the following architectural boundaries:

> **Public repo:** [README.md](../README.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) · [docs/vision.md](../docs/vision.md) · [docs/roadmap.md](../docs/roadmap.md)  
> **Product direction:** [`docs/visual_to_text_fidelity.md`](../docs/visual_to_text_fidelity.md) — **text-shaped graphs** (locked).  
> **Current repo state:** See [`docs/current_state.md`](../docs/current_state.md). **Naming:** [`docs/naming_and_product_direction.md`](../docs/naming_and_product_direction.md).

1. **Strict Monorepo Boundaries:**
   - The transpiler MUST be pure TypeScript with zero React dependencies, living in its own package (e.g., `packages/transpiler`). It must be capable of running fully offline in the browser.
   - The Next.js frontend (`apps/web`) handles UI and React Flow.
   - The Go backend (`server/`) handles only the REST API, WebSocket collaboration, and the MCP server.

2. **MCP Tool Pure Functions:**
   - MCP tools in the Go backend MUST be thin wrappers around pure functions. The business logic must be independently testable without the MCP protocol layer.

3. **Transpiler Snapshot Testing:**
   - The transpiler is the most critical system. Any changes to code generation logic MUST be accompanied by snapshot tests verifying the exact code output for a fixed JSON graph input.
   - **Usability / Test Projects:** Also validate as the user sees — Code | Files path via `useProjectTranspileResult` / `apps/web/scripts/extract_test_project_outputs.ts` (Coverage Lab). Do not ship multi-class emit fixes proven only with raw `transpileGraph` dumps.

4. **Interface-First System Boundaries:**
   - The interface between the Graph and Code Generation must remain fully decoupled. Language definitions are data-driven (JSONB syntax registry), not hardcoded logic.
   - **Text-shaped graphs (locked):** Every behavioral node must map to a **visible, locatable** construct in generated code. See [`docs/visual_to_text_fidelity.md`](../docs/visual_to_text_fidelity.md).
   - **Canvas source of truth (locked):** Never add transpiler paths that emit from symbol arrays (`variables[]`, `functions[]`, `events[]`) without matching define nodes on the class graph. Emit via `ir.members` / `appendIrMembers` only — **no** sidebar preamble (`appendLegacyPreamble`, `useLegacyPreamble`).
   - **Dual-write on panel create:** Symbol CRUD in Project tree must create or update define nodes (`defineNodeSync`, `useSymbolLifecycle`, `add*WithDefine`) — symbol rows alone do not codegen.
   - **Strict fidelity diagnostics:** `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, and `ORPHAN_DEFINE_NODE` must remain **errors** that block Generate when fidelity breaks.
   - **No implicit type coercion** — use explicit **Conversion** nodes on the graph; transpiler must not fold casts into Print/Set. See [`docs/node_system.md`](../docs/node_system.md) §2.2b.
   - **No Blueprint VM semantics** — no macro inline expansion, latent delays without matching AST nodes, or transforms that require a proprietary runtime to match the graph.
   - **Third-party integration** — generated output must import into arbitrary stacks (IDE, git, CI, MCP) without a VVS runtime.

5. **UI-First Strategy (Adhering to Architectural Boundaries):**
   - When building user-facing features, prioritize designing the User Interface (Next.js components) first to establish the visual flow.
   - **Crucially:** This does NOT override the Interface-First workflow. While building the UI, define the abstract data structures and interfaces the UI will need. Do not implement complex backend or transpiler logic until the interfaces and UI requirements are fully aligned and approved.
   - Always build exactly as planned in the documentation (`docs/project_requirements.md`), ensuring strict separation of concerns between UI, Transpiler, and Server.
   - **Do not add in-app Roadmap or Integrations tabs** — planning and ecosystem docs belong in `docs/`; MCP is exposed via the Connect AI modal only.
   - Follow the locked UI shell in `docs/current_state.md` and `.agents/skills/vvs_ui_development/SKILL.md`.
   - Apply **show data when needed** per `.agents/skills/vvs_progressive_disclosure/SKILL.md` when adding panels, trees, inspectors, or overlays.
   - Plan language-specific UI via `docs/design/language_capability_catalog.md`; extend **usability example tests** when adding capabilities (`vvs_usability_example_tests/SKILL.md`).
   - Before new node kinds or transpiler lowering: pass the fidelity checklist in `docs/visual_to_text_fidelity.md`.

6. **Modular & Maintainable Implementation (Best Practices):**
   - **Frontend (`apps/web` - Next.js):** 
     - Strictly divide Server Components (data fetching) from Client Components (interactive UI/React Flow). 
     - Isolate complex state (e.g., Xyflow logic) into custom hooks. Keep React UI components "dumb" and purely presentational where possible.
   - **Transpiler (`packages/transpiler` - TypeScript):** 
     - Must remain pure TypeScript with zero framework dependencies.
     - Enforce the strict three-stage pipeline: (1) Graph Analysis (DAG sorting), (2) Intermediate Representation (IR AST), (3) Emitter. Do not mix logic between these stages.
     - Utilize standard compiler design patterns (e.g., Visitor and Strategy patterns) for language emission, as outlined in the project design.
   - **Backend (`server/` - Go):** 
     - Follow Clean/Hexagonal Architecture: Isolate API transport (HTTP handlers/WebSockets) from core business logic (pure functions) and data access (Supabase/DB).
     - The MCP Server tools must be thin wrappers that simply call the decoupled business logic, ensuring the logic remains testable outside the context of an AI tool call.
   - **Zero Cross-Pollination:**
     - Domains must communicate strictly through well-defined, typed interfaces (e.g., OpenAPI schemas, shared `graph-types`). Never hardcode or assume cross-domain dependencies.

7. **SOLID Principles:**
   - Apply Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion when structuring or reviewing code.
   - Follow `.agents/skills/vvs_solid_principles/SKILL.md` — VVS-specific mapping (VvsApi facade, transpiler stages, Go ports, syntax registry extension).

8. **Agentic Memory:**
   - Cross-session context lives in `.agents/memory/` — read `decisions.md`, `workspace-facts.md`, and `incomplete-ui.md` before long tasks.
   - Canonical implementation state remains `docs/current_state.md` (includes graph system architecture); memory files link to docs, they do not replace them.
   - Update memory after loop iterations per `.agents/skills/vvs_agentic_memory/SKILL.md`.
