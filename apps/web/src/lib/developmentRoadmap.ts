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
          'Start screen — new/open folder (.vvs/ overlay), recent projects, import JSON, First Graph & Coverage Lab Test Project cards, Library and Roadmap explore shortcuts. SSR hydration-safe; library browse uses session drafts (no spurious recents).',
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
          'Module › graph path above tabs; settings modal for module name, **per-graph** codegen language/extension, **project defaults** for new graphs, and linked project environment.',
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
        description: 'Collapsible graph navigator and code output panel (Code | Files tabs); persisted UI preferences including details height.',
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
          'Structure | Symbols | API tabs; scope header with breadcrumb; folders → classes; class-scoped Functions → Events → Variables; icon-expand filter; click select / double-click open; codegen suffix on class/function rows; Environment API on API tab; generated files on right panel Files tab.',
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
          'CodegenTarget (family + capabilities + optional syntaxPackLock in .vvs/project.json); per-graph metadata.targetLanguage + targetFileExtension; project defaults on snapshot for new graphs; resolveGraphCodegenSettings in @vvs/graph-types.',
        status: 'done',
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
          'analyzeProject diagnostics (DEFINE_NODE_MISSING with class-scoped rules, DECLARATION_NOT_ON_CANVAS, ORPHAN_DEFINE_NODE, PROGRAM_ENTRY_MISSING, PROGRAM_ENTRY_NOT_ON_CANVAS, LIFECYCLE_NODE_DEPRECATED, HIDDEN_EVENT_RUNTIME_UNSUPPORTED, MULTICAST_REQUIRES_SUBSCRIBE, UNRESOLVED_SYMBOL_REF); portability scan; compile gate blocks Generate on fidelity errors; useLiveProjectValidation keeps UI in sync.',
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
          'Each graphContainer is a real canvas (`documents[container.id]`). Project map (`main-graph`) is organizational — graph_ref navigation only, no codegen. Module graphs hold class_define chains plus runtime flow (Coverage Lab: Machine+Sensor on one graph). Classes are symbols nested under graphs, not separate tabs.',
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
          'class_define, var_define, function_define, event_member_define on the container graph exec chain; panel↔canvas dual-write via defineNodeSync + useSymbolLifecycle; addClassWithDefine on class create; legacy class tabs and documents.main migrate to home graphs on load.',
        status: 'done',
      },
      {
        id: 'class-define-fidelity',
        title: 'Class declare fidelity',
        description:
          'class_define required when class has symbols or member defines; ORPHAN_DEFINE_NODE for stray class_define; no phantom class shell from symbol table; deleting Declare blocks Generate (DEFINE_NODE_MISSING) but preview shows member chain without class Name: wrapper; Coverage Lab covers strict declare fidelity.',
        status: 'done',
      },
      {
        id: 'declare-implement-emit',
        title: '1:1 member-chain emit',
        description:
          'Canvas member-chain order is source order: each define node emits its full construct inline (appendIrMembersInOrder). No # Declare stubs and no deferred implementation pass. Dual-node events: event_member_define tags the signature; On handler spans the body.',
        status: 'done',
      },
      {
        id: 'ordered-emit',
        title: 'Ordered member emit',
        description:
          'Transpiler walks ir.members once in define-chain order (appendIrMembersInOrder); no sidebar preamble fallback. Coverage Lab locks Machine+Sensor on one graph.',
        status: 'done',
      },
      {
        id: 'canvas-source-of-truth',
        title: 'Canvas source of truth',
        description:
          'Strict canvas-only codegen: symbol tables index only; DEFINE_NODE_MISSING, DECLARATION_NOT_ON_CANVAS, and ORPHAN_DEFINE_NODE block Generate; panel dual-write define nodes; live analysis sync via useLiveProjectValidation.',
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
      {
        id: 'graph-equals-file',
        title: 'One graph → one file (U58)',
        description:
          'All class_define chains on a container graph emit into one module (canvas order). Want two files → two graphs. Coverage Lab → src/CoverageLab.*',
        status: 'done',
      },
      {
        id: 'generate-export-multiclass',
        title: 'Generate = Code panel emit (U56–U57)',
        description:
          'TopNav Generate / CLI / Code preview share emitProjectLikeCodePanel; folder write when on disk. Class-home tabs show the graph’s module file.',
        status: 'done',
      },
      {
        id: 'fidelity-streamline-0-4',
        title: 'Fidelity streamline Phases 0–4',
        description:
          'Single member emit path, property→pack only, ClassDecl-only shell, Coverage Lab golden. docs/design/fidelity_streamline.md.',
        status: 'done',
      },
      {
        id: 'fidelity-canvas-surface',
        title: 'Import Module + enum canvas surface',
        description:
          'import_module props; enumType + EnumMemberAccess; expr_enum_member. Verify via extract_test_project_outputs.ts.',
        status: 'done',
      },
      {
        id: 'user-types-typeref',
        title: 'User types (TypeRef)',
        description:
          'TypeRef for builtin / enum / class / Array / Map; pickers from canvas declares; Coverage Lab Status/Host/Readings. docs/design/user_types.md.',
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
        title: 'Code output panel',
        description:
          'CodeMirror 6 — **Code** tab (per-graph transpile + sourceMap highlights aligned with displayed files; language and .{ext} in header); **Files** tab (project-wide folder tree from useProjectTranspileResult). Live validation badge + preview-only banner when class Declare missing; sync indicator reflects analysis errors. Project map tab skips codegen.',
        status: 'done',
      },
      {
        id: 'searchable-selects',
        title: 'Searchable dropdowns',
        description:
          'SearchableSelect component — codegen language/extension, property enums, import graph/class/module pickers, environment import defaults.',
        status: 'done',
      },
      {
        id: 'import-graph-picker',
        title: 'Import graph pickers',
        description:
          'ImportGraphTargetPanel + projectGraphCatalog — searchable picker for graph_ref, import_class, and import_module targets across all project graphs.',
        status: 'done',
      },
      {
        id: 'per-graph-codegen',
        title: 'Per-graph language & extension',
        description:
          'GraphTabMetadata stores targetLanguage and targetFileExtension per graph; project targetLanguage/targetFileExtensions seed new graphs only; Files tab emits each graph with its own settings.',
        status: 'done',
      },
      {
        id: 'explorer-ux',
        title: 'Project explorer tabs & scope',
        description:
          'Structure | Symbols | API tabs; Output toggle shows emit files under folders; drag class to folder for emit path; function base + override rows; Event dispatchers with drag-to-canvas.',
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
  {
    id: 'language-platform',
    title: 'Language platform (seven families)',
    phase: 6,
    emphasis: 'shipped',
    items: [
      {
        id: 'languages-more',
        title: 'Pack-driven language families',
        description:
          'Python, JS, C++, Verse, GDScript, Rust, C# — pack-first print + 14×7 Rosetta goldens. Milestone 3 closed July 2026.',
        status: 'done',
      },
      {
        id: 'syntax-pack-shell-templates',
        title: 'Pack-driven module shells',
        description:
          'ClassModuleOpen/Close, EventHandlerOpen, FunctionDefOpen templates; pack emptyHandlerBody/emptyFunctionBody layout keys.',
        status: 'done',
      },
      {
        id: 'tree-sitter-ci',
        title: 'Tree-sitter parse validation',
        description:
          'Python/JS Rosetta outputs validated via Tree-sitter on Linux CI; local dev skips when native prebuild unavailable.',
        status: 'done',
      },
      {
        id: 'gdscript-godot-env-shipped',
        title: 'Godot environment pack',
        description:
          'env.gdscript.godot-game manifest (Node, _ready, _process); GDScript language profile in @vvs/language-profiles.',
        status: 'done',
      },
      {
        id: 'usability-example-tests',
        title: 'Usability Test Projects',
        description:
          'First Graph + Coverage Lab on StartScreen; verify codegen via Code panel extract (extract_test_project_outputs.ts). Calculator/Async Fetcher/Dual Class Lab retired as StartScreen fixtures.',
        status: 'done',
      },
    ],
  },
];

/** Open / planned only — shipped work lives under SHIPPED_FEATURE_SECTIONS (Done tab). */
export const FUTURE_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'editor-ux-next',
    title: 'Editor UX & fidelity next (U68–U77)',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'comment-c-u68',
        title: 'Comment [C] on selection (U68)',
        description:
          'Comment selected nodes; generated comment lines ordered by canvas Y. Lock toggle default off (free move/resize); on locks group as today.',
        status: 'planned',
      },
      {
        id: 'user-comments-toggle-u69',
        title: 'Code panel user-comments toggle (U69)',
        description:
          'Separate from (x) unsupported comments — show/hide author comment lines in the Code preview.',
        status: 'planned',
      },
      {
        id: 'mcp-capabilities-u70',
        title: 'AI / MCP capabilities revision (U70)',
        description:
          'Revise MCP tool surface; consent toggle to enable more dangerous capabilities under user opt-in.',
        status: 'planned',
      },
      {
        id: 'highlight-reverse-u71',
        title: 'Code↔graph highlight rethink + reverse select (U71)',
        description:
          'Maintainable sourceMap that does not need hand updates per new node kind; double-click Code panel text to select the representing canvas node.',
        status: 'planned',
      },
      {
        id: 'topnav-right-unify-u72',
        title: 'Unify TopNav right button styles (U72)',
        description: 'Consistent look for the top bar right control cluster.',
        status: 'planned',
      },
      {
        id: 'code-panel-topbar-u73',
        title: 'Code panel top bar UX (U73)',
        description: 'Revise usage, layout, and controls of the Code | Files header.',
        status: 'planned',
      },
      {
        id: 'output-view-u74',
        title: 'Left panel Output view rethink (U74)',
        description: 'Make Output more useful — logs, jump-to-node, density / progressive disclosure.',
        status: 'planned',
      },
      {
        id: 'chain-auto-layout-u75',
        title: 'Node chain auto-layout (U75)',
        description:
          'Select first node + button: organize the connected exec chain and keep it selected so the user can move the group.',
        status: 'planned',
      },
      {
        id: 'format-json-u76',
        title: 'Format JSON in Code panel (U76)',
        description: 'Pretty-format JSON when a JSON file or selection is active in the Code panel.',
        status: 'planned',
      },
      {
        id: 'go-language-u77',
        title: 'Go language pack (U77)',
        description: 'Eighth target language — syntax pack, emit, and Test Project / Rosetta coverage.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'fidelity-streamline',
    title: 'Fidelity deepen',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'fidelity-u64',
        title: 'Deeper fidelity (U64)',
        description:
          'Temps → pack + expressionSpans. SwitchSelectBind + GetInputLine* (rust/csharp number); selector/prompt spans. Temp names remain TS constants.',
        status: 'done',
      },
      {
        id: 'test-project-rethink-u65',
        title: 'Test Project rethink + expected compare (U65)',
        description:
          'Stable vvs-test-* localStorage seeds; First Graph+GetInput; Coverage Lab TypeRef map; test_project_goldens + usabilityExampleGoldens.test.ts.',
        status: 'done',
      },
      {
        id: 'cross-class-refs',
        title: 'Cross-class event dispatch',
        description:
          'DispatchEventCrossClass pack + lower (mirrors CallFunction); CROSS_CLASS_DISPATCH_WITHOUT_IMPORT; Dual Class Boot→Sensor.tick.',
        status: 'done',
      },
    ],
  },
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
    id: 'unified-symbols',
    title: 'Unified symbol model & portability UX',
    items: [
      {
        id: 'node-effectiveness',
        title: 'Node effectiveness indicators',
        description:
          'U66/U67 shipped: (x) unsupported comments (toggle left of Code language); canvas dim (toggle left of Autosave). Shared nodeEffectiveness resolver; Import targetLanguages v1.',
        status: 'done',
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
          'Role chips in spawn catalog. Done: Project tree Declare/Handler badges, Event panel Declare · handler · Dispatch, canvas drop menus. Spec: docs/design/unified_symbol_model.md Phase D.',
        status: 'partial',
      },
    ],
  },
  {
    id: 'transpiler',
    title: 'Transpiler & languages',
    items: [
      {
        id: 'go-language',
        title: 'Go language pack (see U77)',
        description:
          'Tracked as U77 in editor-ux-next — syntax pack, emit, Test Project / Rosetta coverage for Go as an eighth target.',
        status: 'planned',
      },
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
    id: 'community',
    phase: 3,
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