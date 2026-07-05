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
}

/** Shipped editor and platform capabilities (aligned with docs/current_state.md). */
export const SHIPPED_FEATURE_SECTIONS: RoadmapSection[] = [
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
          'Start screen — new/open folder (.vvs/ overlay), recent projects (browser or folder), import JSON, library shortcut. Library browse uses session drafts (no spurious recents).',
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
        description: 'API/offline indicator, saved time, graph nav & minimap toggles, code & log toggles, error jump.',
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
        id: 'auto-workflow',
        title: 'Auto-compile & auto-sync',
        description: 'TopNav toggles for debounced compile and code-preview sync.',
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
        id: 'tabs',
        title: 'Multi-graph tabs',
        description: 'Main and function graphs with per-tab documents and metadata.',
      },
      {
        id: 'tree',
        title: 'Project explorer',
        description:
          'Graphs, functions, variables, project events (subscriber counts), Environment API browser, generated exports.',
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
        description: 'VvsApi listProjects, compileProject, save/load; StatusBar shows API health when NEXT_PUBLIC_API_MODE=http.',
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
        description: 'Cut, copy, paste, duplicate (in-app + OS clipboard); extract selection to function (Ctrl+Shift+E).',
      },
      {
        id: 'pins-ui',
        title: 'Pin geometry & inline widgets',
        description: 'Distinct shapes per pin type (incl. array); inline editors on node pins.',
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
          'IR pipeline, hoisted imports, Wait/Await Wait, Subscribe/Emit multicast, macro removal — every node maps to visible export text.',
      },
      {
        id: 'environments',
        title: 'Project environments',
        description:
          'VS Code–style templates: live manifest catalog (9+ packs, categories), linked manifest, Environment API browse/spawn, env.call_native, module + host multi-file codegen.',
      },
      {
        id: 'events',
        title: 'Event dispatchers',
        description:
          'Project custom events plus manifest events; Define, Subscribe, Emit (legacy Dispatch); handler codegen.',
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
        id: 'transpile',
        title: 'Client transpiler',
        description:
          'Structured IR v2 (analyze → lower → print → emit); Python, JS, C++, Verse, JSON; example + Rosetta snapshot tests.',
      },
      {
        id: 'syntax-packs',
        title: 'Syntax packs & Rosetta suite',
        description:
          '@vvs/syntax-packs — base JSON print templates, capability overlays (e.g. ES2022), golden fixtures (print, branch, assign, call, convert, dispatch, wait), fidelity linter.',
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
        description: 'Selection in code preview highlights originating graph nodes and expressions.',
      },
      {
        id: 'portability',
        title: 'Portability warnings',
        description: 'Per-target feature matrix surfaced in compiler log, status bar, and code panel badge.',
      },
      {
        id: 'analysis',
        title: 'Project analysis',
        description: 'analyzeProject diagnostics, portability scan, compile gate before codegen.',
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
          'ProjectSnapshot v2 — browser localStorage for quick projects, or git-friendly `.vvs/` folder layout on disk (split graphs, symbols, integration.json). Import/export JSON.',
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
        id: 'mcp-ui',
        title: 'Connect AI modal',
        description: 'MCP URL copy, connection probe, honest offline messaging in mock mode.',
      },
      {
        id: 'api-facade',
        title: 'VvsApi facade',
        description: 'Mock and HTTP client layers for save, compile, health, and future backend wiring.',
      },
      {
        id: 'codemirror',
        title: 'Code preview panel',
        description:
          'CodeMirror 6 with syntax highlighting, transpiler-driven output, and multi-file tabs (module + host entry).',
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
          'Shared snapshot v2, symbols, diagnostics, analyzeProject, ProjectIntegrationConfig, `.vvs/` folder constants, portability feature tags.',
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
          'Health, core-pack nodes, environments, syntax-packs catalog; domain snapshot v2 mirror; ListAvailableNodes + ListSyntaxPacks tests.',
      },
    ],
  },
];

/** Planned or in-progress capabilities (aligned with docs/roadmap.md and current_state gaps). */
export const FUTURE_FEATURE_SECTIONS: RoadmapSection[] = [
  {
    id: 'syntax-packs',
    title: 'Syntax packs & agent maintenance',
    items: [
      {
        id: 'rosetta-expand',
        title: 'Expand Rosetta coverage',
        description:
          'Golden fixtures for subscribe/emit, await wait, env.call_native, imports, and multi-file layouts — 7 constructs shipped.',
        status: 'partial',
      },
      {
        id: 'syntax-pack-mcp',
        title: 'MCP syntax pack tools',
        description:
          'list_syntax_packs (HTTP shipped), propose_syntax_delta, run_rosetta_suite, validate_generated_parse — Go MCP wire TBD.',
        status: 'partial',
      },
      {
        id: 'tree-sitter-ci',
        title: 'Tree-sitter parse validation',
        description:
          'Optional CI parse check for Python/JS Rosetta output — validator-only; not syntax author.',
        status: 'planned',
      },
      {
        id: 'syntax-pack-ui',
        title: 'Syntax pack lock in UI',
        description:
          'Project settings to pin syntaxPackLock per target family (schema exists in .vvs/project.json).',
        status: 'done',
      },
    ],
  },
  {
    id: 'transpiler',
    title: 'Transpiler & languages',
    items: [
      {
        id: 'overload-picker',
        title: 'Overload picker on call nodes',
        description: 'Switch which overload a call node targets without re-dragging from the tree.',
        status: 'done',
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
        id: 'virtual-async',
        title: 'Virtual & async semantics',
        description: 'Wire virtual/async flags through analysis and per-target codegen (today: flags + warnings only).',
        status: 'partial',
      },
      {
        id: 'legacy-migration',
        title: 'Label-free graph migration',
        description: 'Finish kindId-first paths; retire label-based adapters on old saves.',
        status: 'partial',
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
        id: 'env-openapi-asyncapi',
        title: 'OpenAPI + AsyncAPI import',
        description:
          'CLI and editor UI import OpenAPI → methods and AsyncAPI → events; JSON Schema validation; x-vvs bindings.',
        status: 'done',
      },
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
          'One-click refresh from linked environment version; preserve user graph divergence with drift indicators (version drift UI shipped; full merge TBD).',
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
    id: 'cloud',
    title: 'Cloud, API & MCP',
    items: [
      {
        id: 'auth',
        title: 'Accounts & cloud projects',
        description: 'Supabase auth, project ownership, synced persistence beyond localStorage.',
        status: 'planned',
      },
      {
        id: 'http-persistence',
        title: 'HTTP project API',
        description:
          'VvsApi HTTP mode wired for save/load/list/compile. Go in-memory store handler in progress (other agent). Folder `.vvs/` remains git-friendly path.',
        status: 'partial',
      },
      {
        id: 'mcp-wire',
        title: 'MCP server transport',
        description: 'Local Phase 1 SSE at /mcp — ListNodes, GetGraph, AddNode, ConnectPins, GenerateCode (Go agent). UI probe shipped.',
        status: 'partial',
      },
      {
        id: 'mcp-mutations',
        title: 'AI graph editing via MCP',
        description:
          'Thin Go wrappers over pure functions for safe agent-driven graph mutations and syntax pack proposals.',
        status: 'partial',
      },
      {
        id: 'pwa',
        title: 'PWA offline sync',
        description: 'Service worker + IndexedDB cached registry for offline-first editing.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'community',
    title: 'Community & collaboration',
    items: [
      {
        id: 'library-backend',
        title: 'Library backend',
        description:
          'Upload, browse, version, and rate community graphs, node packs, templates, and environment manifests.',
        status: 'partial',
      },
      {
        id: 'collab',
        title: 'Real-time collaboration',
        description: 'WebSocket sync, cursors, selection presence, conflict strategy (CRDT/OT TBD).',
        status: 'planned',
      },
      {
        id: 'search',
        title: 'Semantic library search',
        description: 'pgvector intent search across shared scripts and templates.',
        status: 'planned',
      },
    ],
  },
  {
    id: 'ue6',
    title: 'Unreal Engine 6 plugin',
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
    title: 'Scale, platforms & enterprise',
    items: [
      {
        id: 'languages-more',
        title: 'More language targets',
        description:
          'GDScript, Rust, C# via new syntax pack families + Rosetta fixtures; agent-assisted pack authoring.',
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
        description: 'Self-hosted option, moderation, audit logs for studio teams.',
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
