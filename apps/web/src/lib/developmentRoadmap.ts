export type RoadmapItemStatus = 'done' | 'partial' | 'planned' | 'cut';

export type RoadmapLayer = 'frontend' | 'backend';

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status?: RoadmapItemStatus;
  layer?: RoadmapLayer;
}

export interface RoadmapSection {
  id: string;
  title: string;
  items: RoadmapItem[];
  /** Public roadmap phase number (1–6), when applicable */
  phase?: number;
  /** Visual emphasis in the Roadmap view */
  emphasis?: 'active' | 'shipped';
  layer?: RoadmapLayer;
}

/** item.layer ?? section.layer ?? 'frontend' */
export function resolveRoadmapLayer(item: RoadmapItem, section?: RoadmapSection): RoadmapLayer {
  return item.layer ?? section?.layer ?? 'frontend';
}

/** Shipped editor and platform capabilities (aligned with docs/current_state.md). */
export const SHIPPED_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'phase-2-foundation',
    layer: 'backend',
    title: 'Legacy server experiments (in repo)',
    phase: 2,
    emphasis: 'shipped',
    items: [
      {
        id: 'phase2-arch-locked',
        title: 'Self-host stack documented (legacy)',
        description:
          'Postgres + GoTrue + Go pgx notes remain in docs/deployment.md for reference. Product direction is client-first -- no dedicated server hosting.',
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
          'AuthButton in TopNav -- email/password sign-in via Supabase client when NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set.',
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
        title: 'Go MCP sidecar (local / legacy)',
        description:
          'Optional localhost Go SSE /mcp. Not the hosted product path. Hosted app uses the in-page TS agent. No remote hosted MCP URL.',
        status: 'done',
      },
    ],
  },
  {
    id: 'shell',
    layer: 'frontend',
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
          'Start screen -- new/open folder (.vvs/ overlay), recent projects, import JSON, five usability test cards (First Graph featured, plus Branch / Coverage / New Features / Inheritance Lab), Library and Roadmap explore shortcuts. SSR hydration-safe; Library and Roadmap browse via /library and /roadmap without creating a stored project.',
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
          'Local/offline indicator; **Agent ready** / **Agent error** / **Agent…** from agentStatusStore (not fake MCP Ready); saved time, graph nav & minimap toggles, code & log toggles, error jump.',
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
        layer: 'backend',
        title: 'Sign in (Supabase GoTrue)',
        description:
          'AuthButton in TopNav -- email/password when NEXT_PUBLIC_SUPABASE_URL is set; GitHub OAuth optional via env flag.',
      },
      {
        id: 'auto-workflow',
        title: 'Auto save & auto generate',
        description:
          'TopNav split toggle + action buttons -- [Auto save|Save] and [Auto generate|Generate]; debounced persist (local + cloud when signed in) and compile.',
      },
    ],
  },
  {
    id: 'editor',
    layer: 'frontend',
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
          'Canvas-level GraphSelectionToolbar -- copy, delete, comment, and ungroup actions when nodes are selected (selection-only overlay).',
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
          'useEditorFocus -- single navigation API from Project tree to canvas tab + selection; browser back/forward restores event/function/class picks; no stale navigate() wiping symbol selection.',
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
          'Container graph tabs (Project map, module graphs), function graphs, per-tab documents; drag-reorder tabs; close any tab except pinned Project map -- no per-class canvas tabs.',
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
        description: 'UE-style reference browser -- focus graph, referencers, dependencies, read-only canvas.',
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
        description: 'Dropdown on call nodes when a function has multiple overloads -- syncs pins via graphBinding.overloadId.',
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
          'EnvironmentImportModal -- paste or upload specs, validate manifest, link to project; mock localStorage + optional HTTP POST.',
      },
      {
        id: 'folder-key',
        title: 'Stable folder reopen',
        description: 'folderKeyFromHandleName() -- same on-disk folder reopens under one recent entry.',
      },
      {
        id: 'http-api-ui',
        title: 'HTTP mode wiring',
        description:
          'VvsApi listProjects, compileProject, save/load with Bearer token via authHeaders(); StatusBar polls /health when NEXT_PUBLIC_API_MODE=http.',
      },
      {
        id: 'mcp-ui',
        title: 'In-page TypeScript agent',
        description:
          'AgentHost Worker starts with the editor. TopNav Bot button (tooltip Agent) opens AgentPanel: prompt, vvs:agent-llm, /tool. Writes gated by agentAllowWrites (default false). window.vvs.agent / window.vvs.tools. Optional Go sidecar paste is collapsed -- not the hosted path.',
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
    layer: 'frontend',
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
        description: 'Deprecated -- macro tabs and use_macro migrated to Function + Call on load.',
        status: 'done',
      },
      {
        id: 'text-shaped',
        title: 'Text-shaped graphs',
        description:
          'Canvas is the codegen source of truth -- IR pipeline, ordered define-chain emit, hoisted imports, Wait (`isAsync` option), event Dispatch (direct call); every behavioral node maps to visible export text with sourceMap. Emit/Subscribe hidden-runtime nodes blocked.',
        status: 'done',
      },
      {
        id: 'environments',
        title: 'Project environments',
        description:
          'VS Code--style templates: live manifest catalog (9+ packs, categories), linked manifest, Environment API browse/spawn, env.call_native, module + host multi-file codegen.',
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
          'events[] + On-node role entry | tick | custom; event_member_define + event_define handlers + dispatch nodes (direct call); Emit/Subscribe blocked (HIDDEN_EVENT_RUNTIME_UNSUPPORTED); tree + New event hereâ€¦; new class/project seeds program entry on canvas (createClassHomeBootstrap); legacy event_on_start removed from spawn catalog.',
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
        title: 'Syntax pack migration -- Python & C++',
        description:
          'Pack-first leaf + control-flow print for python/cpp: renderTemplate engine, expanded base JSON, unified blocks.ts, VarDefine via packs, get_input/switch TS printers, packMigrationGate CI.',
        status: 'done',
      },
      {
        id: 'syntax-pack-migration-js-verse-shipped',
        title: 'Syntax pack migration -- JavaScript & Verse',
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
          'blockHelpers.ts -- condSpanOffset, blockCloseLine, ifElseLine shared by print/blocks.ts and emit/sinkStatements.ts; C++ ForLoopClose/WhileLoopClose pack keys.',
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
        id: 'transpile-worker',
        title: 'Worker-based transpile',
        description:
          'Worker + editor/agent callers off-thread (`transpileProjectOffThread` / `transpileGraphOffThread`). Sync pipeline kept for tests and Worker fallback.',
        status: 'done',
      },
      {
        id: 'profiles-json',
        title: 'Language profiles as JSON packs',
        description:
          'Portability matrices live in `packages/language-profiles/src/packs/<lang>.profile.json`. `LANGUAGE_PROFILES` API unchanged.',
        status: 'done',
      },
      {
        id: 'syntax-packs',
        title: 'Syntax packs & Rosetta suite',
        description:
          '@vvs/syntax-packs -- base JSON (Rosetta + shell templates), capability overlays, 14 fixtures Ã-- 5 families, packCoverage + fidelity linter + parse validation script.',
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
        title: 'C# syntax pack family',
        description:
          'csharp.base.json; class module shells; get_input + switch printers; 14 Rosetta goldens; UI target (.cs); scripts/update-csharp-goldens.ts.',
        status: 'done',
      },
      {
        id: 'syntax-pack-go-shipped',
        title: 'Go syntax pack family (U77)',
        description:
          'go.base.json; struct+func shells; get_input + switch printers; 14 Rosetta goldens; UI target (.go); update-go-goldens.ts. Expands target language platform to 8 languages.',
        status: 'done',
      },
      {
        id: 'pack-versions-view-u78',
        title: 'Pack versions manager view (U78)',
        description:
          'PacksView top-level view; accumulatedPacksStore, usePackRegistry & usePackReleases hooks; GitHub releases fetch & download; pinned base packs + capability overlays across 8 target languages.',
        status: 'done',
      },
      {
        id: 'emit-fidelity-cl-fixes',
        title: 'Target-language emit fidelity (CL-006, CL-008–CL-010, CL-012–CL-013, CL-015–CL-016, CL-018)',
        description:
          'C# async Task / Task<T> (CL-006). Rust self.base + fn new (CL-010), module static / associated const (CL-008), HashMap use (CL-009). Verse for (CL-015) and class field Type{} (CL-016). Async chips dim where await is a no-op (CL-018). GDScript Switch temp + GetInput prompt (CL-012/013). CL-014 stays honest (x) — Verse has no blocking string read.',
        status: 'done',
      },
      {
        id: 'references-viewer-redesign-u89',
        title: 'References viewer redesign (U89)',
        description:
          'ReferencesView huge-project redesign; metric counts (referencers, dependencies, total graphs); type filter badges; graph vs flat list view toggle; navigation path toolbar; breadth actually caps the tree; persisted view prefs; type filter on list.',
        status: 'done',
      },
      {
        id: 'library-page-redesign-u90',
        title: 'Library page redesign (U90)',
        description:
          'Client-first Library redesign; Templates tab (environments & OpenAPI/AsyncAPI spec imports); Git Imports tab (useGitCatalog hook, GitPackImportModal, GitHub repo import); Installed Extensions tab.',
        status: 'done',
      },
      {
        id: 'ai-mcp-autonomy-u91',
        title: 'In-page TypeScript agent (U91 follow-on)',
        description:
          'Shipped: AgentHost + AgentPanel; live canvas source of truth; agentAllowWrites write gate (default false); leftover-kind refuse on add_node; window.vvs.agent/tools; StatusBar from agentStatusStore. Not working dual consent: mcpAllowDangerousTools does not reach Go; mcpActivityStore / MCP Ready are not product chrome. Go MCP on :8080 is an optional local sidecar.',
        status: 'done',
      },
      {
        id: 'cross-and-lang-examples-u92',
        title: 'New cross-language & language-specific examples (U92)',
        description:
          'Five multi-language test projects (First Graph, Branch Lab, Coverage Lab, New Features Lab, Inheritance Lab) across 8 target languages (40 goldens total); validate_test_projects_folder.ts.',
        status: 'done',
      },
      {
        id: 'add-node-menu-audit-u97',
        title: 'Add-node menu catalog audit (U97)',
        description:
          'Synonym search (module, declare, call, event, var); Import Module spawn row; pin-compatibility filtering; list_available_nodes registry integration.',
        status: 'done',
      },
      {
        id: 'node-vs-option-pin',
        title: 'Node vs option vs pin (locked)',
        description:
          'If it is something you would type as its own construct, it is a node. If it only changes how that construct is written, it is an option. If it is a value that could come from another expression, it is a pin. Two canvas positions or existence-without-body stay two nodes (Declare vs Define).',
        status: 'done',
      },
      {
        id: 'node-catalog-leftovers',
        title: 'Catalog leftovers (spawn, Wait pin, On role)',
        description:
          'Spawn no longer offers Sequence, Await Wait, On Start/Update, Emit/Subscribe, or graph_ref. Wait seconds is a wired expression. On role entry/tick emits on_start/on_update. Function Declare spawns only for C++ or abstract functions.',
        status: 'done',
      },
      {
        id: 'rust-inheritance-cl010',
        title: 'Rust inheritance emit (CL-010)',
        description:
          'Composition stays base: Parent. Inherited Get/Set/Call project through self.base. Every Rust class shell gets fn new(); subclass new() sets base: Parent::new().',
        status: 'done',
      },
      {
        id: 'inheritance-canvas-u106-shipped',
        title: 'Inheritance on canvas (U106)',
        description:
          'Extends is an option on Declare Class (class picker). Inherited members show in the tree and spawn as Get / Set / Call. Missing parent is an analyzer error. One parent today (extendsType string). List-shaped multi-base is the approved visual — not started; multi-base emit not shipped.',
        status: 'done',
      },
      {
        id: 'call-super-option-shipped',
        title: 'Call Super (option on Call)',
        description:
          'isSuper on Call and Dispatch. Emits super()/base/Parent::/self.base. Chip only when the class Extends something. Not a Super node.',
        status: 'done',
      },
      {
        id: 'override-option-u105-shipped',
        title: 'Override option emit (U105)',
        description:
          'Override stays an option on Declare/Define. C++ virtual/override/=0, C# virtual/override/abstract, Verse <override>. Other languages dim the chip.',
        status: 'done',
      },
      {
        id: 'wait-async-u101-shipped',
        title: 'Wait async option (U101)',
        description:
          'One Wait node. isAsync is an option. Python asyncio.sleep, JS Promise, C# Task.Delay, GDScript await timer. C++/Rust/Go stay thread sleep and dim the chip.',
        status: 'done',
      },
      {
        id: 'flow-control-return-break-continue',
        title: 'Generic flow control (Return, Break, Continue)',
        description:
          'flow_return / flow_break / flow_continue lower across all eight syntax packs.',
        status: 'done',
      },
      {
        id: 'function-argument-pins-u98',
        title: 'Function argument pins (U98)',
        description:
          'Function parameters exposed as pins end-to-end on function_define and function_implement nodes; automatic pin synchronization across all open documents when parameters change.',
        status: 'done',
      },
      {
        id: 'function-return-args-u99',
        title: 'Function return with arguments (U99)',
        description:
          'Return statement node (flow_return) with value input pin lowering to return statements across all 8 target languages.',
        status: 'done',
      },
      {
        id: 'overloading-revise-u104',
        title: 'Overloading revise & stress-test (U104)',
        description:
          'Audit overload UX and emit; CallNodeOverloadPanel in floating details; graphBinding.overloadId overload resolution across 8 target languages.',
        status: 'done',
      },
      {
        id: 'overload-codegen',
        title: 'Multi-overload codegen',
        description:
          'C++ out-of-line loops overloads (Declare prototypes + Define bodies). Call-site emits selected overload args only. Python extra overloads stay (x) -- no invented @overload syntax.',
        status: 'done',
      },
      {
        id: 'symbol-spawn-ux',
        title: 'Declare / implement / invoke spawn UX',
        description:
          'Unified symbol role badges (Declare, On, Dispatch, Call, Get, Set) across node outliner search, drop menus, context menus, and Project Tree badges per unified_symbol_model.md Phase D.',
        status: 'done',
      },
      {
        id: 'milestone-3-language-platform',
        title: 'Milestone 3 -- language platform closed',
        description:
          'Eight pack-driven codegen families (py/js/cpp/verse/gdscript/rust/csharp/go); 112 Rosetta goldens; Godot env pack. Next: usability/workflow standards (terms_refactor_plan).',
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
    layer: 'frontend',
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
          'Each graphContainer is a real canvas (`documents[container.id]`). Project map (`main-graph`) is organizational -- graph_ref navigation only, no codegen. Module graphs hold class_define chains plus runtime flow (Coverage Lab: Machine+Sensor on one graph). Classes are symbols nested under graphs, not separate tabs.',
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
        id: 'components-visual-u103-shipped',
        title: 'Components locked as Class (U103)',
        description:
          'Locked: Component = Class (field or Extends). No Component node. Game-talk Health/Inventory is class_define plus a field or Extends. See language_capability_catalog.md § Component = Class.',
        status: 'done',
      },
      {
        id: 'function-ctor-dtor-role',
        title: 'Function constructor/destructor role',
        description:
          'Function Define role constructor/destructor (same pattern as On role entry|tick). Emit: Python __init__, JavaScript constructor(), C++ ctor/dtor, C# ctor (no finalizer), GDScript _init. Rust, Go, and Verse stay dim. Not constructor_define / destructor_define.',
        status: 'done',
      },
      {
        id: 'leftover-construct-roles-lock',
        title: 'Leftover-construct roles lock',
        description:
          'Locked: no constructor_define, property_define, implements_define, inherit/multiple-inheritance node, or flow_match kinds. Constructor/destructor is Function role; property and Implements are options; extra bases are Extends rows (locked visual; emit still one extendsType string); Switch is the match node (CL-017 optional lowering).',
        status: 'done',
      },
      {
        id: 'lambda-expression-node',
        title: 'Lambda expression node',
        description:
          'Expression node lambda_define (no exec). Capture option. Body is one data in; result data out; params comma string. Spawn python/javascript/csharp/rust/gdscript only. Pack templates for those 5 langs. Not a project symbol.',
        status: 'done',
      },
      {
        id: 'try-flow-node',
        title: 'Try / catch flow node',
        description:
          'flow_try like Branch: try/catch/finally exec pins + exec_out. Optional catchType/catchName. Empty finally omitted. Spawn python/javascript/cpp/csharp/gdscript; hidden go/rust. No Result/panic fiction.',
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
        layer: 'backend',
        title: 'Go v3 + MCP class tools (sidecar)',
        description:
          'Optional Go sidecar: domain v3 normalize; list_classes / add_class; optional class_id on get_graph and add_node. Hosted path uses the same names in the in-page TS runtime.',
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
        title: 'Generate = Code panel emit (U56--U57)',
        description:
          'TopNav Generate / CLI / Code preview share emitProjectLikeCodePanel; folder write when on disk. Class-home tabs show the graphâ€™s module file.',
        status: 'done',
      },
      {
        id: 'fidelity-streamline-0-4',
        title: 'Fidelity streamline Phases 0--4',
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
          'Stable vvs-test-* seeds; five labs (First Graph, Branch Lab, Coverage Lab, New Features Lab, Inheritance Lab); test_project_goldens/ + usabilityExampleGoldens.test.ts; extract --update-goldens.',
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
    layer: 'frontend',
    title: 'Project workflow',
    items: [
      {
        id: 'save',
        title: 'Save & load',
        description:
          'ProjectSnapshot v3 -- browser localStorage for quick projects, or git-friendly `.vvs/` folder layout on disk (split graphs, symbols, integration.json). Import/export JSON.',
      },
      {
        id: 'project-folder',
        title: 'On-disk project folders',
        description:
          'File System Access API -- new/open folder, IndexedDB handle storage, save writes `.vvs/project.json`, graphs, symbols, and integration config; `.gitignore` scaffold.',
      },
      {
        id: 'graph-doc-split',
        layer: 'frontend',
        title: 'Per-tab document rows',
        description:
          'In-memory snapshot is already per-tab documents. Folder save writes one `.graph.json` per container/function via `buildFolderGraphManifest`. Proof in `io.test.ts`. No SQL `graph_documents` table, no collab protocol. Browser localStorage still stores a full snapshot.',
        status: 'done',
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
        title: 'Agent panel',
        description:
          'TopNav Agent panel -- in-page prompt + tools. Collapsed sidecar section pastes optional local Go MCP config (tools/mcp.cursor.example.json). Not a hosted MCP URL.',
      },
      {
        id: 'mcp-paste-u70',
        title: 'Optional Go MCP sidecar paste (U70)',
        description:
          'Collapsed Agent panel sidecar for Cursor/Claude + CLI paste-config. Optional local Go process -- not the hosted path. mcpAllowDangerousTools is sidecar intent only and does not reach Go.',
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
          'Mock (localStorage) and HTTP (Go) transports -- save, load, list, compile, health, MCP probe; Bearer token on HTTP when session is set.',
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
          'CodeMirror 6 -- **Code** tab (per-graph transpile + sourceMap highlights aligned with displayed files; language and .{ext} in header); **Files** tab (project-wide folder tree from useProjectTranspileResult). Live validation badge + preview-only banner when class Declare missing; sync indicator reflects analysis errors. Project map tab skips codegen.',
        status: 'done',
      },
      {
        id: 'searchable-selects',
        title: 'Searchable dropdowns',
        description:
          'SearchableSelect component -- codegen language/extension, property enums, import graph/class/module pickers, environment import defaults.',
        status: 'done',
      },
      {
        id: 'import-graph-picker',
        title: 'Import graph pickers',
        description:
          'ImportGraphTargetPanel + projectGraphCatalog -- searchable picker for graph_ref, import_class, and import_module targets across all project graphs.',
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
    layer: 'frontend',
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
        id: 'env-backstage-compat',
        layer: 'frontend',
        title: 'Backstage template compatibility',
        description:
          'Backstage `template.yaml` + skeleton/ import as hostFiles; Nunjucks `{{ moduleName }}` normalized to `{moduleName}`; existing `bun run import:env` / `scripts/env-import.ts --backstage`. No new CLI product.',
        status: 'done',
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
        layer: 'backend',
        title: 'Go registry API',
        description:
          'Health, core-pack nodes, environments, syntax-packs catalog; domain snapshot v3 mirror; ListAvailableNodes + ListSyntaxPacks tests.',
      },
      {
        id: 'server-http',
        layer: 'backend',
        title: 'Go project HTTP API',
        description:
          'ProjectStore port -- MemoryStore (default) or PostgresStore (DATABASE_URL); GET/PUT /api/projects, list, POST â€¦/compile; CORS + Authorization header.',
      },
      {
        id: 'server-auth',
        layer: 'backend',
        title: 'JWT auth middleware',
        description:
          'Go middleware -- AUTH_REQUIRED + SUPABASE_JWT_SECRET; DevUserID when auth off; user_id scoping on HTTP + MCP services.',
      },
      {
        id: 'server-mcp',
        layer: 'backend',
        title: 'Go MCP sidecar (local + JWT)',
        description:
          'Optional SSE at /mcp -- same tool names as the in-page agent plus save_project and pack tools. Not the hosted path. Writes require VVS_MCP_ALLOW_WRITE (the in-page checkbox does not set it).',
      },
      {
        id: 'dev-startup',
        layer: 'backend',
        title: 'One-command dev startup',
        description:
          'tools/start_app.ps1 launches Next.js (HTTP API mode) + Go server; setup_env.ps1 seeds NEXT_PUBLIC_API_MODE=http in .env.local.',
      },
    ],
  },
  {
    id: 'language-platform',
    layer: 'frontend',
    title: 'Language platform (seven families)',
    phase: 6,
    emphasis: 'shipped',
    items: [
      {
        id: 'languages-more',
        title: 'Pack-driven language families',
        description:
          'Python, JS, C++, Verse, GDScript, Rust, C# -- pack-first print + 14×7 Rosetta goldens. Milestone 3 closed July 2026.',
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
        id: 'rust-console-env',
        title: 'Rust console environment pack',
        description:
          '`env.rust.console-app` with `src/main.rs` + `Cargo.toml` + println/stdin natives. Tree-sitter Rust is not hooked (no grammar).',
        status: 'done',
      },
      {
        id: 'env-devcontainer',
        title: 'Dev Container linkage',
        description:
          'Optional `devcontainer?: { path }` on manifests. Rust console ships `.devcontainer/devcontainer.json` as a host file. No Docker runtime -- VVS does not start containers.',
        status: 'done',
      },
      {
        id: 'usability-example-tests',
        title: 'Usability Test Projects',
        description:
          'Five usability test cards on StartScreen (First Graph, Branch Lab, Coverage Lab, New Features Lab, Inheritance Lab); verify codegen via Code panel extract (extract_test_project_outputs.ts). Calculator/Async Fetcher/Dual Class Lab retired as StartScreen fixtures.',
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
          'Comment selected nodes; soft memberIds; lock = adopt body contents; unlock = free peers + position follow; resize-to-fit on demand; dashed vs solid. Pack prefix -- never (x).',
        status: 'done',
      },
      {
        id: 'user-comments-toggle-u69',
        title: 'Code panel user-comments toggle (U69)',
        description:
          'showUserComments / emitUserComments -- independent of (x) unsupported comments.',
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
          'Connected exec chain = primary nest/emit order; vertical Y = secondary for unconnected heads (+ event peers). Teaching warnings CHAIN_ORDER_Y_MISMATCH / EVENT_PEER_Y_ORDER -- no auto-reorder. Comment attach topmost Y.',
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
        title: 'Node search -- all graphs toggle (U84)',
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
          'App-default Tooltip (`components/ui/Tooltip.tsx`) -- Esc dismiss, viewport clamp; migrated across left panel + editor chrome (native title= tips removed from interactive controls).',
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
          'Output panel tabs: Log · History · Activity (` cycles). Newer History states kept until edit confirms discard. Edit → History…; per-tab enable in Settings / Output context menu.',
        status: 'done',
      },
      {
        id: 'topnav-menus-u109',
        title: 'Top bar menus (U109)',
        description: 'File · Edit · View · Help -- complete items, shortcuts, History entry.',
        status: 'done',
      },
      {
        id: 'settings-redesign-u110',
        title: 'Settings redesign (U110)',
        description:
          'Sidebar shell -- Project · Editor · Shortcuts · Audio · About. Search catalogs every section (U110 follow-on): honest Editor blurb, Project grouping (this graph / defaults / environment / export / details / packs), Audio cards. Output panel tab toggles.',
        status: 'done',
      },
      {
        id: 'shortcut-rebind-u111',
        title: 'Shortcut reassignment (U111)',
        description:
          'Settings → Shortcuts -- record key chords with conflict blocking; stored in browser prefs.',
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
        id: 'dynamic-naming-u118',
        title: 'Dynamic naming conventions (U118)',
        description:
          'Settings options to make node and symbol naming follow default VVS global naming, a specific supported language, or auto-follow target language.',
        status: 'done',
      },
      {
        id: 'bad-practices-settings-u119',
        title: 'Bad practices & safety settings (U119)',
        description:
          'Settings toggles for: (1) allow multiple exec outputs to one input (warns of redundancy), and (2) Dynamic/Weak typing warnings.',
        status: 'done',
      },
      {
        id: 'go-target-language-u77',
        title: 'Go Target Language Pack (U77)',
        description:
          'Go (.go) target language family support: go.base.json syntax pack, goProfile, custom statement printers (getInput, switch), 14 Rosetta goldens, and UI selectors.',
        status: 'done',
      },
      {
        id: 'details-compact-rethink-u86',
        title: 'Details panel compact rethink (U86)',
        description:
          'Compact Details shows kind/category, pin counts, and bound symbol hints -- no generic “hover for details”.',
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
      {
        id: 'browser-nav-vs-graph-history',
        title: 'Browser Back/Forward = navigation only',
        description:
          'Mouse/browser Back·Forward restore editor navigation frames (tab, view, selection, focus) -- not graph undo. Graph History lives in Log → History.',
        status: 'done',
      },
    ],
  },
];

/** Open / partial only -- shipped work lives under SHIPPED_FEATURE_SECTIONS (Done tab). */
export const FUTURE_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'graph-model-locked-visual',
    title: 'Graph model (locked visual)',
    phase: 6,
    items: [
      {
        id: 'extends-list-mi-locked-visual',
        layer: 'frontend',
        title: 'Extends list (multiple inheritance visual)',
        description:
          'Visual shipped: Extends is a list on Declare Class; + Add base is a second row (Python/C++ only). Persist keeps extendsTypes with [0]===extendsType on renameClass / defineNodeSync / snapshot. Generate still prints the first parent only. Multi-base emit not shipped. Not an Inherit node. See language_capability_catalog.md § Multiple inheritance.',
        status: 'partial',
      },
    ],
  },
  {
    id: 'leftover-fidelity-open',
    title: 'Leftover fidelity',
    phase: 6,
    emphasis: 'active',
    items: [
      {
        id: 'verse-getinput-cl014',
        layer: 'frontend',
        title: 'Verse GetInput (CL-014)',
        description:
          'Honest (x) + prompt. Real player/string read is not a plain-class API — do not invent one.',
        status: 'planned',
      },
      {
        id: 'switch-match-cl017',
        layer: 'frontend',
        title: 'Switch match (CL-017, optional)',
        description:
          'Optional native match lowering. If-cascade is the shipped shape.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'priority-3-ai-and-examples',
    title: 'Long-term: code → visual (U93)',
    phase: 6,
    items: [
      {
        id: 'code-to-visual-u93',
        layer: 'frontend',
        title: 'Long-term: code → visual (U93)',
        description:
          'Research track: read raw source and produce text-shaped graphs (reverse of Generate). Must preserve canvas source of truth and fidelity -- not near-term polish.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'leftover-constructs-planned',
    title: 'Leftover constructs (planned nodes)',
    phase: 6,
    items: [
      {
        id: 'yield-statement-later',
        layer: 'frontend',
        title: 'Yield statement (later)',
        description:
          'Later statement node where you type yield (Python, GDScript). Not a soup of planned flow kinds.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'priority-4-catalog-and-oop',
    title: 'Catalog locks (U100)',
    phase: 6,
    items: [
      {
        id: 'event-listeners-u100',
        layer: 'frontend',
        title: 'Event listeners (U100)',
        description:
          'Cut -- hidden subscribe/emit runtime is rejected. Dispatch is the invoke node. Do not spawn event_emit / event_subscribe.',
        status: 'cut',
      },
    ],
  },
  {
    id: 'unified-symbols',
    title: 'Unified symbol model & portability',
    items: [
      {
        id: 'coa-deferred',
        layer: 'backend',
        title: 'Cross Over Architecture (COA)',
        description:
          'Deferred -- COA_SHIPPED false. Prerequisites: multi-target export, documented compile policy. Single-target portability warnings + U66/U67 available today.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'transpiler',
    title: 'Transpiler & languages',
    items: [
      {
        id: 'overrides',
        title: 'Function overrides (OOP)',
        description: 'Shipped as U105 — override is an option on Function Declare/Define; emit + dim per language.',
        status: 'done',
      },
    ],
  },
  {
    id: 'environment-standards',
    title: 'Environment templates & standards',
    items: [
      {
        id: 'env-typespec-emitter',
        layer: 'frontend',
        title: 'TypeSpec → manifest emitter',
        description:
          'Custom TypeSpec emitter producing ProjectEnvironmentManifest JSON as a single API authoring source.',
        status: 'planned',
      },
      {
        id: 'env-template-upgrade',
        layer: 'frontend',
        title: 'Non-destructive template upgrade',
        description:
          'Refresh/drift notes shipped: `refreshEnvironmentTemplate` + GraphPropertiesPanel Refresh control. Re-applies host files, preserves graphs, notes `applied` / `kept-yours` / `already-current`. Full three-way merge still TBD.',
        status: 'partial',
      },
      {
        id: 'env-engine-packs',
        layer: 'frontend',
        title: 'Engine environment packs',
        description:
          'UE/Verse and other engine API manifests as installable Library environments -- portability-gated natives.',
        status: 'planned',
      },
      {
        id: 'env-host-editable',
        layer: 'frontend',
        title: 'Host file integration policies',
        description:
          'Skip vs emit + custom emit path proven (`hostEmit.generate.test.ts`, `adoptExisting` skip). `appliedTemplate` persists on `HostFileIntegrationRule`. Full in-editor host editing/merge still planned.',
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
        layer: 'backend',
        title: 'Full Supabase Docker on VPS',
        description:
          'Out of scope as product. No dedicated VPS / self-hosted Supabase track. Client-first: local/.vvs/git + static Pages. Legacy notes in docs/deployment.md only.',
        status: 'cut',
      },
      {
        id: 'github-oauth',
        layer: 'backend',
        title: 'GitHub OAuth + email auth (hosted)',
        description:
          'Out of scope as product default. No VVS accounts required. Code may remain hidden/disabled for experiments.',
        status: 'cut',
      },
      {
        id: 'ops-backups',
        layer: 'backend',
        title: 'VPS ops & backups',
        description: 'Out of scope -- no dedicated server product to operate.',
        status: 'cut',
      },
      {
        id: 'pwa',
        layer: 'frontend',
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
    title: 'Phase 3 -- Community library',
    items: [
      {
        id: 'library-backend',
        layer: 'backend',
        title: 'Library remaining (U90 auth / upload)',
        description:
          'Library page redesign shipped (templates / git import). Auth / upload frozen (client-first; no accounts as product). Remaining Phase 3: vvs-library repo, CI, web UI wiring.',
        status: 'partial',
      },
      {
        id: 'search',
        layer: 'frontend',
        title: 'Semantic library search',
        description:
          'Library search box filters catalog by name/category/language/description via client token match (`librarySearch.ts`). Not embeddings; semantic search backend TBD.',
        status: 'partial',
      },
    ],
  },
  {
    id: 'collaboration',
    phase: 4,
    title: 'Phase 4 -- Session collaboration',
    items: [
      {
        id: 'collab',
        layer: 'backend',
        title: 'Session client / host',
        description:
          'Game-lobby style session sync -- not account cloud multiplayer. Transport TBD (Go WS candidate).',
        status: 'planned',
      },
    ],
  },
  {
    id: 'ue6',
    phase: 5,
    title: 'Phase 5 -- Unreal Engine 6 plugin',
    items: [
      {
        id: 'ue-plugin',
        layer: 'backend',
        title: 'In-engine graph editor',
        description: 'UE6-embedded canvas on the same graph schema with Verse emitter integration.',
        status: 'planned',
      },
      {
        id: 'verse-parity',
        layer: 'backend',
        title: 'Web ↔ engine round-trip',
        description: 'Import/export graphs between browser editor and in-engine sessions.',
        status: 'planned',
      },
      {
        id: 'ue-nodes',
        layer: 'frontend',
        title: 'UE API environment packs',
        description:
          'Engine environment manifests and data-driven nodes atop @vvs/environment-templates (not Blueprint VM).',
        status: 'planned',
      },
      {
        id: 'blueprint-bridge',
        layer: 'frontend',
        title: 'Blueprint transition tooling',
        description: 'Workflows helping teams migrate Blueprint habits to Verse-first authoring.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'polish',
    phase: 6,
    title: 'Later -- scale & platforms',
    items: [
      {
        id: 'mobile',
        layer: 'frontend',
        title: 'Touch & mobile UX',
        description:
          'Agent panel / Bot / StatusBar chip hidden at max-width 768px (`mobileViewport`, `useIsMobile`). Coarse-pointer pin snap 40px vs mouse 20px (`mobileViewport`, `useCoarsePointer`, React Flow `connectionRadius`). Desktop unchanged. Gestures and radial menus still planned.',
        status: 'partial',
      },
      {
        id: 'enterprise',
        layer: 'backend',
        title: 'Enterprise deploy',
        description:
          'Out of scope as product. No dedicated enterprise VPS. Client-first local/.vvs/git. Legacy self-host notes may remain in docs/deployment.md.',
        status: 'cut',
      },
      {
        id: 'templates',
        layer: 'frontend',
        title: 'Richer project templates',
        description:
          'Added `env.csharp.console-app`, `env.javascript.data-script`, `env.javascript.http-service` plus rust console. Community catalog still not a product.',
        status: 'partial',
      },
      {
        id: 'folder-os-path',
        layer: 'frontend',
        title: 'Reveal in Explorer / Finder',
        description:
          'Native “open containing folder” from the editor -- blocked today by browser File System Access API (no absolute path exposure).',
        status: 'planned',
      },
    ],
  },
];
