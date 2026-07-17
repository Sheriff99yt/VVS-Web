export type RoadmapItemStatus = 'done' | 'partial' | 'planned' | 'cut';

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
    title: 'Legacy server experiments (in repo)',
    phase: 2,
    emphasis: 'shipped',
    items: [
      {
        id: 'phase2-arch-locked',
        title: 'Self-host stack documented (legacy)',
        description:
          'Postgres + GoTrue + Go pgx notes remain in docs/deployment.md for reference. Product direction is client-first — no dedicated server hosting.',
        status: 'done',
      },
      {
        id: 'phase2-postgres-store',
        title: 'ProjectStore + PostgresStore (pgx)',
        description:
          'In-repo experiment: MemoryStore (default) + PostgresStore. Not a product hosting track.',
        status: 'done',
      },
      {
        id: 'phase2-auth-middleware',
        title: 'JWT auth middleware & dev user',
        description:
          'In-repo experiment. Default editor needs no accounts.',
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
        title: 'Editor cloud source of truth (legacy path)',
        description:
          'HTTP/cloud save path exists when hosted features are enabled. Product default is local/folder/.vvs/.',
        status: 'done',
      },
      {
        id: 'phase2-mcp-prod',
        title: 'MCP auth path (local / legacy)',
        description:
          'Desktop local MCP paste config is the product path. Hosted MCP probe stays inactive by default.',
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
          'Module â€º graph path above tabs; settings modal for module name, **per-graph** codegen language/extension, **project defaults** for new graphs, and linked project environment.',
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
          'U83 companion: pin wired-boolean store selectors; node search gated subscribe; onlyRenderVisibleElements shared constant.',
        status: 'done',
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
          'Structure | Symbols | API → compact Symbols/Output cycle toggle + always-on filter; Ctrl+Space focuses filter; class scope in status bar / class list; folders → classes; class-scoped Functions → Events → Variables.',
        status: 'done',
      },
      {
        id: 'search',
        title: 'Node search',
        description: 'Space / Ctrl+K focuses canvas node search (hover-expand).',
        status: 'done',
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
          'Context inspector for nodes, variables, events, functions, and code preview (selection type code); vertical resize; state persists.',
        status: 'done',
      },
      {
        id: 'code-panel-chrome',
        title: 'Code panel chrome',
        description:
          'h-9 bar aligned with graph tabs; LanguageExtensionMenu (hover → extensions; language click → first ext); error/warning highlight toggles; secondary emit options in details panel.',
        status: 'done',
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
          'Variables: Get / Set / Declare. Functions & events: Call / Declare / Define. Classes: Declare on the member chain. Declare inserts member-chain nodes; Define places body/handler; Call invokes.',
        status: 'done',
      },
      {
        id: 'pins-ui',
        title: 'Pin geometry & inline widgets',
        description:
          'Distinct shapes per pin type (incl. array); inline editors on unwired pins; scroll wheel steps number values (Â±1, Shift Â±10, Ctrl Â±0.1) without fighting canvas zoom or node drag.',
        status: 'done',
      },
      {
        id: 'sim',
        title: 'Graph Play / live execution (removed)',
        description:
          'Mock play/pause/step removed. Locked: VVS never executes code. In scope: logical checks and warnings only. Execution belongs to third-party tools after Generate.',
        status: 'done',
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
          'VS Code—style templates: live manifest catalog (9+ packs, categories), linked manifest, Environment API browse/spawn, env.call_native, module + host multi-file codegen.',
      },
      {
        id: 'symbol-declare-vocabulary',
        title: 'Declare / Handler vocabulary',
        description:
          'UI labels aligned to canvas roles: Declare member nodes on the chain, handler labels use the userâ€™s event name (no forced On prefix), Call/Dispatch at invoke sites. symbolRole on registry kinds; spawn catalog grouping by Declare / Handlers / Calls.',
        status: 'done',
      },
      {
        id: 'events',
        title: 'Custom & entry events',
        description:
          'events[] with role entry | custom; event_member_define + event_define handlers + dispatch nodes (direct call); Emit/Subscribe blocked (HIDDEN_EVENT_RUNTIME_UNSUPPORTED); tree + New event hereâ€¦; new class/project seeds program entry on canvas (createClassHomeBootstrap); legacy event_on_start removed from spawn catalog.',
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
          '@vvs/syntax-packs — base JSON (Rosetta + shell templates), capability overlays, 14 fixtures Ã— 5 families, packCoverage + fidelity linter + parse validation script.',
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
          'class_define, var_define, function_define, event_member_define on the container graph exec chain; panelâ†”canvas dual-write via defineNodeSync + useSymbolLifecycle; addClassWithDefine on class create; legacy class tabs and documents.main migrate to home graphs on load.',
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
          'Canvas member-chain order is source order (appendIrMembersInOrder). Dual-node events: event_member_define tags signature; On handler spans body. No invented stub bodies without Define.',
        status: 'done',
      },
      {
        id: 'function-declare-define-u81',
        title: 'Function Declare â‰  Define (U81)',
        description:
          'Call / Declare / Define release menu. function_define = existence; function_implement = body placement on the member chain. No stub without Define; no legacy fold.',
        status: 'done',
      },
      {
        id: 'cpp-declare-define-u82',
        title: 'C++ Declare / Define emit (U82)',
        description:
          'Non-abstract Declare → in-class prototype; Define → out-of-line Class::Method (or separate .cpp graph). No auto-split of one graph into .h+.cpp. Other langs: U66 (x) Declare + in-class Define.',
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
        title: 'Generate = Code panel emit (U56—U57)',
        description:
          'TopNav Generate / CLI / Code preview share emitProjectLikeCodePanel; folder write when on disk. Class-home tabs show the graphâ€™s module file.',
        status: 'done',
      },
      {
        id: 'fidelity-streamline-0-4',
        title: 'Fidelity streamline Phases 0—4',
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
      {
        id: 'fidelity-u64',
        title: 'Deeper fidelity temps (U64)',
        description:
          'SwitchSelectBind + GetInputLine* pack templates; selector/prompt expressionSpans. Temp names remain TS constants.',
        status: 'done',
      },
      {
        id: 'test-project-rethink-u65',
        title: 'Test Project goldens (U65)',
        description:
          'Stable vvs-test-* seeds; First Graph + Coverage Lab; test_project_goldens/ + usabilityExampleGoldens.test.ts; extract --update-goldens.',
        status: 'done',
      },
      {
        id: 'cross-class-refs',
        title: 'Cross-class event dispatch',
        description:
          'DispatchEventCrossClass pack + lower; CROSS_CLASS_DISPATCH_WITHOUT_IMPORT; Coverage Lab Boot→Sensor.on_tick.',
        status: 'done',
      },
      {
        id: 'same-file-function-u80',
        title: 'Same-file function emit (U80)',
        description:
          'Function tabs = Edit function body only; no per-function output files. Define places the body in the host graph file.',
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
          'Browse on-disk tree from recents; copy repo-relative paths (.vvs/â€¦, src/â€¦). Browser security prevents full OS paths (e.g. C:\\â€¦).',
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
        id: 'mcp-paste-u70',
        title: 'Local MCP paste config (U70)',
        description:
          'AI panel paste Cursor/Claude + CLI config; dangerous-tools consent; hosted probe gated. No VVS account required.',
        status: 'done',
      },
      {
        id: 'topnav-right-unify-u72',
        title: 'TopNav right button styles (U72)',
        description: 'Unified zinc icon buttons for the top bar right cluster (Bot / Settings).',
        status: 'done',
      },
      {
        id: 'code-panel-topbar-u73',
        title: 'Code panel top bar (U73)',
        description: 'Denser Code | Files action cluster; Format JSON + Copy grouped.',
        status: 'done',
      },
      {
        id: 'output-view-u74',
        title: 'Left panel Output view (U74)',
        description: 'Empty hint + Generated files label; clearer empty log copy.',
        status: 'done',
      },
      {
        id: 'format-json-u76',
        title: 'Format JSON in Code panel (U76)',
        description: 'Pretty-format when JSON language or .json file is active.',
        status: 'done',
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
          'Generate persists snapshot to Go API before POST â€¦/compile so server-side compile always sees the latest graph.',
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
          'ProjectStore port — MemoryStore (default) or PostgresStore (DATABASE_URL); GET/PUT /api/projects, list, POST â€¦/compile; CORS + Authorization header.',
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
      {
        id: 'node-effectiveness-u66-u67',
        title: 'Unsupported nodes (U66 / U67)',
        description:
          '(x) comment lines for ineffective nodes (gated imports + non-C++ Function Declare); canvas dim. Toggles: Code panel comments + TopNav Dim. Shared nodeEffectiveness resolver.',
        status: 'done',
      },
      {
        id: 'comment-c-u68',
        title: 'Comment [C] on selection (U68)',
        description:
          'Comment selected nodes; soft memberIds; lock = adopt body contents; unlock = free peers + position follow; resize-to-fit on demand; dashed vs solid. Pack prefix — never (x).',
        status: 'done',
      },
      {
        id: 'user-comments-toggle-u69',
        title: 'Code panel user-comments toggle (U69)',
        description:
          'showUserComments / emitUserComments — independent of (x) unsupported comments.',
        status: 'done',
      },
      {
        id: 'highlight-reverse-u71',
        title: 'Code↔graph highlight rethink (U71)',
        description:
          'Reverse select (dblclick Code → node); generic sourceMap UI; Switch structured sink; smooth auto-scroll; Coverage Lab completeness + sink nest-as-text CI gate.',
        status: 'done',
      },
      {
        id: 'chain-auto-layout-u75',
        title: 'Node chain auto-layout (U75)',
        description:
          'S = forward exec + data attrs/children; A = full undirected chain + attrs; S S = lane-topo layout (above / below / below-extended stair with spine buffer). Head-anchored; multi-chain vertical separation; absolute layout through locked comments. Settings: chainAttributeDirection. Comments create locked by default (U68).',
        status: 'done',
      },
      {
        id: 'y-order-rethink-u79',
        title: 'Canvas Y → code order (U79)',
        description:
          'Connected exec chain = primary nest/emit order; vertical Y = secondary for unconnected heads (+ event peers). Teaching warnings CHAIN_ORDER_Y_MISMATCH / EVENT_PEER_Y_ORDER — no auto-reorder. Comment attach topmost Y.',
        status: 'done',
      },
      {
        id: 'canvas-virtualization-u83',
        title: 'Canvas virtualization (U83)',
        description:
          'onlyRenderVisibleElements on edit + reference canvases; pure isPinWired + nodesForSearchSubscription helpers with unit tests (lib/graphVirtualization.ts).',
        status: 'done',
      },
      {
        id: 'node-search-all-graphs-u84',
        title: 'Node search — all graphs toggle (U84)',
        description:
          'Layers toggle on node search (default on). Searches every graph; jumps tab + focuses node. Single clear X (type=text, no native clear).',
        status: 'done',
      },
      {
        id: 'f-fills-node-search-u85',
        title: 'Ctrl+F / F find + symbol menu (U85)',
        description:
          'Ctrl+F finds in this graph (prefill from selected canvas nodes or tree symbol; multi results). Ctrl+Shift+F finds in all graphs. F with a tree symbol = find in this graph; else frame. Symbol context menu both. Pane click + canvas drag clear tree-symbol focus.',
        status: 'done',
      },
      {
        id: 'custom-tooltip-u94',
        title: 'Custom tooltip widget (U94)',
        description:
          'App-default Tooltip (`components/ui/Tooltip.tsx`) — Esc dismiss, viewport clamp; migrated across left panel + editor chrome (native title= tips removed from interactive controls).',
        status: 'done',
      },
      {
        id: 'first-open-help-u95',
        title: 'First graph open opens help (U95)',
        description:
          'Canvas welcome/help auto-opens until dismissed (`canvasWelcomeDismissed`).',
        status: 'done',
      },
      {
        id: 'selected-node-chrome-overlay',
        title: 'Hover node chrome overlay',
        description:
          'Modifier chips + import target-language sit in an absolute strip above the card on hover (pinned while a chip menu is open). Selection actions toolbar stacks above that strip when selected.',
        status: 'done',
      },
      {
        id: 'action-history-u108',
        title: 'Action history window (U108)',
        description:
          'Floating panel — graph undo stack with restore + project activity log (save, generate, import/export, delete, wire).',
        status: 'done',
      },
      {
        id: 'topnav-menus-u109',
        title: 'Top bar menus (U109)',
        description: 'File · Edit · View · Help — complete items, shortcuts, action history entry.',
        status: 'done',
      },
      {
        id: 'settings-redesign-u110',
        title: 'Settings redesign (U110)',
        description: 'Sidebar shell — Project · Editor · Shortcuts · Audio · About.',
        status: 'done',
      },
      {
        id: 'shortcut-rebind-u111',
        title: 'Shortcut reassignment (U111)',
        description:
          'Settings → Shortcuts — record key chords with conflict blocking; stored in browser prefs.',
        status: 'done',
      },
      {
        id: 'audio-feedback-u112',
        title: 'Audio feedback (U112)',
        description:
          'Optional subtle Web Audio cues for save, generate, undo, delete, wire, and errors.',
        status: 'done',
      },
      {
        id: 'product-name-u113',
        title: 'VVS Web naming (U113)',
        description: 'User-facing product name VVS Web (UI + primary docs).',
        status: 'done',
      },
      {
        id: 'symbol-undo-u114',
        title: 'Symbol undo/redo (U114)',
        description:
          'Create / delete / duplicate for variables, functions, and events join the shared Ctrl+Z stack (project slice restores symbols + documents + tabs).',
        status: 'done',
      },
      {
        id: 'symbol-undo-rename-class-u115',
        title: 'Undo: rename + class CRUD (U115)',
        description:
          'Symbol rename and class create/rename/delete/move on the shared stack; slice includes classes, activeClassId, projectDetails.',
        status: 'done',
      },
      {
        id: 'undo-across-tabs-u116',
        title: 'Undo: preserve across tab switch (U116)',
        description:
          'Graph tab switch no longer clears the undo stack; snapshots carry activeGraphTab for cross-tab restore.',
        status: 'done',
      },
      {
        id: 'undo-lean-snapshots-u117',
        title: 'Undo: lean canvas snapshots (U117)',
        description:
          'Canvas edits store nodes+edges+tab only; pushHistory stores the full project slice. True op-deltas remain deferred.',
        status: 'done',
      },
      {
        id: 'details-compact-rethink-u86',
        title: 'Details panel compact rethink (U86)',
        description:
          'Compact Details shows kind/category, pin counts, and bound symbol hints — no generic “hover for details”.',
        status: 'done',
      },
      {
        id: 'compiler-log-language-scope-u87',
        title: 'Compiler Log language-scoped mode (U87)',
        description:
          'Log Languages toggle scopes Validator lines to the active graph/project target language (default on).',
        status: 'done',
      },
      {
        id: 'graph-tabs-ux-u88',
        title: 'Graph tabs UI/UX rethink (U88)',
        description:
          'Active underline, stronger dirty dots, scroll-into-view, open-graphs overflow list, middle-click / Ctrl+W close.',
        status: 'done',
      },
      {
        id: 'wire-connection-ux-u96',
        title: 'Wire / connection UX (U96)',
        description:
          'Larger pin hit targets; edge Insert reroute + Disconnect; selection toolbar Auto-connect when exactly two compatible nodes are selected.',
        status: 'done',
      },
      {
        id: 'symbols-overlay-rethink-u102',
        title: 'Symbols overlay rethink (U102)',
        description:
          'Open Graph removed from symbol tree/Details. Hover modifier strip (NodeHoverChrome); selection toolbar + right-click menus remain.',
        status: 'done',
      },
      {
        id: 'canvas-gestures-u107',
        title: 'Canvas pan / select gestures (U107)',
        description:
          'Right-drag pans; left-click selects one node; Ctrl/Cmd+click multi-selects; left-drag box-selects; middle-drag pans; right-click without drag still opens spawn menu.',
        status: 'done',
      },
      {
        id: 'code-panel-hover-nav',
        title: 'Code panel hover → graph (U71 follow-on)',
        description:
          'Hover generated code: yellow outline on the matching node (current tab) and owning graph tab (current or other open). Double-click still selects/navigates. Docs: docs/code_panel.md.',
        status: 'done',
      },
    ],
  },
];

/** Open / partial only — shipped work lives under SHIPPED_FEATURE_SECTIONS (Done tab). */
export const FUTURE_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'phase-6-priority',
    title: 'Priority — Go, packs & emit plans',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'go-language-u77',
        title: 'Go language pack (U77)',
        description: 'Eighth target language — syntax pack, emit, and Test Project / Rosetta coverage.',
        status: 'planned',
      },
      {
        id: 'pack-versions-u78',
        title: 'Pack versions manager view (U78)',
        description:
          'Downloaded pack releases accumulate (never overwrite). List versions, set active. GitHub update adds a version. First of multiple new top-level views.',
        status: 'planned',
      },
      {
        id: 'emit-fidelity-cl-backlog',
        title: 'Target-language emit fidelity (CL backlog)',
        description:
          'Plans first — then code. Open clusters: Rust inheritance (CL-010); Verse GetInput/for-loop (CL-014/015); C# async Task (CL-006); Rust static/imports (CL-008/009); GDScript temps/GetInput (CL-012/013); Verse defaults (CL-016). Canonical log: .agents/skills/vvs_cross_language_mapping/SKILL.md.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'editor-chrome-open',
    title: 'Editor chrome — References & Library',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'references-viewer-redesign-u89',
        title: 'References viewer redesign (U89)',
        description:
          'Partial: Reference tree name filter shipped. Full huge-project redesign (navigation + scale) still open.',
        status: 'partial',
      },
      {
        id: 'library-page-redesign-u90',
        title: 'Library page redesign (U90)',
        description:
          'Redesign the Library page after the client-first / git-catalog directional change (no hosted blob library).',
        status: 'planned',
      },
    ],
  },
  {
    id: 'ai-examples-help-u91',
    title: 'AI, examples & reverse import',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'mcp-agent-autonomy-u91',
        title: 'AI / MCP audit & agent autonomy (U91)',
        description:
          'Partial: Windsurf paste, tool list, clearer dangerous-tools consent. Full MCP autonomy audit (safe write paths) still open.',
        status: 'partial',
      },
      {
        id: 'cross-and-lang-examples-u92',
        title: 'New cross-language & language-specific examples (U92)',
        description:
          'Partial: Branch Lab (Entry→Branch→True/False Print) + goldens. More cross-lang / language-specific examples still open.',
        status: 'partial',
      },
      {
        id: 'code-to-visual-u93',
        title: 'Long-term: code → visual (U93)',
        description:
          'Research track: read raw source and produce text-shaped graphs (reverse of Generate). Must preserve canvas source of truth and fidelity — not near-term polish.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'graph-model-u97',
    title: 'Catalog, functions, async & OOP',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'add-node-menu-audit-u97',
        title: 'Add-node menu audit (U97)',
        description:
          'Partial: Import Module spawn row restored; synonym search (module, declare, …). Full catalog vs fixture audit still open.',
        status: 'partial',
      },
      {
        id: 'function-argument-pins-u98',
        title: 'Function argument pins (U98)',
        description:
          'Expose and wire function parameters as pins end-to-end (define, call, emit).',
        status: 'planned',
      },
      {
        id: 'function-return-args-u99',
        title: 'Function return with arguments (U99)',
        description:
          'Return values as pins / multi-return where languages support it — visual + emit.',
        status: 'planned',
      },
      {
        id: 'event-listeners-u100',
        title: 'Event listeners (U100)',
        description:
          'First-class listen / subscribe visuals that map to text across target languages (beyond entry/dispatch).',
        status: 'planned',
      },
      {
        id: 'cross-lang-async-u101',
        title: 'Cross-language async concept (U101)',
        description:
          'Language-neutral async model (nodes, options, or hybrid) that all packs can map — not per-language one-offs.',
        status: 'planned',
      },
      {
        id: 'components-visual-u103',
        title: 'Components visual + examples (U103)',
        description:
          'Design a component visual concept that works for all languages; add components to multi-lang Test Project examples.',
        status: 'planned',
      },
      {
        id: 'overloading-revise-u104',
        title: 'Overloading revise & stress-test (U104)',
        description:
          'Revise overload UX/emit; stress-test current behavior under real fixtures and fix or document gaps.',
        status: 'planned',
      },
      {
        id: 'overwriting-study-u105',
        title: 'Overwriting (override) study (U105)',
        description:
          'Study whether override needs custom visuals or is fully covered by the current modifier / define system.',
        status: 'planned',
      },
      {
        id: 'inheritance-design-u106',
        title: 'Inheritance design (U106)',
        description:
          'Design how inheritance is authored on the canvas and lowered per language (pairs with CL-010 Rust plan).',
        status: 'planned',
      },
    ],
  },
  {
    id: 'unified-symbols',
    title: 'Unified symbol model & portability',
    items: [
      {
        id: 'symbol-spawn-ux',
        title: 'Declare / implement / invoke spawn UX',
        description:
          'Role chips in spawn catalog. Done: Project tree badges, Event panel Declare · On · Dispatch, Call/Declare/Define menus. Remaining: catalog role chips. Spec: unified_symbol_model.md Phase D.',
        status: 'partial',
      },
      {
        id: 'coa-deferred',
        title: 'Cross Over Architecture (COA)',
        description:
          'Deferred — COA_SHIPPED false. Prerequisites: multi-target export, documented compile policy. Single-target portability warnings + U66/U67 available today.',
        status: 'planned',
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
    id: 'phase-2-deploy',
    title: 'Dedicated server hosting (out of scope)',
    items: [
      {
        id: 'self-hosted-deploy',
        title: 'Full Supabase Docker on VPS',
        description:
          'Out of scope as product. No dedicated VPS / self-hosted Supabase track. Client-first: local/.vvs/git + static Pages. Legacy notes in docs/deployment.md only.',
        status: 'cut',
      },
      {
        id: 'github-oauth',
        title: 'GitHub OAuth + email auth (hosted)',
        description:
          'Out of scope as product default. No VVS accounts required. Code may remain hidden/disabled for experiments.',
        status: 'cut',
      },
      {
        id: 'ops-backups',
        title: 'VPS ops & backups',
        description: 'Out of scope — no dedicated server product to operate.',
        status: 'cut',
      },
      {
        id: 'pwa',
        title: 'PWA offline sync to Postgres',
        description:
          'Out of scope as product. Prefer folder/.vvs + git; do not invent a VVS sync server.',
        status: 'cut',
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
          'Separate library git repo; public links only; PR/submit workflow — not hosted blob storage. UI shell exists; catalog backend TBD.',
        status: 'partial',
      },
      {
        id: 'search',
        title: 'Semantic library search',
        description:
          'Intent search across shared scripts and templates (client-first catalog; search backend TBD).',
        status: 'planned',
      },
    ],
  },
  {
    id: 'collaboration',
    phase: 4,
    title: 'Phase 4 — Session collaboration',
    items: [
      {
        id: 'collab',
        title: 'Session client / host',
        description:
          'Game-lobby style session sync — not account cloud multiplayer. Transport TBD (Go WS candidate).',
        status: 'planned',
      },
      {
        id: 'graph-doc-split',
        title: 'Per-tab document rows',
        description:
          'Split large projects into graph_documents rows when snapshots grow or collab needs partial updates.',
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
    title: 'Later — scale & platforms',
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
        description: 'Gestures, radial menus, magnetic pin snap for tablet workflows. Mobile: no AI panel for now.',
        status: 'planned',
      },
      {
        id: 'enterprise',
        title: 'Enterprise deploy',
        description:
          'Out of scope as product. No dedicated enterprise VPS. Client-first local/.vvs/git. Legacy self-host notes may remain in docs/deployment.md.',
        status: 'cut',
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
