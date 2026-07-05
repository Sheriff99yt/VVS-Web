# VVS 2.0: The Definitive Tech Stack

This document outlines the finalized technology stack for Vision Visual Scripting (VVS) 2.0. Each component has been specifically selected to ensure the system is high-performance, agentic-friendly, and universally accessible across devices.

## Project Vision & Goal

* **The Vision**: Visual programming in the browser that **generates real source code** — compose logic on a graph, export to Python/JavaScript/C++/Verse/…, and integrate with your existing IDE, repo, and AI tools (MCP). Logic and syntax stay decoupled — an idea proven in the original [VVS graduation project](https://github.com/Sheriff99yt/Vision_Visual_Scripting) and extended here as an **open visual scripting platform for all engines and workflows**. See [history.md](history.md).
* **The Goal**: A modular node-based system where beginners and professionals can author flows visually, export readable code, and connect the AI subscriptions they already use — without replacing traditional development.

## 1. Frontend & UI Layer (The Experience)

### Next.js (React)
* **What**: The React framework handling routing, Server-Side Rendering (SSR), and the core application shell.
* **Why**: It is the industry standard for modern React applications, providing the most robust ecosystem for AI code generation, seamless API routes, and edge caching.

### Tailwind CSS
* **What**: A utility-first CSS framework for rapid, consistent styling of the interface.
* **Why**: Allows AI agents to accurately generate and modify UI components without the risk of breaking global stylesheets.

### React Flow (Xyflow)
* **What**: The specialized engine used to render the node-based visual graph and connections.
* **Why**: The React variant (`@xyflow/react`) provides native virtualization (rendering only visible nodes) to support 500+ nodes at 60fps, and has the most mature community and AI training data.

## 2. Backend & Performance Layer (The Muscle)

### Go (Golang) & TypeScript (Browser)
* **What**: Go handles the backend API, WebSockets, and MCP server. TypeScript handles the client-side offline transpiler.
* **Why**: Go's Goroutines easily handle concurrent connections. TypeScript in the browser allows the entire graph-to-code transpilation to run fully offline in milliseconds without server overhead.

### REST (OpenAPI) & WebSockets
* **What**: The communication protocols for type-safe API calls and real-time data streaming.
* **Why**: REST handles standard requests with type-safety via generated OpenAPI clients, while WebSockets enable real-time collaboration. This drops the proxy infrastructure overhead of gRPC.

### Client-Side Formatter (TypeScript)
* **What**: A lightweight formatter to polish the generated code directly in the browser.
* **Why**: Since transpilation happens offline in the browser, formatting must also happen there. It uses simple regex for minor cleanup (v1) and lazy-loads heavier formatters like Prettier (v2) only when needed.

## 3. Data & Community Layer (The Memory)

### Supabase (PostgreSQL)
* **What**: The primary database for storing user accounts, private projects, and the community library.
* **Why**: Offers built-in Auth and Realtime sync, drastically reducing the boilerplate needed for collaborative features. Furthermore, its Hybrid SQL+JSONB model natively solves the "Sparse Matrix" problem for syntax templates.

### pgvector (via Supabase)
* **What**: A vector database extension for PostgreSQL used to store "Node Embeddings."
* **Why**: Enables "Semantic Search," allowing users to find visual scripts by intent (e.g., "Smooth movement") rather than relying on exact keyword matches.

### IndexedDB Caching
* **What**: In-browser local storage mechanism.
* **Why**: Used for high-speed caching of the "Lego Syntax" registry. This ensures that code generation can happen entirely offline without fetching syntax tables from the server repeatedly.

## 4. AI & Intelligence Layer (The Brain)

### Bring-Your-Own-AI (BYOAI) via MCP
* **What**: Instead of VVS running its own AI, users connect their existing tools (Cursor, Claude Desktop, Codex) via the Model Context Protocol (MCP).
* **Why**: Zero AI cost for VVS, no AI provider lock-in, and users interact through the AI interfaces they already trust.

### The VVS MCP Server
* **What**: A core Go service that exposes VVS operations (`AddNode`, `ConnectPins`, `GenerateCode`) as tools to external AI agents.
* **Why**: Allows external AI tools to autonomously build and modify the visual graph on behalf of the user.

### Tree-sitter
* **What**: A dynamic incremental parsing library that analyzes official language grammars.
* **Why**: **Optional parse validator** in CI — confirms generated Rosetta output is syntactically valid for Python/JS (Verse deferred until grammar stable). Syntax rules are authored in **syntax packs** ([syntax_pack_architecture.md](syntax_pack_architecture.md)), not auto-ingested from upstream grammars.

## 5. Development & Deployment (The Foundation)

### Bun
* **What**: Package manager for `apps/web` (and future `packages/transpiler` workspace).
* **Why**: Fast installs and native TypeScript test runner for transpiler snapshot tests.
* **Current state**: Bun workspaces at repo root; `packages/graph-types`, `syntax-registry`, `language-profiles`, and `transpiler` are implemented and consumed by `apps/web`.

### Vercel & Fly.io
* **What**: The deployment platforms for the Next.js Frontend (Vercel) and the Go Backend Services (Fly.io).
* **Why**: This is a natural split: Vercel provides edge CDN and optimized hosting for Next.js, while Fly.io provides persistent lightweight VMs globally distributed to handle the long-lived WebSocket and MCP server connections.

## 6. Engine Integration Layer (Roadmap)

### Unreal Engine 6 Editor Plugin
* **What**: An in-editor graph authoring surface that shares the **same graph document schema** and **transpiler IR** as the web app, with a **Verse** emitter as the primary target.
* **Why**: Epic’s platform direction deprecates Blueprint as the long-term authoring center in favor of **Verse**. Teams still need familiar node-based workflows during migration. VVS provides a **dynamic, data-driven node system** that generates reviewable Verse — handing the torch from legacy visual scripting to a modern typed language without a separate proprietary graph runtime.
* **Relationship to web**: Browser editor for portability, collaboration, and community; UE plugin for in-engine iteration. Graphs import/export between surfaces.
* **Status**: Planned — Phase 5 in [roadmap.md](roadmap.md). No plugin code in this repository yet (`plugins/` TBD).

## 7. Resolved stack debates (summary)

These alternatives were evaluated and **locked in** for VVS 2.0:

| Topic | Decision |
|-------|----------|
| Frontend | **Next.js (React)** — not SvelteKit; React Flow ecosystem and agent tooling |
| CSS | **Tailwind (shell) + CSS Modules (graph editor)** |
| Transpiler | **TypeScript in browser** — not Go on server for v1 codegen |
| Backend | **Go** — API, MCP, WebSockets; no Python AI bridge in v1 |
| AI | **BYOAI via MCP** — no bundled LLM |
| API transport | **REST (OpenAPI) + WebSocket** — not gRPC-Web |
| Database | **Supabase (Postgres + JSONB + pgvector)** |
| Caching | **IndexedDB (client)** — Redis removed from stack |
| Tree-sitter | **Validator-only** — syntax packs + Rosetta golden tests are authoritative; optional parse check in CI |
| Deploy | **Vercel (web) + Fly.io (Go)** |
| JS toolchain | **Bun** |
