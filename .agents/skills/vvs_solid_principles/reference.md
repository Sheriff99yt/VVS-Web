# VVS SOLID — Reference Examples

Concrete do/don't patterns for `apps/web`, `server/`, and `packages/transpiler`.

---

## S — Single Responsibility

### Frontend

**Good**
```text
GraphCanvas.tsx       → layout, React Flow wiring, delegates spawn to context menu
useGraphState.ts      → nodes/edges + history only
ProjectContext.tsx    → selection, tabs, compile flags (not fetch)
lib/api/index.ts      → VvsApi facade
lib/api/mock.ts       → localStorage persistence only
```

**Bad**
```text
TopNav.tsx            → menus + fetch save + transpile + simulation physics
CodePreviewPanel.tsx  → UI + full DAG analysis + Python emitter
```

### Backend

**Good**
```text
transport/http/projects.go  → decode JSON, call service, encode JSON
services/graph.go           → validate connection, apply operation (pure)
ports/services.go           → GraphService interface only
```

**Bad**
```text
cmd/vvs-server/main.go      → routes + SQL + MCP + graph validation (growing god file)
```

### Transpiler (planned)

**Good**
```text
analyze/     → DAG sort, cycle detection
ir/          → build language-agnostic AST
emit/        → walk IR + syntax registry
```

**Bad**
```text
transpile.ts → 800-line function: sort + IR + Python strings + format
```

---

## O — Open/Closed

### New target language (OCP flagship for VVS)

**Good**
1. Add syntax registry rows (data)
2. Add `JavaScriptEmitter` implementing `Emitter`
3. Register in emitter factory map
4. **Do not** change `analyzeGraph()` or IR node types

**Bad**
```typescript
// CodePreviewPanel.tsx — closed for extension
if (lang === 'python') { ... }
else if (lang === 'javascript') { ... }
// every new language edits this file
```

### New community library filter

**Good:** Add category enum + mock data row; filter logic is generic.

**Bad:** Hardcode `if (category === 'Scripts')` special cases per asset in the view.

### New MCP tool

**Good**
```go
func HandleAddNode(ctx context.Context, params AddNodeParams) (Result, error) {
    return graphService.AddNode(ctx, params) // existing service
}
```

**Bad:** Duplicate graph mutation logic inside MCP handler only.

---

## L — Liskov Substitution

### VvsApi mock vs HTTP

Both must implement:

```typescript
saveProject(id: string, data: ProjectDocument): Promise<void>
loadProject(id: string): Promise<ProjectDocument | null>
getHealth(): Promise<HealthResponse>
```

**Violation:** Mock returns `{ status: 'saved' }` but HTTP returns `{ ok: true }` — callers need `if (mockMode)`.

**Fix:** Shared `types/api/project.ts` DTOs; both transports return identical shapes.

### GraphRepository

Memory repo used in tests must enforce the same rules as future Supabase repo:

- Cannot save graph with invalid pin connection if service rejects it
- `GetGraph` returns `nil, ErrNotFound` — not empty graph with 200

### Emitter strategies

Every emitter must accept the same IR; emitting empty string for unsupported nodes should be explicit error, not silent skip — consistent across languages.

---

## I — Interface Segregation

### Go ports (existing sketch)

```go
// Good — segregated
type GraphRepository interface { GetGraph; SaveGraph; DeleteGraph }
type LibraryRepository interface { SearchScripts; PublishScript }

// Bad — forces unused methods
type VVSStore interface {
    GetGraph; SaveGraph; SearchScripts; PublishScript; BroadcastWS; HandleMCP
}
```

### React context

**Good:** `useProject()` for project-level; canvas components use `useReactFlow()` + narrow selectors.

**Bad:** One context value with 30 fields where `StatusBar` re-renders on every node drag.

### Transpiler stages

```typescript
interface GraphAnalyzer { analyze(graph: Graph): AnalysisResult }
interface IrBuilder { build(graph: Graph, analysis: AnalysisResult): IrModule }
interface Emitter { emit(ir: IrModule, syntax: SyntaxRegistry): string }
```

Analyzer does not need `emit()`.

---

## D — Dependency Inversion

### UI + API (documented loop)

```text
TopNav → VvsApi.saveProject()
            ↓
         IApiTransport (interface)
            ↓
    MockTransport | HttpTransport
```

Components never know which transport is active.

### Go hexagonal

```text
HTTP Handler → GraphService (interface)
                  ↓
               graphService struct
                  ↓
               GraphRepository (interface)
                  ↓
               memoryRepo | supabaseRepo
```

Handlers depend on `GraphService`, not `*sql.DB`.

### Transpiler in browser

```text
CodePreviewPanel → generateCode(graph, options)
                      ↓
                   @vvs/transpiler (pure TS package)
```

Panel depends on function contract, not internal emitter classes (can inject for tests).

---

## SOLID × VVS architecture matrix

| VVS rule (AGENTS.md) | SOLID principle |
|----------------------|-----------------|
| Transpiler pure TS, no React | S, D |
| Three-stage pipeline | S, O |
| MCP thin wrappers | S, D |
| Data-driven syntax | O |
| `VvsApi` facade | D, L, ISP |
| Hexagonal Go | S, D, ISP |
| `graph-types` shared contract | L, D |
| UI dumb / hooks for state | S |

---

## Common refactor recipes

| Smell | SOLID fix |
|-------|-----------|
| Component imports `api-mock` | DIP: route through `VvsApi` |
| Growing `ProjectContext` | ISP/SRP: split graph vs project vs compile |
| Language switch in UI | OCP: move to transpiler + registry |
| `main.go` handlers grow | SRP: `transport/http` + `services` |
| Test needs full server | DIP: test `services` with mock repo |
| New node type needs GraphCanvas edit | OCP: catalog-driven spawn |
