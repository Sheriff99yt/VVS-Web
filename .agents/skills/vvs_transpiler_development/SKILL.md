---
name: VVS Transpiler Development
description: Triggers when modifying or building the TypeScript code generation engine in packages/transpiler.
---

# Transpiler Boundaries & Testing

- The transpiler MUST be pure TypeScript with zero React dependencies, living in `packages/transpiler` (directory exists but is **not implemented yet**). It must be capable of running fully offline in the browser.
- Until the package exists, graph types live in `apps/web/src/types/` and `CodePreviewPanel` uses mock string templates — do not treat mock output as transpiler logic.
- The transpiler is the most critical system. Any changes to code generation logic MUST be accompanied by snapshot tests verifying the exact code output for a fixed JSON graph input.

# Modular & Maintainable Implementation (Transpiler)

- Enforce the strict three-stage pipeline: (1) Graph Analysis (DAG sorting), (2) Intermediate Representation (IR AST), (3) Emitter. Do not mix logic between these stages.
- Utilize standard compiler design patterns (e.g., Visitor and Strategy patterns) for language emission, as outlined in the project design.
