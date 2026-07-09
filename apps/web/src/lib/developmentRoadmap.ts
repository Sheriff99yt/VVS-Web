export type RoadmapItemStatus = 'done' | 'partial' | 'planned';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status?: RoadmapItemStatus;
}

export interface RoadmapSection {
  id: string;
  title: string;
  items: RoadmapItem[];
  /** Public roadmap phase number (1–6), when applicable */
  phase?: number;
  /** Visual emphasis in the Roadmap view */
  emphasis?: 'active' | 'shipped';
}

export interface RoadmapPhase {
  number: number;
  id: string;
  title: string;
  summary: string;
  status: 'shipped' | 'active' | 'planned';
}

/** High-level phases — aligned with docs/roadmap.md */
export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    number: 1,
    id: 'phase-1',
    title: 'Web editor & transpiler',
    summary: 'Browser editor, client transpiler, .vvs/ folders, local Go API + MCP',
    status: 'shipped',
  },
  {
    number: 2,
    id: 'phase-2',
    title: 'Persistence, auth & MCP core',
    summary:
      'Core project persistence, JWT auth, and authenticated MCP flows are implemented in-repo',
    status: 'shipped',
  },
  {
    number: 3,
    id: 'phase-3',
    title: 'Community library',
    summary: 'Upload, browse, pgvector semantic search',
    status: 'active',
  },
  {
    number: 4,
    id: 'phase-4',
    title: 'Collaboration',
    summary: 'Go WebSockets, presence, op log',
    status: 'planned',
  },
  {
    number: 5,
    id: 'phase-5',
    title: 'UE6 plugin',
    summary: 'In-engine canvas, Verse emission, web round-trip',
    status: 'planned',
  },
  {
    number: 6,
    id: 'phase-6',
    title: 'Scale & polish',
    summary: 'M3 language platform closed; perf/env/mobile/enterprise remain',
    status: 'active',
  },
];

/** Shipped editor and platform capabilities (aligned with docs/current_state.md). */
export const SHIPPED_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'phase-2-foundation',
    title: 'Phase 2 foundation — cloud in repo',
    phase: 2,
    emphasis: 'shipped',
    items: [
      {
        id: 'phase2-arch-locked',
        title: 'Deployment architecture (locked)',
        description:
          'Self-hosted Supabase (Postgres + GoTrue) on VPS; Go is the only product API via pgx — PostgREST not used for editor or MCP paths.',
        status: 'done',
      },
      {
        id: 'phase2-postgres-store',
        title: 'ProjectStore + PostgresStore (pgx)',
        description:
          'ProjectStore interface with MemoryStore (default) and PostgresStore (DATABASE_URL); embedded migrations; docker-compose Postgres + GoTrue for local dev.',
        status: 'done',
      },
      {
        id: 'phase2-auth-middleware',
        title: 'JWT auth middleware & dev user',
        description:
          'Go JWT verification (SUPABASE_JWT_SECRET); AUTH_REQUIRED flag; DevUserID when auth off; user_id scoping on HTTP + MCP services.',
        status: 'done',
      },
      {
        id: 'phase2-bearer-client',
        title: 'Bearer token in VvsApi client',
        description:
          'session.ts holds Supabase access token; authHeaders() attaches Authorization on project APIs; refreshes on AUTH_CHANGED_EVENT.',
        status: 'done',
      },
      {
        id: 'phase2-auth-button-ui',
        title: 'Minimal Supabase login UI',
        description:
          'AuthButton in TopNav + StartScreen — email/password sign-in via Supabase client when NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set.',
        status: 'done',
      },
      {
        id: 'phase2-health-store-auth',
        title: 'Health chrome (store / auth / user)',
        description:
          'GET /health returns store + auth mode + userId; StatusBar and useApiHealth surface honest connection details in HTTP mode.',
        status: 'done',
      },
      {
        id: 'phase2-editor-cloud-sync',
        title: 'Editor cloud source of truth',
        description:
          'Authenticated sessions load/save via Go API first (cloudPersistence.ts); debounced cloud autosave; localStorage as offline cache.',
        status: 'done',
      },
      {
        id: 'phase2-mcp-prod',
        title: 'Production MCP auth path',
        description:
          'MCP session auth propagation; Connect AI modal documents prod URL + Bearer token; probe sends auth when signed in.',
        status: 'done',
      },
    ],
  },
  {
    id: 'shell',
    title: 'App shell & navigation',
    items: [
      {
        id: 'views',
        title: 'Top-level views',
        description: 'Canvas, References, Library, and in-app Development roadmap.',
      },
      {
        id: 'start-screen',
        title: 'Project hub',
        description:
          'Start screen — new/open folder (.vvs/ overlay), recent projects, import JSON, Hello World & Calculator example cards, Library and Roadmap explore shortcuts. SSR hydration-safe; library browse uses session drafts (no spurious recents).',
      },
      {
        id: 'nav-history',
        title: 'Editor navigation history',
        description: 'Browser back/forward restores graph tab, view, selection, and references focus.',
      },
      {
        id: 'breadcrumb',
        title: 'Graph breadcrumb',
        description:
          'Module › graph path above tabs; settings modal for module name, target language, and linked project environment.',
      },
      {
        id: 'status-bar',
        title: 'Status bar chrome',
        description:
          'API/offline indicator with HealthResponse store, auth mode, and userId (HTTP mode); saved time, graph nav & minimap toggles, code & log toggles, error jump.',
      },
      {
        id: 'panel-layout',
        title: 'Resizable panels',
        description: 'Collapsible graph navigator and code preview; persisted UI preferences including details height.',
      },
      {
        id: 'floating-panels',
        title: 'Floating overlays',
        description: 'Details (top-right) and compiler log (bottom-right) with compact/expanded modes.',
      },
      {
        id: 'auth-button',
        title: 'Sign in (Supabase GoTrue)',
        description:
          'AuthButton in TopNav + StartScreen — email/password when NEXT_PUBLIC_SUPABASE_URL is set; GitHub OAuth optional via env flag.',
      },
      {
        id: 'auto-workflow',
        title: 'Auto save & auto generate',
        description:
          'TopNav split toggle + action buttons — [Auto save|Save] and [Auto generate|Generate]; debounced persist (local + cloud when signed in) and compile.',
      },
    ],
  },
  {
    id: 'editor',
    title: 'Graph editor',
    items: [
      {
        id: 'canvas',
        title: 'React Flow canvas',
        description: 'Custom nodes, edges, reroutes, comments, grouping, undo/redo, dirty tab indicators.',
      },
      {
        id: 'selection-toolbar',
        title: 'Selection toolbar',
        description:
          'Canvas-level GraphSelectionToolbar — copy, delete, comment, and ungroup actions when nodes are selected (selection-only overlay).',
      },
      {
        id: 'graph-shortcuts',
        title: 'Keyboard shortcuts & help',
        description:
          'Central graphShortcuts registry; useGraphKeyboardShortcuts; ? overlay (GraphShortcutsHelp) lists canvas + project bindings.',
      },
      {
        id: 'select-all-similar',
        title: 'Select all & select similar',
        description: 'Ctrl+A selects all nodes on the active graph; Ctrl+Shift+A selects nodes sharing the same kindId.',
      },
      {
        id: 'selection-highlight-sync',
        title: 'Selection highlight sync',
        description:
          'Comment, reroute, and tab switches keep canvas selection, floating details, and code preview highlights in sync. Tree symbol selection drives preview transpile and sourceMap ranges; canvas node picks override tree focus for dispatch/call highlights.',
        status: 'done',
      },
      {
        id: 'editor-focus',
        title: 'Editor focus coordinator',
        description:
          'useEditorFocus — single navigation API from Project tree to canvas tab + selection; browser back/forward restores event/function/class picks; no stale navigate() wiping symbol selection.',
        status: 'done',
      },
      {
        id: 'canvas-perf',
        title: 'Canvas interaction perf',
        description:
          'Drag/click optimizations — reduced re-renders during node moves and selection changes on large graphs.',
      },
      {
        id: 'spawn-menu-keys',
        title: 'Spawn menu key handling',
        description: 'Space spawn menu no longer fires duplicate nodes when the key repeats or overlaps with search.',
      },
      {
        id: 'tabs',
        title: 'Multi-graph tabs',
        description:
          'Container graph tabs (Project map, module graphs), function graphs, per-tab documents; drag-reorder tabs; close any tab except pinned Project map — no per-class canvas tabs.',
        status: 'done',
      },
      {
        id: 'tree',
        title: 'Project explorer',
        description:
          'Graph folders → classes; Functions → Events → Variables under active class; event rows with call child (drag for Call/Declare/Define menu); Environment API and generated exports.',
        status: 'done',
      },
      {
        id: 'search',
        title: 'Node search',
        description: 'Ctrl+K palette to find and spawn nodes from the registry catalog.',
      },
      {
        id: 'context-menu',
        title: 'Context menu spawn',
        description:
          'Right-click canvas to add nodes from core pack, project symbols, and linked environment API.',
      },
      {
        id: 'refs',
        title: 'References view',
        description: 'UE-style reference browser — focus graph, referencers, dependencies, read-only canvas.',
      },
      {
        id: 'inspector',
        title: 'Floating details panel',
        description:
          'Context inspector for nodes, variables, events, and functions; vertical resize; state persists.',
      },
      {
        id: 'wiring',
        title: 'Typed wiring & cycles',
        description: 'Pin-type validation, cross-graph cycle prevention, linear chain break warnings.',
      },
      {
        id: 'wires-delete',
        title: 'Wire editing',
        description: 'Alt+click, right-click, or Delete key to remove wires and reroutes.',
      },
      {
        id: 'overload-picker',
        title: 'Call overload picker',
        description: 'Dropdown on call nodes when a function has multiple overloads — syncs pins via graphBinding.overloadId.',
      },
      {
        id: 'syntax-pack-lock-ui',
        title: 'Syntax pack lock settings',
        description: 'Pin base pack + overlays per language family in graph settings; persisted to .vvs/project.json.',
      },
      {
        id: 'env-import-ui',
        title: 'OpenAPI / AsyncAPI import',
        description:
          'EnvironmentImportModal — paste or upload specs, validate manifest, link to project; mock localStorage + optional HTTP POST.',
      },
      {
        id: 'folder-key',
        title: 'Stable folder reopen',
        description: 'folderKeyFromHandleName() — same on-disk folder reopens under one recent entry.',
      },
      {
        id: 'http-api-ui',
        title: 'HTTP mode wiring',
        description:
          'VvsApi listProjects, compileProject, save/load with Bearer token via authHeaders(); StatusBar polls /health when NEXT_PUBLIC_API_MODE=http.',
      },
      {
        id: 'mcp-ui',
        title: 'Connect AI (Phase 1 MCP)',
        description: 'TopNav modal — local MCP at localhost:8080/mcp; probe detects endpoint when server runs.',
      },
      {
        id: 'label-free',
        title: 'Label-free load migration',
        description: 'kindId backfill on snapshot load; binding-first normalizeNodeData in apps/web.',
      },
      {
        id: 'clipboard',
        title: 'Clipboard workflow',
        description:
          'Cut, copy, paste, duplicate (in-app + OS clipboard) with unique edge IDs on batch paste; extract selection to function (Ctrl+Shift+E).',
      },
      {
        id: 'symbol-drag-spawn',
        title: 'Drag symbols to canvas',
        description:
          'Variables: Get / Set / Declare. Functions: Call / Declare / Define. Events: Dispatch / Declare / On. Classes: Declare on the member chain. Declare inserts member-chain nodes on the class home graph; Define/On opens or spawns implementation.',
        status: 'done',
      },
      {
        id: 'pins-ui',
        title: 'Pin geometry & inline widgets',
        description:
          'Distinct shapes per pin type (incl. array); inline editors on unwired pins; scroll wheel steps number values (±1, Shift ±10, Ctrl ±0.1) without fighting canvas zoom or node drag.',
        status: 'done',
      },
      {
        id: 'sim',
        title: 'Simulation stepping',
        description: 'Mock play/pause/step with execution highlight on the graph (no real runtime yet).',
      },
      {
        id: 'workspace-isolation',
        title: 'Isolated graph domains',
        description: 'Separate React Flow providers for edit vs reference; GraphWorkspaceHost owns documents.',
      },
    ],
  },
  {
    id: 'symbols',
    title: 'Symbols & codegen',
    items: [
      {
        id: 'functions',
        title: 'Function symbols',
        description: 'Bindings, visibility, overloads, virtual/async flags, call nodes with graphBinding pin sync.',
      },
      {
        id: 'macros',
        title: 'Macros (removed)',
        description: 'Deprecated — macro tabs and use_macro migrated to Function + Call on load.',
        status: 'done',
      },
      {
        id: 'text-shaped',
        title: 'Text-shaped graphs',
        description:
          'Canvas is the codegen source of truth — IR pipeline, ordered define-chain emit, hoisted imports, Wait/Await Wait, event Dispatch (direct call); every behavioral node maps to visible export text with sourceMap. Emit/Subscribe hidden-runtime nodes blocked.',
        status: 'done',
      },
      {
        id: 'environments',
        title: 'Project environments',
        description:
          'VS Code–style templates: live manifest catalog (9+ packs, categories), linked manifest, Environment API browse/spawn, env.call_native, module + host multi-file codegen.',
      },
      {
        id: 'symbol-declare-vocabulary',
        title: 'Declare / Handler vocabulary',
        description:
          'UI labels aligned to canvas roles: Declare member nodes on the chain, handler labels use the user’s event name (no forced On prefix), Call/Dispatch at invoke sites. symbolRole on registry kinds; spawn catalog grouping by Declare / Handlers / Calls.',
        status: 'done',
      },
      {
        id: 'events',
        title: 'Custom & entry events',
        description:
          'events[] with role entry | custom; event_member_define + event_define handlers + dispatch nodes (direct call); Emit/Subscribe blocked (HIDDEN_EVENT_RUNTIME_UNSUPPORTED); tree + New event here…; new class/project seeds program entry on canvas (createClassHomeBootstrap); legacy event_on_start removed from spawn catalog.',
        status: 'done',
      },
      {
        id: 'variables',
        title: 'Project variables',
        description: 'Instance/static binding, readonly flag, Get/Set nodes, rename propagation.',
      },
      {
        id: 'linked-graphs',
        title: 'Cross-graph nodes',
        description: 'Call function and import module nodes with dependency indexing; hoisted imports.',
      },
      {
        id: 'registry',
        title: 'Unified node registry',
        description:
          '@vvs/syntax-registry core pack; expandProjectSymbols and expandEnvironmentSymbols spawn palettes.',
      },
      {
        id: 'syntax-pack-migration-py-cpp',
        title: 'Syntax pack migration — Python & C++',
        description:
          'Pack-first leaf + control-flow print for python/cpp: renderTemplate engine, expanded base JSON, unified blocks.ts, VarDefine via packs, get_input/switch TS printers, packMigrationGate CI.',
        status: 'done',
      },
      {
        id: 'syntax-pack-migration-js-verse-shipped',
        title: 'Syntax pack migration — JavaScript & Verse',
        description:
          'Milestone 2: full javascript.base + verse.base packs; all v1 families pack-first; switch/get_input registered for all families; legacy stmt/blocks emitters removed.',
        status: 'done',
      },
      {
        id: 'syntax-pack-shell-templates-shipped',
        title: 'Pack-driven module shells',
        description:
          'Shell templates in base packs (ClassModuleOpen, EventHandlerOpen, FunctionDefOpen); emit/shell.ts; pack layout emptyHandlerBody/emptyFunctionBody; unified classModule.ts (per-language emit files removed).',
        status: 'done',
      },
      {
        id: 'syntax-pack-block-helpers-shipped',
        title: 'Shared block close helpers',
        description:
          'blockHelpers.ts — condSpanOffset, blockCloseLine, ifElseLine shared by print/blocks.ts and emit/sinkStatements.ts; C++ ForLoopClose/WhileLoopClose pack keys.',
        status: 'done',
      },
      {
        id: 'tree-sitter-ci-shipped',
        title: 'Tree-sitter parse validation CI',
        description:
          'Python/JS Rosetta outputs validated on Linux CI (validate:parse --strict); local dev skips when native prebuild unavailable.',
        status: 'done',
      },
      {
        id: 'transpile',
        title: 'Client transpiler',
        description:
          'IR pipeline (analyze → graphToIr → print via syntax packs → emit/classModule); Python, JS, C++, Verse, GDScript; control flow; example + Rosetta snapshot tests; 233+ package tests.',
        status: 'done',
      },
      {
        id: 'syntax-packs',
        title: 'Syntax packs & Rosetta suite',
        description:
          '@vvs/syntax-packs — base JSON (Rosetta + shell templates), capability overlays, 14 fixtures × 5 families, packCoverage + fidelity linter + parse validation script.',
        status: 'done',
      },
      {
        id: 'syntax-pack-gdscript-shipped',
        title: 'GDScript syntax pack family',
        description:
          'gdscript.base.json; pack-first print + module shells; get_input + switch printers; 14 Rosetta goldens; UI target; scripts/update-gdscript-goldens.ts.',
        status: 'done',
      },
      {
        id: 'syntax-pack-rust-shipped',
        title: 'Rust syntax pack family',
        description:
          'rust.base.json; struct+impl module shells; get_input + switch printers; 14 Rosetta goldens; UI target (.rs); scripts/update-rust-goldens.ts.',
        status: 'done',
      },
      {
        id: 'syntax-pack-csharp-shipped',
        title: 'C# syntax pack family (M3 complete)',
        description:
          'csharp.base.json; class module shells; get_input + switch printers; 14 Rosetta goldens; UI target (.cs); scripts/update-csharp-goldens.ts. Closes Phase 6 language platform milestone.',
        status: 'done',
      },
      {
        id: 'milestone-3-language-platform',
        title: 'Milestone 3 — language platform closed',
        description:
          'Seven pack-driven codegen families (py/js/cpp/verse/gdscript/rust/csharp); 98 Rosetta goldens; Godot env pack. Next: usability/workflow standards (terms_refactor_plan).',
        status: 'done',
      },
      {
        id: 'codegen-target',
        title: 'Capability-based codegen targets',
        description:
          'CodegenTarget (family + capabilities + optional syntaxPackLock in .vvs/project.json); language-profiles capabilities arrays.',
      },
      {
        id: 'source-map',
        title: 'Codegen source map',
        description:
          'Nested branch/import/event ranges in transpiler sourceMap; multi-select code highlight with per-node category colors in CodeMirror; tree symbol selection resolves graph node IDs via symbolCodegenLink.',
        status: 'done',
      },
      {
        id: 'portability',
        title: 'Portability warnings',
        description: 'Per-target feature matrix surfaced in compiler log, status bar, and code panel badge.',
      },
      {
        id: 'analysis',
        title: 'Project analysis',
        description:
          'analyzeProject diagnostics (DEFINE_NODE_MISSING, DECLARATION_NOT_ON_CANVAS, ORPHAN_DEFINE_NODE, PROGRAM_ENTRY_MISSING, PROGRAM_ENTRY_NOT_ON_CANVAS, LIFECYCLE_NODE_DEPRECATED, HIDDEN_EVENT_RUNTIME_UNSUPPORTED, MULTICAST_REQUIRES_SUBSCRIBE, UNRESOLVED_SYMBOL_REF); portability scan; compile gate blocks Generate on fidelity errors.',
        status: 'done',
      },
    ],
  },
  {
    id: 'multi-class',
    title: 'Multi-class & canvas-defined symbols',
    emphasis: 'shipped',
    items: [
      {
        id: 'snapshot-v3',
        title: 'ProjectSnapshot v3',
        description:
          'classes[], activeClassId, graphContainers[]; classId on symbols; classHomeGraphId = containerId (graphTabId deprecated); v1/v2 loaders upgrade and merge legacy class/main documents into home graphs.',
        status: 'done',
      },
      {
        id: 'graph-containers',
        title: 'Graph-as-canvas model',
        description:
          'Each graphContainer is a real canvas (`documents[container.id]`). Project map (`main-graph`) is organizational — graph_ref navigation only, no codegen. Module graphs (e.g. Calculator) hold class_define chains plus runtime flow. Classes are symbols nested under graphs, not separate tabs.',
        status: 'done',
      },
      {
        id: 'class-lifecycle',
        title: 'Class management',
        description:
          'Create, rename, delete, and move classes between graph folders; selecting a class opens its container graph and sets activeClassId; Functions/Variables sections scoped to active class.',
        status: 'done',
      },
      {
        id: 'define-nodes',
        title: 'Canvas define nodes',
        description:
          'class_define, var_define, function_define, event_member_define on the container graph exec chain; panel↔canvas dual-write via defineNodeSync; legacy class tabs and documents.main migrate to home graphs on load.',
        status: 'done',
      },
      {
        id: 'declare-implement-emit',
        title: 'Declare vs implement codegen',
        description:
          'Member-chain Declare emits native declarations (e.g. C++ prototypes) or comment placeholders (# Declare name) when a target has no declare form; On handlers and function tabs own bodies in a second pass. sourceMap highlights declare lines separately from handler blocks.',
        status: 'done',
      },
      {
        id: 'ordered-emit',
        title: 'Ordered member emit',
        description:
          'Transpiler walks the member chain for declaration order (appendIrMembers) then implementations (appendMemberImplementations); no sidebar preamble fallback.',
        status: 'done',
      },
      {
        id: 'canvas-source-of-truth',
        title: 'Canvas source of truth',
        description:
          'Strict canvas-only codegen: symbol tables index only; DEFINE_NODE_MISSING, DECLARATION_NOT_ON_CANVAS, and ORPHAN_DEFINE_NODE block Generate; panel dual-write define nodes.',
        status: 'done',
      },
      {
        id: 'program-entry',
        title: 'Explicit program entry',
        description:
          'User-defined program start: events[] role entry + event_member_define + event_define on class graph; on_start emitted only from canvas; legacy event_on_start deprecated (LIFECYCLE_NODE_DEPRECATED); no transpiler-injected empty on_start.',
        status: 'done',
      },
      {
        id: 'go-mcp-classes',
        title: 'Go v3 + MCP class tools',
        description:
          'Domain v3 normalize; list_classes / add_class MCP tools; optional class_id on get_graph and add_node.',
        status: 'done',
      },
    ],
  },
  {
    id: 'workflow',
    title: 'Project workflow',
    items: [
      {
        id: 'save',
        title: 'Save & load',
        description:
          'ProjectSnapshot v3 — browser localStorage for quick projects, or git-friendly `.vvs/` folder layout on disk (split graphs, symbols, integration.json). Import/export JSON.',
      },
      {
        id: 'project-folder',
        title: 'On-disk project folders',
        description:
          'File System Access API — new/open folder, IndexedDB handle storage, save writes `.vvs/project.json`, graphs, symbols, and integration config; `.gitignore` scaffold.',
      },
      {
        id: 'integration-config',
        title: 'Codegen integration settings',
        description:
          'Per-target emit paths (moduleDir, moduleFile, functionDir), host file skip/emit policies in integration.json; editable in Graph settings → Code generation.',
      },
      {
        id: 'folder-browser',
        title: 'Project folder browser',
        description:
          'Browse on-disk tree from recents; copy repo-relative paths (.vvs/…, src/…). Browser security prevents full OS paths (e.g. C:\\…).',
      },
      {
        id: 'save-on-disk-prompt',
        title: 'Save-on-disk prompt',
        description:
          'Browser-only projects prompt to save to a folder on close; status bar shortcut. Promotes to `.vvs/` without losing browser backup.',
      },
      {
        id: 'library-ui',
        title: 'Library UI',
        description:
          'Templates (categorized environments) · Community · Installed; start project from template; install/link community assets (mock catalog).',
      },
      {
        id: 'mcp-modal',
        title: 'Connect AI modal',
        description:
          'MCP URL copy, live probe against Go /mcp, honest offline messaging; tools/mcp.cursor.example.json for Cursor.',
      },
      {
        id: 'api-facade',
        title: 'VvsApi facade',
        description:
          'Mock (localStorage) and HTTP (Go) transports — save, load, list, compile, health, MCP probe; Bearer token on HTTP when session is set.',
      },
      {
        id: 'save-before-compile',
        title: 'Save-before-compile (HTTP)',
        description:
          'Generate persists snapshot to Go API before POST …/compile so server-side compile always sees the latest graph.',
      },
      {
        id: 'codemirror',
        title: 'Code preview panel',
        description:
          'CodeMirror 6 with syntax highlighting, transpiler-driven output, and multi-file tabs; Project map tab skips codegen; module graphs codegen from container document.',
        status: 'done',
      },
      {
        id: 'error-nav',
        title: 'Error navigation',
        description: 'Compiler log and status bar jump to failing nodes on the canvas.',
      },
    ],
  },
  {
    id: 'platform',
    title: 'Monorepo & backend',
    items: [
      {
        id: 'graph-types',
        title: '@vvs/graph-types',
        description:
          'Shared snapshot v3, ClassSymbol, GraphContainer, classHomeGraphId, defineNodes helpers, analyzeProject, legacy class-tab migration, `.vvs/` folder constants.',
        status: 'done',
      },
      {
        id: 'syntax-registry',
        title: '@vvs/syntax-registry',
        description: 'Core node pack JSON, list/resolve, symbol expansion for project palette.',
      },
      {
        id: 'language-profiles',
        title: '@vvs/language-profiles',
        description: 'Target-language native/emulated/unsupported matrix and analyzePortability.',
      },
      {
        id: 'environment-templates',
        title: '@vvs/environment-templates',
        description:
          'Manifests, OpenAPI/AsyncAPI/Backstage import, validateEnvironmentManifest, env-import CLI, built-in packs.',
      },
      {
        id: 'transpiler-pkg',
        title: '@vvs/transpiler',
        description:
          'Language-neutral lower/graphToIr → print/ (PrinterRegistry + syntax packs) → emit/; CallNative, multi-file emit, integration paths.',
      },
      {
        id: 'syntax-packs-pkg',
        title: '@vvs/syntax-packs',
        description:
          'Print template packs, resolver, Rosetta golden suite, fidelity linter; generate:rosetta script for agent workflows.',
      },
      {
        id: 'server-registry',
        title: 'Go registry API',
        description:
          'Health, core-pack nodes, environments, syntax-packs catalog; domain snapshot v3 mirror; ListAvailableNodes + ListSyntaxPacks tests.',
      },
      {
        id: 'server-http',
        title: 'Go project HTTP API',
        description:
          'ProjectStore port — MemoryStore (default) or PostgresStore (DATABASE_URL); GET/PUT /api/projects, list, POST …/compile; CORS + Authorization header.',
      },
      {
        id: 'server-auth',
        title: 'JWT auth middleware',
        description:
          'Go middleware — AUTH_REQUIRED + SUPABASE_JWT_SECRET; DevUserID when auth off; user_id scoping on HTTP + MCP services.',
      },
      {
        id: 'server-mcp',
        title: 'MCP server (local + JWT)',
        description:
          'SSE at /mcp — list_available_nodes, list_syntax_packs, list_classes, add_class, get_graph, add_node, remove_node, connect_pins, generate_code, save_project; class_id scoping; session auth when Bearer set.',
      },
      {
        id: 'dev-startup',
        title: 'One-command dev startup',
        description:
          'tools/start_app.ps1 launches Next.js (HTTP API mode) + Go server; setup_env.ps1 seeds NEXT_PUBLIC_API_MODE=http in .env.local.',
      },
    ],
  },
];

/** Planned or in-progress capabilities (aligned with docs/roadmap.md and current_state gaps). */
export const FUTURE_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'phase-2-deploy',
    title: 'Deployment & operations',
    items: [
      {
        id: 'self-hosted-deploy',
        title: 'Full Supabase Docker on VPS',
        description:
          'Dev VPS + live VPS Compose stacks (GoTrue, Kong, Studio); Caddy TLS; shared hosting limited to static web assets only.',
        status: 'planned',
      },
      {
        id: 'github-oauth',
        title: 'GitHub OAuth + email auth',
        description:
          'GoTrue GitHub provider wired in docker-compose; AuthButton shows GitHub when NEXT_PUBLIC_GITHUB_OAUTH_ENABLED=true. Email/password is v1 default.',
        status: 'partial',
      },
      {
        id: 'ops-backups',
        title: 'VPS ops & backups',
        description: 'Daily pg_dump or volume snapshots, pinned Supabase images, rate limits on MCP, health checks.',
        status: 'planned',
      },
      {
        id: 'pwa',
        title: 'PWA offline sync',
        description: 'Service worker + IndexedDB cached registry; sync to Postgres when connectivity returns.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'syntax-packs',
    title: 'Syntax packs & agent maintenance',
    items: [
      {
        id: 'syntax-pack-migration-py-cpp',
        title: 'Pack migration — Python & C++',
        description:
          'Milestone 1 shipped: python/cpp leaf + block emit via JSON templates; render.ts; packCoverage + packMigrationGate CI; get_input + switch registered printers.',
        status: 'done',
      },
      {
        id: 'syntax-pack-migration-js-verse',
        title: 'Pack migration — JavaScript & Verse',
        description:
          'Milestone 2 shipped: full base packs, pack-first print for all v1 families, switch/get_input registered printers, legacy emitters removed.',
        status: 'done',
      },
      {
        id: 'syntax-pack-mcp',
        title: 'MCP syntax pack tools',
        description:
          'list_syntax_packs + list_available_nodes + propose_syntax_delta + run_rosetta_suite + validate_generated_parse available on local MCP.',
        status: 'done',
      },
      {
        id: 'syntax-pack-shell-templates',
        title: 'Pack-driven module shells',
        description:
          'ClassModuleOpen/Close, EventHandlerOpen, FunctionDefOpen templates in base packs; emit/shell.ts + pack emptyHandlerBody/emptyFunctionBody layout keys.',
        status: 'done',
      },
      {
        id: 'syntax-pack-block-helpers',
        title: 'Shared block close helpers',
        description:
          'blockHelpers.ts — condSpanOffset, blockCloseLine, ifElseLine shared by print/blocks.ts and emit/sinkStatements.ts; C++ ForLoopClose/WhileLoopClose pack keys.',
        status: 'done',
      },
      {
        id: 'tree-sitter-ci',
        title: 'Tree-sitter parse validation',
        description:
          'Python/JS Rosetta outputs validated via Tree-sitter on Linux CI (`validate:parse --strict` in `.github/workflows/ci.yml`); local dev skips when native prebuild unavailable.',
        status: 'done',
      },
      {
        id: 'packages-ci',
        title: 'Monorepo packages CI job',
        description:
          'GitHub Actions packages job: syntax-packs + transpiler + graph-types tests; web job lint/build; server job go build + go test.',
        status: 'done',
      },
      {
        id: 'syntax-pack-gdscript',
        title: 'GDScript pack family (Phase 6)',
        description:
          'Fifth pack-driven family: gdscript.base.json, 14× Rosetta goldens, transpiler wiring, web UI target, golden regen script, Godot env pack + language profile.',
        status: 'done',
      },
    ],
  },
  {
    id: 'phase-6-gdscript',
    title: 'Phase 6 — GDScript (Godot)',
    phase: 6,
    emphasis: 'shipped',
    items: [
      {
        id: 'gdscript-pack-rosetta',
        title: 'GDScript base pack + Rosetta',
        description:
          'gdscript.base.json with Godot idioms (class_name, func, preload, OS.delay_msec); 14 fixtures × gdscript goldens green in rosetta.test.ts.',
        status: 'done',
      },
      {
        id: 'gdscript-ui-codegen',
        title: 'GDScript UI codegen target',
        description:
          'Selectable in code preview, codegen target panel, syntax pack lock; CodeMirror python-like highlight; .gd generated filenames.',
        status: 'done',
      },
      {
        id: 'gdscript-godot-env-shipped',
        title: 'Godot environment pack + portability',
        description:
          'env.gdscript.godot-game manifest (Node, _ready, _process); GDScript language profile in @vvs/language-profiles.',
        status: 'done',
      },
    ],
  },
  {
    id: 'multi-class-future',
    title: 'Multi-class — next',
    items: [
      {
        id: 'cross-class-refs',
        title: 'Cross-class references',
        description:
          'import_class node + cross-class CallFunction lowering with CROSS_CLASS_CALL_WITHOUT_IMPORT analyzer warning; cross-class event dispatch still planned.',
        status: 'partial',
      },
    ],
  },
  {
    id: 'unified-symbols',
    title: 'Unified symbol model & portability UX',
    phase: 3,
    emphasis: 'active',
    items: [
      {
        id: 'node-effectiveness',
        title: 'Node effectiveness indicators',
        description:
          'Show all catalog nodes; dim + badge when ineffective for codegen target (or future COA set). Resolver driven by language profiles + registry portabilityFeatures.',
        status: 'planned',
      },
      {
        id: 'coa-deferred',
        title: 'Cross Over Architecture (COA)',
        description:
          'Deferred — COA_SHIPPED false. Prerequisites: node effectiveness UI, multi-target export, documented compile policy. Single-target portability warnings available today.',
        status: 'planned',
      },
      {
        id: 'symbol-spawn-ux',
        title: 'Declare / implement / invoke spawn UX',
        description:
          'Role chips in spawn catalog. Done: Project tree Declare/Handler badges, Event panel Declare · handler · Dispatch, canvas drop menus (Call/Declare/Define, Dispatch/Declare/handler). Spec: docs/design/unified_symbol_model.md Phase D.',
        status: 'partial',
      },
    ],
  },
  {
    id: 'transpiler',
    title: 'Transpiler & languages',
    items: [
      {
        id: 'overload-codegen',
        title: 'Multi-overload codegen',
        description: 'Emit every overload signature, per-overload graph bodies, and call-site arguments.',
        status: 'planned',
      },
      {
        id: 'overrides',
        title: 'Function overrides (OOP)',
        description: 'Subclass methods overriding a parent symbol — distinct from overloads; parent link + validation.',
        status: 'planned',
      },
      {
        id: 'profiles-json',
        title: 'Language profiles as JSON packs',
        description: 'Move portability matrices from TypeScript to data-driven profile files.',
        status: 'planned',
      },
      {
        id: 'transpile-worker',
        title: 'Worker-based transpile',
        description: 'Off-main-thread codegen for large projects and graphs.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'environment-standards',
    title: 'Environment templates & standards',
    items: [
      {
        id: 'env-typespec-emitter',
        title: 'TypeSpec → manifest emitter',
        description:
          'Custom TypeSpec emitter producing ProjectEnvironmentManifest JSON as a single API authoring source.',
        status: 'planned',
      },
      {
        id: 'env-backstage-compat',
        title: 'Backstage template compatibility',
        description:
          'Import template.yaml + skeleton/ as hostFiles; Nunjucks → {moduleName}; env-import CLI.',
        status: 'partial',
      },
      {
        id: 'env-devcontainer',
        title: 'Dev Container linkage',
        description:
          'Optional devcontainer.json reference in manifests for tooling/runtime (containers.dev) alongside VVS host files.',
        status: 'planned',
      },
      {
        id: 'env-template-upgrade',
        title: 'Non-destructive template upgrade',
        description:
          'One-click refresh from linked environment version; preserve user graph divergence with drift indicators (version drift UI done; full merge TBD).',
        status: 'partial',
      },
      {
        id: 'env-engine-packs',
        title: 'Engine environment packs',
        description:
          'UE/Verse and other engine API manifests as installable Library environments — portability-gated natives.',
        status: 'planned',
      },
      {
        id: 'env-host-editable',
        title: 'Host file integration policies',
        description:
          'Skip vs emit host entry files when adopting existing repos (integration.json); custom emit paths per target. Full in-editor host editing/merge still planned.',
        status: 'partial',
      },
    ],
  },
  {
    id: 'runtime',
    title: 'Simulation & execution',
    items: [
      {
        id: 'real-runtime',
        title: 'Real graph execution',
        description: 'Replace mock simulation with an actual interpreter or target-language runner.',
        status: 'planned',
      },
      {
        id: 'canvas-virtualization',
        title: 'Canvas virtualization',
        description: '60fps editing with 500+ nodes via viewport culling / virtualized rendering.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'collaboration',
    phase: 4,
    title: 'Phase 4 — Real-time collaboration',
    items: [
      {
        id: 'collab',
        title: 'Go WebSocket sync',
        description:
          'Custom Go WS server (not Supabase Realtime); presence, cursors; op log on Postgres documents; CRDT/OT TBD.',
        status: 'planned',
      },
      {
        id: 'graph-doc-split',
        title: 'Per-tab document rows',
        description:
          'Split large projects into graph_documents rows when JSONB snapshots grow or collab needs partial updates.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'community',
    phase: 3,
    emphasis: 'active',
    title: 'Phase 3 — Community library',
    items: [
      {
        id: 'library-backend',
        title: 'Library backend',
        description:
          'Upload, browse, version, and rate community graphs, node packs, templates, and environment manifests.',
        status: 'partial',
      },
      {
        id: 'search',
        title: 'Semantic library search',
        description: 'pgvector on self-hosted Postgres — intent search across shared scripts and templates.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'ue6',
    phase: 5,
    title: 'Phase 5 — Unreal Engine 6 plugin',
    items: [
      {
        id: 'ue-plugin',
        title: 'In-engine graph editor',
        description: 'UE6-embedded canvas on the same graph schema with Verse emitter integration.',
        status: 'planned',
      },
      {
        id: 'verse-parity',
        title: 'Web ↔ engine round-trip',
        description: 'Import/export graphs between browser editor and in-engine sessions.',
        status: 'planned',
      },
      {
        id: 'ue-nodes',
        title: 'UE API environment packs',
        description:
          'Engine environment manifests and data-driven nodes atop @vvs/environment-templates (not Blueprint VM).',
        status: 'planned',
      },
      {
        id: 'blueprint-bridge',
        title: 'Blueprint transition tooling',
        description: 'Workflows helping teams migrate Blueprint habits to Verse-first authoring.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'polish',
    phase: 6,
    title: 'Phase 6 — Scale, platforms & enterprise',
    items: [
      {
        id: 'languages-more',
        title: 'Phase 6 v2 language platform',
        description:
          'GDScript, Rust, C# — pack-first families + Rosetta + UI. Milestone 3 closed July 2026.',
        status: 'done',
      },
      {
        id: 'rust-console-env',
        title: 'Rust console environment pack',
        description:
          'env.rust.console-app manifest (main.rs stub, std I/O natives); optional Tree-sitter validation when grammar available.',
        status: 'planned',
      },
      {
        id: 'mobile',
        title: 'Touch & mobile UX',
        description: 'Gestures, radial menus, magnetic pin snap for tablet workflows.',
        status: 'planned',
      },
      {
        id: 'enterprise',
        title: 'Enterprise deploy',
        description: 'Self-hosted Supabase + Go on VPS (docs/deployment.md), moderation, audit logs for studio teams.',
        status: 'planned',
      },
      {
        id: 'templates',
        title: 'Richer project templates',
        description:
          'Curated environment packs with categories (console, web, data, api, game); community catalog and Backstage-style scaffolds still expanding.',
        status: 'partial',
      },
      {
        id: 'folder-os-path',
        title: 'Reveal in Explorer / Finder',
        description:
          'Native “open containing folder” from the editor — blocked today by browser File System Access API (no absolute path exposure).',
        status: 'planned',
      },
    ],
  },
];

export interface PhaseItemCounts {
  done: number;
  partial: number;
  planned: number;
  total: number;
}

export interface PhaseProgress {
  phase: RoadmapPhase;
  counts: PhaseItemCounts;
  /** Weighted completion 0–100 (partial = 50%). */
  percent: number;
}

export interface RoadmapProgressSummary {
  phases: PhaseProgress[];
  crossCutting: PhaseItemCounts;
  /** Mean of phase percents (each phase weighted equally). */
  overallPercent: number;
}

function countItemsByStatus(
  items: RoadmapItem[],
  defaultStatus: RoadmapItemStatus
): PhaseItemCounts {
  let done = 0;
  let partial = 0;
  let planned = 0;
  for (const item of items) {
    const status = item.status ?? defaultStatus;
    if (status === 'done') done += 1;
    else if (status === 'partial') partial += 1;
    else planned += 1;
  }
  return { done, partial, planned, total: done + partial + planned };
}

function weightedPercent(counts: PhaseItemCounts): number {
  if (counts.total === 0) return 0;
  const weighted = counts.done + counts.partial * 0.5;
  return Math.round((weighted / counts.total) * 100);
}

/** Item-level progress per public roadmap phase (aligned with Roadmap view tabs). */
export function computeRoadmapProgress(): RoadmapProgressSummary {
  const phase1Shipped = SHIPPED_FEATURE_SECTIONS.filter((section) => section.phase == null).flatMap(
    (section) => section.items
  );
  const phase1Counts = countItemsByStatus(phase1Shipped, 'done');

  const phases: PhaseProgress[] = ROADMAP_PHASES.map((phase) => {
    if (phase.number === 1) {
      return {
        phase,
        counts: phase1Counts,
        percent: phase.status === 'shipped' ? 100 : weightedPercent(phase1Counts),
      };
    }

    const shippedItems = SHIPPED_FEATURE_SECTIONS.filter((section) => section.phase === phase.number).flatMap(
      (section) => section.items
    );
    const futureItems = FUTURE_FEATURE_SECTIONS.filter((section) => section.phase === phase.number).flatMap(
      (section) => section.items
    );
    const shippedCounts = countItemsByStatus(shippedItems, 'done');
    const futureCounts = countItemsByStatus(futureItems, 'planned');
    const counts = {
      done: shippedCounts.done + futureCounts.done,
      partial: shippedCounts.partial + futureCounts.partial,
      planned: shippedCounts.planned + futureCounts.planned,
      total: shippedCounts.total + futureCounts.total,
    };
    return {
      phase,
      counts,
      percent: weightedPercent(counts),
    };
  });

  const crossCuttingItems = FUTURE_FEATURE_SECTIONS.filter((section) => section.phase == null).flatMap(
    (section) => section.items
  );
  const crossCutting = countItemsByStatus(crossCuttingItems, 'planned');

  const overallPercent = Math.round(
    phases.reduce((sum, entry) => sum + entry.percent, 0) / phases.length
  );

  return { phases, crossCutting, overallPercent };
}
