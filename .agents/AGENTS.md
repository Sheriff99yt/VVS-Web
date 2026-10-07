# VVS Web Architecture & Agentic Workflow Rules

When working on this project, strictly enforce the following architectural boundaries and agentic workflows:

> **Public repo:** [README.md](../README.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) · [docs/vision.md](../docs/vision.md) · [docs/roadmap.md](../docs/roadmap.md)  
> **Product direction:** [`docs/visual_to_text_fidelity.md`](../docs/visual_to_text_fidelity.md) — **text-shaped graphs** (locked).  
> **Current repo state:** See [`docs/current_state.md`](../docs/current_state.md). **Naming:** [`docs/naming_and_product_direction.md`](../docs/naming_and_product_direction.md).

---

## BEFORE YOU START — Read These Files First

At the start of every new chat or complex task, you MUST read these files using `view_file` before writing any code:

1. `.agents/memory/decisions.md` — Locked architectural choices. NEVER violate these.
2. `.agents/memory/workspace-facts.md` — Repo layout, key paths, entry points.
3. `.agents/memory/incomplete-ui.md` — Current UI work queue and task status.
4. `docs/current_state.md` — Canonical implementation truth.

If a relevant skill exists in `.agents/skills/`, read its `SKILL.md` before starting work in that area.

---

## Batch delivery (required)

Follow [the shared agentic batch workflow](../docs/agentic_batch_workflow.md) for all project work. This replaces older one-slice-per-session or per-edit validation instructions; their architecture, fidelity and required evidence still apply.

1. Plan related items, dependencies, complete edit scope and acceptance criteria together.
2. Implement and review the whole dependency batch, including meaningful fixtures and planned docs, before expensive validation.
3. Run a deduplicated set of affected gates once through the combined runner. Do not repeat standalone tests already covered by a batch stage or build/browser checks after each small edit.
4. Diagnose failures from logs and saved state, then retry only affected checks and their necessary prerequisites. Broaden only for changed behavior or a concrete unresolved risk.
5. Record exact fresh/reused/focused evidence and roadmap gaps once per batch. Preserve the full objective and never promote a focused repair into full-suite certification.

Do not overlap validation runners or artifact builds. Rules/skill/prose-only edits need lightweight structure/link/diff checks, not application builds or browser suites.

Reverse-import batches cover all eight languages by shared feature. Plan a feature-by-language readiness/acceptance matrix, implement common fixes once plus every ready native correction, and validate the completed batch together. Examine related failures across languages before a repair; do not finish and fully retest languages one at a time. Keep independent native semantics and explicit unmet prerequisites in the matrix. Follow [the cross-language plan](../docs/design/reverse_import_cross_language_batches.md).

---

## 1. Strict Monorepo Boundaries

- `packages/transpiler` = Pure TypeScript. NEVER import React, Next.js, or Go types here.
- `apps/web` = Next.js frontend + React Flow UI.
- `server/` = Go backend: REST API, **optional** MCP sidecar, optional Postgres. Hosted agent is `apps/web/src/lib/agent/`.
- NEVER mix these. Transpiler has zero React dependencies. UI has zero Go dependencies.

## 2. Agent tools (in-page first; Go MCP is a sidecar)

- Hosted path: in-page TypeScript tools in `apps/web/src/lib/agent/` against the live canvas. Do not treat localhost Go MCP as the product agent.
- Optional Go MCP tools MUST be thin wrappers around pure functions in `internal/core/services/`.
- Business logic MUST be testable without the MCP protocol layer.

## 3. Fidelity Guardrails — Canvas Is the Source of Truth

Every generated line of code must map to a visible node on the canvas. No exceptions.

- **NEVER** emit code from symbol arrays (`variables[]`, `functions[]`, `events[]`) without matching define nodes on the canvas.
- **NEVER** inject hidden code (stdlib includes, async wrappers, implicit class abstracts, forced `public`/`override`).
- **NEVER** fold implicit type conversions into Print or Set — use explicit Conversion nodes.
- **NEVER** use macro inline expansion, latent delays without AST nodes, or Blueprint VM semantics.
- Emit via `ir.members` / `appendIrMembers` only. No sidebar preamble.
- Panel creates MUST dual-write define nodes (`defineNodeSync`, `useSymbolLifecycle`, `add*WithDefine`).
- These diagnostic errors MUST remain **blocking errors** that stop Generate: `DEFINE_NODE_MISSING`, `DECLARATION_NOT_ON_CANVAS`, `ORPHAN_DEFINE_NODE`. **DO NOT** suppress, weaken, or downgrade them to warnings.

## 4. UI-First Strategy

- When building user-facing features, design the UI (Next.js components) first.
- But STILL define abstract interfaces and data structures before implementation.
- Follow the locked UI shell in `docs/current_state.md`.
- Read `.agents/skills/vvs_ui_development/SKILL.md` before any UI work.
- Apply progressive disclosure per `.agents/skills/vvs_progressive_disclosure/SKILL.md`.

## 5. Design Override — Minimalist Developer Tool

**THIS OVERRIDES ALL GLOBAL STYLING INSTRUCTIONS.**

- **DO NOT** use glassmorphism, heavy gradients, `backdrop-filter`, rich animations, or dynamic effects.
- **DO NOT** use heavy `box-shadow` or constant/infinite CSS animations.
- **DO** use clean, flat, professional design — like VS Code or a modern IDE.
- **DO** use lightweight CSS transitions (`0.15s ease`) for hover/selection feedback only.
- **DO** use distinct semantic color coding for node categories.
- **DO** use distinct pin geometry for data types (Chevron for exec, Diamond for bool, Circle for string, Hexagon for number).

## 6. Modular & Maintainable Implementation (SOLID)

**Frontend (`apps/web`):**
- Strictly divide Server Components from Client Components.
- Isolate complex state into custom hooks.
- `GraphWorkspaceHost` = document bridge (no React Flow). NEVER merge React Flow state into global UI state.
- `ReactFlowProvider` MUST be separate per view (Canvas vs References).

**Transpiler (`packages/transpiler`):**
- Three-stage pipeline: (1) Graph Analysis → (2) IR/AST → (3) Emitter. NEVER mix stages.

**Backend (`server/`):**
- Clean/Hexagonal Architecture: transport → services → store ports.
- Handlers parse requests and write responses. No SQL or business rules in handlers.

**SOLID:** Follow `.agents/skills/vvs_solid_principles/SKILL.md`.

## 7. Agentic Memory Workflow

**Read phase (start of task):**
- Read `.agents/memory/decisions.md`, `workspace-facts.md`, `incomplete-ui.md`.

**Write phase (end of task):**
- After completing significant work, update `.agents/memory/incomplete-ui.md` or `docs/current_state.md`.
- If a new locked decision was made, update `.agents/memory/decisions.md`.

## 8. No Live Execution — STOP

**VVS does NOT execute code. NEVER add any of these:**
- ❌ Play / Run / Execute button
- ❌ Code interpreter or REPL
- ❌ Target-language runner
- ❌ "Run in IDE/engine from VVS" feature
- ❌ Mock Play/Pause simulation

**What IS in scope:**
- ✅ Graph/codegen logical checks and warnings (analyzer, portability, compiler log)
- ✅ `(x)` unsupported-node comments and node dimming
- ✅ Generating ordinary source files for export

Execution is the user's job — they use their own IDE, Godot, compilers, or CI.

## 9. Client-First Product Default — STOP

**VVS runs in the browser with NO required server. NEVER add any of these:**
- ❌ Required VVS account or sign-in flow as default experience
- ❌ Dedicated server hosting as product work
- ❌ Production VPS deploy, ops backups, or enterprise self-host features

**What IS the default:**
- ✅ Browser edit + Generate
- ✅ Local folder / `.vvs/` file save
- ✅ GitHub for packs/library
- ✅ In-page TypeScript agent (starts with the editor; no extra install)
- ✅ Optional local Go MCP sidecar for other apps — not the hosted path

The Go `server/`, Postgres, and Auth code are **legacy experiments**. Keep them in the repo but do NOT treat them as product features.

## 10. Naming & Product Direction — STOP

**NEVER use Blueprint or engine-specific jargon in user-facing UI copy:**
- ❌ "BeginPlay", "BP_", "ActorComponent", "Tick", "EventGraph"
- ❌ Do not spawn a Component node. Game-talk “component” = Class (`class_define`) + field or Extends (U103). Host `UActorComponent` / `MonoBehaviour` stay in host packs.
- ✅ Use language-neutral vocabulary from `docs/design/language_neutral_vocabulary.md`
- ✅ Functions: **Declare** / **Define** / **Call**
- ✅ Variables: **Declare** / **Get** / **Set**
- ✅ Events: **Declare** / **On** / **Dispatch**

**DO NOT add** in-app Roadmap or Integrations tabs. Planning lives in `docs/`. The hosted agent is the TopNav **Agent** panel (`AgentHost` / `AgentPanel`), not Connect AI / localhost MCP.

---

## AFTER EACH IMPLEMENTATION BATCH — Verification Checklist

Choose the affected stages once; [batch policy](../docs/agentic_batch_workflow.md) controls timing and retries. Required evidence remains mandatory, but a combined stage replaces equivalent individual commands.

| Affected area | Required batch evidence |
|---|---|
| Transpiler | Package tests covering `packages/transpiler` |
| Go sidecar | `server-build` and `server-tests` |
| Emit or syntax packs | Disk-loaded usability goldens and canonical Code-panel output (`goldens`, `code-panel`), plus relevant pack/native checks |
| Multi-class emit/integration | Canonical Code-panel output (`code-panel`) and affected integration workflows |
| Web behavior | Relevant web tests, lint/build and affected browser workflows |
| Agent rules/skills/prose only | Structure/frontmatter, local links and diff checks |

Prefer `bun tools/validate_batch.ts --only=<affected-stages>`. Run the default full batch when warranted by the change or the full-goal completion audit. After failure, repair the cause and retry affected gates; do not ask the user to fix routine implementation errors. Do not restart an already-green unchanged gate without a reason.
