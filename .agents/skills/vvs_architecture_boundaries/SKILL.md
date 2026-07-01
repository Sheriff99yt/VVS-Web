---
name: VVS Architecture Boundaries
description: Triggers when creating new modules, adding dependencies, or establishing communication between different packages in the monorepo.
---

# Strict Monorepo Boundaries

- The transpiler (`packages/transpiler`) MUST be pure TypeScript with zero React dependencies. **Package not implemented yet** — types temporarily in `apps/web/src/types/`.
- The Next.js frontend (`apps/web`) handles UI and React Flow.
- The Go backend (`server/`) handles only the REST API, WebSocket collaboration, and the MCP server. **Currently skeleton only** — see `docs/current_state.md`.

# Interface-First System Boundaries

- The interface between the Graph and Code Generation must remain fully decoupled. Language definitions are data-driven (JSONB syntax registry), not hardcoded logic.

# Zero Cross-Pollination

- Domains must communicate strictly through well-defined, typed interfaces (e.g., OpenAPI schemas, shared `graph-types`). Never hardcode or assume cross-domain dependencies.
