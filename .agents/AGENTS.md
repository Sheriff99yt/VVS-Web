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

## 1. Strict Monorepo Boundaries

- `packages/transpiler` = Pure TypeScript. NEVER import React, Next.js, or Go types here.
- `apps/web` = Next.js frontend + React Flow UI.
- `server/` = Go backend: REST API, MCP server, optional Postgres.
- NEVER mix these. Transpiler has zero React dependencies. UI has zero Go dependencies.

## 2. MCP Tool Pure Functions

- MCP tools in Go MUST be thin wrappers around pure functions in `internal/core/services/`.
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
- ✅ Desktop local MCP + paste config

The Go `server/`, Postgres, and Auth code are **legacy experiments**. Keep them in the repo but do NOT treat them as product features.

## 10. Naming & Product Direction — STOP

**NEVER use Blueprint or engine-specific jargon in user-facing UI copy:**
- ❌ "BeginPlay", "BP_", "ActorComponent", "Tick", "EventGraph"
- ✅ Use language-neutral vocabulary from `docs/design/language_neutral_vocabulary.md`
- ✅ Functions: **Declare** / **Define** / **Call**
- ✅ Variables: **Declare** / **Get** / **Set**
- ✅ Events: **Declare** / **On** / **Dispatch**

**DO NOT add** in-app Roadmap or Integrations tabs. Planning lives in `docs/`. MCP is exposed via the Connect AI modal only.

---

## AFTER YOU FINISH — Verification Checklist

Before declaring any task complete, run these checks:

**If you touched `packages/transpiler`:**
```powershell
cd packages/transpiler; bun test
```

**If you touched `server/`:**
```powershell
cd server; go build ./...
cd server; go test ./...
```

**If you touched transpiler emit or syntax packs:**
```powershell
bun apps/web/scripts/validate_test_projects_folder.ts
```

**If you touched multi-class emit or integration code:**
```powershell
bun apps/web/scripts/extract_test_project_outputs.ts
```

**General rule:** Run command → Read error → Fix code → Run again → Repeat until green. Do NOT ask the user to fix errors for you.
