# VVS Web — Project Requirements

This document captures functional and non-functional requirements for Vision Visual Scripting 2.0. For **phased delivery** see [roadmap.md](roadmap.md); for **what is built today** see [current_state.md](current_state.md).

---

## 1. Project Vision

**VVS** is an open **visual programming** platform: compose logic on a graph, generate ordinary source code, and integrate with tools you already use. It strictly decouples **Logic** (the node graph) from **Syntax** (the generated code).

**Origin:** The project [started as a university graduation prototype](https://github.com/Sheriff99yt/Vision_Visual_Scripting) — a Python desktop app where visual nodes translate into **any programming language the user selects**. That core idea persists in **VVS Web**. See [history.md](history.md).

**Product direction:** VVS builds on traditional coding — it does not replace it. It is beginner-friendly, integration-first, and works with **your existing AI subscriptions** via MCP (no bundled LLM). The web editor uses common software terms (graph, project, variable), not engine jargon — see [naming_and_product_direction.md](naming_and_product_direction.md).

**Open visual scripting for all workflows:** The long-term goal is a **portable graph language and transpiler** usable across browsers, repos, AI agents, and engines — not a single-host visual tool. **VVS Web** is the open codebase where that platform is being built today.

**Strategic engine integration:** A planned **Unreal Engine 6 editor plugin** will share the same graph schema and transpiler pipeline, targeting **Verse** as the primary in-engine language. The goal is a **dynamic, extensible node system** that helps teams **transition from deprecated Blueprint-centric workflows** to Verse-first development while keeping graphs portable and generated code reviewable. See [vision.md](vision.md) and [roadmap.md](roadmap.md).

**The Goal**: Build a modular, portable node-based programming system where AI agents can autonomously construct logic flows without hallucinating syntax. Accessible as an offline-capable Progressive Web App and, on the roadmap, inside UE6 — allowing developers to jump in and out on any device or authoring surface.

---

## 2. Core Architectural Requirements

### 2.1 Logic ↔ Syntax Decoupling
- The node graph represents **pure logic** — it is language-agnostic
- Code syntax is a **separate, swappable concern** resolved at generation time
- Changing the target language must **never** alter the user's graph
- The AI operates on logic only; the engine handles all syntax

### 2.2 Three-Stage Transpilation Pipeline
- **Stage A — Graph Analysis**: Validate the graph as a Directed Acyclic Graph (DAG), detect circular dependencies, and perform topological sort to determine execution order
- **Stage B — Intermediate Representation (IR)**: Map visual nodes into an Abstract Syntax Tree (AST) of language-agnostic structures (`VariableDeclaration`, `FunctionCall`, `IfStatement`, etc.)
- **Stage C — Emitter / Printer**: Walk the IR and produce the final code string using the active language's syntax profile

### 2.3 Data-Driven Syntax ("Lego" Construction)
- Language constructs are stored as **ordered JSONB arrays** of `{ type: "static" | "slot", val: "..." }` entries in **syntax packs** (`@vvs/syntax-packs`) — see [syntax_pack_architecture.md](syntax_pack_architecture.md)
- Each construct (if-statement, for-loop, variable assignment, etc.) is broken into granular slots: Prefix, Condition, Joiner, Body, Suffix
- **Base + overlay inheritance:** a language family base pack plus capability overlays (e.g. `javascript.es2022`); explicit merge order, last-wins, every template records `sourcePackId`
- **Hybrid emit:** simple constructs in JSON templates; events, hoisting, async, multi-file, and span registration stay in TypeScript printers registered via `PrinterRegistry`
- Adding a new language = profile entry + base syntax pack + Rosetta fixtures + emitter registration — zero changes to lowering IR schema
- The system must handle **varying construct complexity** without wasted empty cells (solved by JSONB arrays instead of fixed columns)

### 2.4 Out-of-Band Token System
- Use Unicode Control Characters for formatting tokens in the syntax registry:
  - `\x01` (SOH) → New Line
  - `\x02` (STX) → Indent Increment
  - `\x03` (ETX) → Indent Decrement
  - `\x04` (EOT) → Scope Start (e.g., `{`, `:`, `do`)
  - `\x05` (ENQ) → Scope End (e.g., `}`, `end`, dedent)
- These tokens are **collision-proof** — they cannot appear in user-authored code
- Ultra-compact for database storage (1 byte each)
- A runtime indentation tracker converts tokens into correctly-spaced whitespace based on nesting depth

### 2.5 High-Performance Code Assembly
- Use **buffer streaming** (array push + single join) instead of string concatenation
- The emitter performs a **single-pass scan** of the token stream
- Transpilation of 500+ node graphs must complete in **milliseconds**
- Heavy transpilation must run off the main thread (Web Workers / backend) to keep the UI at 60fps

---

## 3. Functional Requirements

### 3.1 Visual Graph Editor
- [ ] Render a node-based graph canvas with draggable nodes and wire connections
- [ ] Support **500+ nodes** in a single graph without frame drops (target: 60fps)
- [x] Only render nodes currently visible on screen (virtualization)
- [ ] Support sub-graphs / nested node groups
- [ ] Provide a minimap for navigation on large graphs
- [ ] Support zoom, pan, and fit-to-view controls
- [ ] Support multi-select (click-drag selection box)
- [ ] Support copy, paste, and duplicate of node selections
- [ ] Undo / Redo for all graph operations
- [ ] Mobile-friendly: radial context menus, magnetic pin snapping, gesture-based navigation (pinch-to-zoom, two-finger pan)

### 3.2 Node System
- [ ] Each node has typed input/output pins (String, Integer, Float, Boolean, Exec, etc.)
- [ ] Connections enforce **type safety** — incompatible pin types cannot be connected
- [ ] Nodes have a visual type identity (color-coded by category: logic, math, I/O, control flow, etc.)
- [ ] Custom node definitions stored as structured data (JSON schema)
- [ ] Support for flow-control nodes: If/Else, For Loop, While Loop, Switch/Case, Sequence
- [ ] Support for data nodes: Variables (Get/Set), Literals, Function Calls, Operators
- [ ] Support for user-defined function nodes (encapsulating sub-graphs)

### 3.3 Code Generation (Transpiler)
- [x] Generate syntactically valid code from the visual graph for multiple target languages
- [x] **V1 languages**: Python, JavaScript/TypeScript, C++, **Verse**
- [x] **V2 languages** (stretch): **GDScript, Rust, C#** — pack-first base packs, 14 Rosetta goldens each, UI codegen targets — **shipped** July 2026 (milestone 3)
- [ ] Language switching is instant — the graph does not change, only the emitter output
- [ ] Generated code is human-readable and properly formatted (indentation, spacing, line breaks)
- [ ] Post-generation formatting pass (server-side Prettier/Clang-Format for v1; optional WASM formatters for later phases)
- [ ] Display generated code in a live preview panel that updates as the graph changes

### 3.4 AI Integration (Bring-Your-Own-AI via MCP)
- [ ] VVS does **not** run its own AI — users connect their existing AI tools (Cursor, Claude, Codex, etc.)
- [ ] Go backend includes an **MCP server** exposing VVS operations as tools
- [ ] MCP tools include: `ListAvailableNodes`, `GetGraph`, `AddNode`, `ConnectPins`, `RemoveNode`, `GenerateCode`, `SearchLibrary`, `ImportScript`
- [ ] MCP transport: HTTP/SSE (streamable HTTP transport) for remote connectivity
- [ ] The web app provides a **Connect AI** modal in TopNav — user copies a connection URL into their AI tool's MCP settings
- [ ] External AI tools can stream node placements to the graph in real-time
- [ ] The engine validates every AI-generated connection for type safety before rendering
- [ ] The AI picks from a predefined set of available nodes (cannot hallucinate nodes that don't exist)
- [ ] MCP server authenticates external connections and scopes them to the user's projects
- [ ] Works with **any** MCP-compatible AI tool — no provider lock-in

### 3.5 Community Library
- [ ] Users can **upload** visual scripts (graph JSON + metadata) to a shared library
- [ ] Users can **browse, search, and download** community scripts via the **Library** app view (TopNav → Library)
- [ ] Scripts have metadata: title, description, tags, author, target language(s), node count
- [ ] **Semantic search** via pgvector — find scripts by intent ("smooth movement") not just keywords
- [ ] Rating / like system for community scripts
- [ ] Version tracking for uploaded scripts
- [ ] Scripts can be imported directly into the user's graph editor

### 3.6 User Accounts & Authentication
- [ ] User registration and login (Supabase Auth)
- [ ] Auth methods to decide: email/password, OAuth (Google/GitHub), magic links
- [ ] User profiles: username, avatar, bio, published scripts count
- [ ] Private projects (only visible to the owner)
- [ ] Public projects (visible in the community library)

### 3.7 Real-Time Collaboration
- [ ] Multiple users can view and edit the same graph simultaneously
- [ ] Cursor presence: see other users' cursors / selections in real-time
- [ ] Conflict resolution strategy for simultaneous edits
- [ ] Powered by **Go WebSocket** server (Phase 4) — not Supabase Realtime for product collab

---

## 4. Non-Functional Requirements

### 4.1 Performance
- [x] Graph editor maintains **60fps** with 500+ nodes via virtualization
- [ ] Code generation for a 500-node graph completes in **< 100ms** (client-side TypeScript transpiler)
- [ ] Initial page load (Time to Interactive) under **3 seconds** on 4G mobile
- [ ] Bundle size is a **mild concern** — acceptable to be slightly larger if it provides ecosystem and maturity benefits (confirmed trade-off)
- [ ] Transpilation runs on the main thread for small graphs; Web Worker for graphs > 200 nodes

### 4.2 Accessibility & Portability
- [ ] Runs in any modern browser (Chrome, Safari, Firefox, Edge)
- [ ] **Progressive Web App (PWA)**: installable on mobile/desktop home screens
- [ ] **Full offline mode**: graph editing AND code generation work without internet
- [ ] Syntax registry cached in IndexedDB for offline transpilation
- [ ] Auto-sync to cloud (Supabase) when connectivity is restored
- [ ] Responsive layout: usable on mobile phones, tablets, and desktops
- [ ] Touch-optimized controls for mobile (radial menus, gesture nav, magnetic snapping)

### 4.3 Maintainability
- [ ] Strict separation of concerns: UI layer, graph engine, transpiler engine (client), API layer (server), MCP layer (server)
- [ ] All systems communicate via well-defined interfaces / contracts
- [ ] Data-driven design: syntax rules, node definitions, and language profiles are **data**, not code
- [ ] Agentic-friendly codebase: structure and conventions that AI coding assistants can reason about accurately
- [ ] Comprehensive test coverage for the transpiler (the most critical system, now client-side TypeScript)

### 4.4 Scalability
- [ ] Backend handles thousands of concurrent users syncing graphs (Go concurrency)
- [ ] Community library scales to tens of thousands of uploaded scripts
- [ ] Adding a new target language requires **zero engine code changes** — only database entries
- [ ] Node definitions are extensible without modifying core engine logic

### 4.5 Security
- [ ] Authentication and authorization on all API endpoints
- [ ] MCP server authenticates external AI tool connections and scopes to user's projects
- [ ] Input validation on all user-submitted data (graph JSON, script metadata)
- [ ] Community library moderation tools (flag/report/remove)
- [ ] Generated code is sandboxed — VVS generates code, it does not execute it
- [ ] Rate limiting on MCP tool calls and community library writes

---

## 5. Technical Decisions (Locked In)

These decisions have been evaluated against all requirements and are confirmed.

| Decision | Selection | Key Reason |
|---|---|---|
| **Frontend Framework** | Next.js (React) | Xyflow React is the most mature graph library; largest AI training data; best gesture/animation ecosystem |
| **Graph Engine** | Xyflow (React Flow) | Native virtualization for 500+ nodes; most battle-tested; largest community |
| **CSS Strategy** | Hybrid: Tailwind (app shell) + CSS Modules (graph editor) | Tailwind is fast for standard UI; CSS Modules give full control for custom node/wire rendering |
| **Transpiler Runtime** | TypeScript (browser) | Lego emitter is lightweight string assembly; runs in single-digit ms; enables full offline code generation |
| **Backend Language** | Go (Golang) | REST API, MCP server, WebSocket collaboration; zero-pain concurrency via Goroutines |
| **AI Strategy** | Bring-Your-Own-AI via MCP server | Zero AI cost; no provider lock-in; users connect existing tools (Cursor, Claude, Codex) |
| **Communication** | REST (OpenAPI) + WebSocket | Type safety via generated TS clients from OpenAPI spec; no gRPC proxy overhead |
| **Database** | Self-hosted **Supabase Postgres** + JSONB via Go **`pgx`** | Relational ownership + document snapshots; pgvector on same DB |
| **Vector Search** | pgvector (Postgres extension) | Semantic search in Phase 3 — no separate vector DB |
| **Code Formatting** | Lightweight client-side TS formatter (v1); lazy-load Prettier (Phase 2+) | Transpiler tokens handle indentation; minor whitespace cleanup done client-side |
| **Deployment** | **VPS: self-hosted Supabase + Go**; optional CDN for Next.js — [deployment.md](deployment.md) | Final architecture; shared hosting = static web only |
| **Caching** | IndexedDB (client) + Go in-process | Syntax registry small; Redis deferred until multi-replica scale |
| **Syntax packs + Tree-sitter** | Syntax packs authoritative; Tree-sitter validator-only | Print rules in `@vvs/syntax-packs` with Rosetta golden tests; optional Tree-sitter parse validation in CI — not syntax author — see [syntax_pack_architecture.md](syntax_pack_architecture.md) |

---

## 6. Open Decisions (Requiring Resolution)

| # | Decision | Options | Impact |
|---|---|---|---|
| 1 | **Auth providers (v1)** | **Locked:** GitHub OAuth + email via GoTrue — magic links optional | See [deployment.md](deployment.md) |
| 2 | **Monorepo structure** | Turborepo, Nx, or simple folder structure for Next.js + Go | Build tooling, CI/CD, developer experience |
| 3 | **Collaboration conflict resolution** | OT (Operational Transform), CRDT, or simple last-write-wins for v1? | Complexity, real-time editing quality |
| 4 | **MCP auth** | **Locked:** Supabase JWT passthrough — Go verifies JWKS, scopes tools to `user_id` | See [deployment.md](deployment.md) |

---

## 7. Development Phases

Phases, UE6/Verse plugin track, and explicit non-goals live in **[roadmap.md](roadmap.md)** — keep that file as the single public roadmap.

---

## 8. Current Implementation Status

Canonical snapshot of what exists in the repo versus what is planned: **[current_state.md](current_state.md)** (updated when the UI shell or integration boundaries change).

---

## 9. Missing / To-Be-Defined

These items are acknowledged as necessary but not yet specified:

- [ ] **Testing strategy**: Unit tests (transpiler — TypeScript), integration tests (Go API + MCP), E2E tests (graph editor interactions)
- [ ] **Error handling & user feedback**: How invalid graphs surface errors in the UI
- [ ] **Graph versioning / undo-redo**: State history management approach
- [ ] **CI/CD pipeline**: Build, test, and deploy automation — VPS Compose for Supabase + Go; see [deployment.md](deployment.md)
- [ ] **Logging & observability**: Structured logging, error tracking, performance monitoring (especially MCP server)
- [ ] **Rate limiting & abuse prevention**: MCP tool call limits, community moderation workflows
- [ ] **MCP auth & session management**: How external AI tools authenticate and scope access to user projects
