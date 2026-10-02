export type ResearchVerdict = 'ship' | 'later' | 'reject';

export interface ResearchOption {
  id: string;
  title: string;
  verdict: ResearchVerdict;
  summary: string;
  how: string;
  pros: string[];
  cons: string[];
}

export interface ResearchTopic {
  id: string;
  systemId: string;
  title: string;
  subtitle: string;
  problem: string;
  constraints: string[];
  options: ResearchOption[];
  recommendation: string;
  firstSlice: string[];
  sources: { label: string; href: string }[];
}

/** Evidence snapshot after PR #8. Verdicts are recommendations, not implementation status. */
export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'u93-code-to-visual',
    systemId: 'code-to-visual-u93',
    title: 'U93: code-to-visual reverse import',
    subtitle: '[Research, 30 September 2026] Next after ownership/conformance gates; verify PR8 in the browser alongside foundations. Now: certify and exercise the existing narrow implementation; next: a contrasting Python pilot; later: broad syntax and eight-language coverage.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] The implementation already imports plain JavaScript classes and one selected named synchronous script function in explicit Library mode. File-owned functions have visible Declare/Define nodes and no synthetic source class or entry. The mapper permits parameter reads, finite literals, Number-literal arithmetic and terminal Boolean branches; calls, locals, captures, defaults/rest, exports, directives and embedded comments remain rejected. Preview candidates can contain syntax that the mapper subsequently rejects, so candidate count is not accepted coverage (U1, U2). Worker termination, cancellation, deadlines, stale-response rejection and sealed review already exist. Independent Acorn, mutation, canonical-graph and persistence tests exist, but runtime acceptance compares normalized Babel ASTs and this is deliberately not general equivalence. The execution document reports 1,044 tests from the pilot; its latest interactive browser check was unavailable. Those are recorded results, not checks rerun here (U3–U5). The eight-profile registry and 112 Rosetta inventory records are foundations, not eight working reverse adapters or certified translation pairs. Materialization still fixes the target to JavaScript, and the file-function emission special case is explicitly JavaScript-only. A second parser cannot by itself unlock Python modules (U6, U7).',
    constraints: [
      'Canvas owns accepted regions; retain the complete original source and unresolved spans. Never replace executable source with an (x) comment and call it converted.',
      'Local, deterministic, preview-first import on Pages; no source upload, required parser server or model-generated acceptance.',
      'Keep visible Declare/Define ownership and node/option/pin fidelity. Eight printers and profile records do not establish eight reverse adapters.',
      'Use binding/effect evidence to recognize Call, Dispatch or Bind; punctuation or an on_* name alone is not a semantic proof.',
    ],
    options: [
      {
        id: 'deterministic-ir-reverse',
        title: 'Extend the current semantic mapper',
        verdict: 'ship',
        summary: 'Lowest integration risk; supports incremental, reviewable capabilities. Prioritize dependency-closed calls/locals only after lexical binding and evaluation-order contracts are explicit. More JS syntax alone does not test the cross-language architecture.',
        how: 'Development / maintenance gate: Calls and locals need explicit binding and evaluation-order contracts.',
        pros: [
          'Extends the sealed, source-linked JS path incrementally.',
        ],
        cons: [
          'Calls and locals need explicit binding and evaluation-order contracts.',
        ],
      },
      {
        id: 'llm-graph-json',
        title: 'Browser CST adapter plus independent native compiler',
        verdict: 'later',
        summary: 'Tree-sitter provides browser WASM and per-language grammars, but error-tolerant syntax trees do not resolve names or prove valid compilation. Suitable Python pilot candidate if every error/missing node blocks acceptance and CPython independently checks the output (U8, U9).',
        how: 'Development / maintenance gate: CST recovery is not semantic validity; grammar and CPython versions must be pinned.',
        pros: [
          'Tests the multi-language design with a small independent Python proof.',
        ],
        cons: [
          'CST recovery is not semantic validity; grammar and CPython versions must be pinned.',
        ],
      },
      {
        id: 'deterministic-plus-confirmed',
        title: 'CPython through Pyodide; optional AI assistance later',
        verdict: 'later',
        summary: 'Pyodide can run in a worker and offers the reference parser, but startup, download and memory costs must be measured. Using it for both production and expected answers weakens independence. AI may explain rejected spans or propose reviewed mappings; it should not authorize fidelity (U9, U10).',
        how: 'Development / maintenance gate: Measure download/startup/memory; keep independent expected evidence and human-reviewed AI suggestions.',
        pros: [
          'Offers the reference parser in a browser worker.',
        ],
        cons: [
          'Measure download/startup/memory; keep independent expected evidence and human-reviewed AI suggestions.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Keep deterministic, source-linked import. After PR #8, the highest-value next step is independent evidence for the shipped JavaScript subset plus a deliberately tiny Python compilation-unit pilot. Expanding every parser or adding AI-generated graph JSON first would obscure the remaining semantic and generator boundaries.',
    firstSlice: [
      'Priority: Next after ownership/conformance gates; verify PR8 in the browser alongside foundations',
      'Dependency: Visible file/library ownership and target-correct function emission, then scope/effect contracts for calls and locals',
      'Dependency: Independent expected facts, pinned tooling and versioned evidence; Go is a useful next typed package pilot, while C++ build context and Verse tooling remain separate blockers',
      'Next experiment: Create a release-evidence slice for the existing JS fixtures, then compare browser-parser candidates on four Python library functions: identity, string return, literal arithmetic and terminal Boolean branch. First prove a fixed graph emits a correct file-level def without self/wrappers. Pin grammar/runtime versions, record cold/warm worker timings and payload/memory costs, and use CPython parse plus compile without executing uploaded code.',
      'Acceptance gate (proposed): Existing JS source→graph→source, canonical graph→source→graph, mutation, receipt and save/load cases remain green; trusted checked-in behavior fixtures agree on values and effects.',
      'Acceptance gate (proposed): Python full-file output passes pinned CPython parse and compile; scope/binding mutations fail. A recovered CST, absent validator or unsupported dependency cannot pass.',
      'Acceptance gate (proposed): Unicode/CRLF spans preserve originals exactly; cancel, timeout, close/reopen and source edits cannot accept stale or partial projects.',
      'Acceptance gate (proposed): Repeat the production-browser import, accept and reload flow; publish measured budgets before increasing the present 1,500 ms deadline or 128 KiB limit.',
    ],
    sources: [
      {
        label: 'U1 — Current JavaScript mappings and semantic rejection gates',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/source-import/src/javascriptMappings.ts',
      },
      {
        label: 'U2 — Preview classification is broader than accepted mapping',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/source-import/src/parser.ts',
      },
      {
        label: 'U3 — Validation, structural comparison and review seal',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/source-import/src/validation.ts',
      },
      {
        label: 'U4 — Dedicated worker cancellation and deadlines',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/sourceImportWorkerClient.ts',
      },
      {
        label: 'U5 — Implementation progress and verification limitations',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/docs/design/bidirectional_execution.md#standalone-javascript-pilot-design',
      },
      {
        label: 'U6 — JavaScript-fixed materialization',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/source-import/src/materialize.ts',
      },
      {
        label: 'U7 — JavaScript-only file-function shell',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/emit/members.ts#L712-L731',
      },
      {
        label: 'U8 — Tree-sitter browser WASM and grammar ABI constraints',
        href: 'https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web',
      },
      {
        label: 'U9 — CPython: parsing lacks scope checks; compile is a separate gate',
        href: 'https://docs.python.org/3.12/library/ast.html#ast.parse',
      },
      {
        label: 'U10 — Pyodide worker integration',
        href: 'https://pyodide.org/en/stable/usage/webworker.html',
      },
      {
        label: 'U11 — Eight-language plan and separate compatibility contracts',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/docs/design/multilanguage_bidirectional_plan.md',
      },
      {
        label: 'U12 — Profile registry and uncertified inventory',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/language-profiles/src/bidirectional.ts',
      },
    ],
  },
  {
    id: 'collab-session-sync',
    systemId: 'collab',
    title: 'Session collaboration: host/client, authority before transport',
    subtitle: '[Research, 30 September 2026] Later; shared commands and multiplayer-safe undo before transport. Planned; protocol experiment warranted, product implementation later.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] At the pinned PR8 commit there is no collaboration implementation identified in the web dependency list or inspected graph state paths. GraphEditContext exposes direct node/edge setters; GraphWorkspaceContext separately owns multi-document patches. useGraphState records lean canvas snapshots or full ProjectHistorySlice snapshots and restores them on undo. That slice includes symbols, classes, all documents and navigation. Broadcasting existing undo snapshots would therefore risk erasing peers\' accepted edits and moving their local view. The existing analyzer is not a network admission validator. validateDocument skips wires with absent endpoints, while treating ordinary unconnected execution inputs as errors. Consequently, neither \'accept anything the analyzer accepts\' nor \'reject every edit until Generate is valid\' is safe: the latter prevents normal intermediate editing. Separate wire/schema/reference invariants from incomplete-program diagnostics, and validate compound symbol/declaration/document changes atomically.',
    constraints: [
      'Ephemeral client/host lobby; no required VVS account, app server or durable sync database.',
      'Keep selection, viewport, open tabs and filesystem handles private to each host. Guests cannot write the host filesystem.',
      'Admission enforces structural/reference invariants atomically, while allowing ordinary temporarily incomplete programs.',
      'Generate stays local. Host authority, replication algorithm and network transport are separate choices.',
    ],
    options: [
      {
        id: 'lobby-host-lww',
        title: 'Host-ordered command transactions',
        verdict: 'ship',
        summary: 'Best match for short lobbies. Assign session epoch, client/op IDs and monotonically increasing host sequence; acknowledge, deduplicate and resync from a revisioned snapshot. Use last-arrival-wins only for independent presentation fields. Rewire, delete, signature change and Bind-related operations need preconditions and atomic effects. Costs are a command adapter, optimistic reconciliation and explicit conflict feedback.',
        how: 'Development / maintenance gate: Requires operation identities, preconditions, reconciliation and conditional undo.',
        pros: [
          'A single authority can validate compound graph changes before committing them.',
        ],
        cons: [
          'Requires operation identities, preconditions, reconciliation and conditional undo.',
        ],
      },
      {
        id: 'yjs-graph-crdt',
        title: 'Yjs or Automerge document replication',
        verdict: 'later',
        summary: 'Credible alternatives, not categorically incompatible with canvases. Yjs offers commutative/idempotent updates; Automerge retains concurrent property conflicts. Either can use a central host. Neither automatically enforces VVS cross-document invariants. The project must still define deletion/reference semantics, legal materialization, permissions and undo. Worth revisiting for offline concurrent editing or host handover; presently adds capabilities the lobby does not require.',
        how: 'Development / maintenance gate: They do not enforce VVS invariants; revisit when offline merge or host handover is required.',
        pros: [
          'CRDTs are credible central-host or multiwriter replication alternatives.',
        ],
        cons: [
          'They do not enforce VVS invariants; revisit when offline merge or host handover is required.',
        ],
      },
      {
        id: 'go-ws-room',
        title: 'Transport comparison: WebRTC and optional local relay',
        verdict: 'later',
        summary: 'Fits static Pages after connection, but WebRTC supplies neither rendezvous nor guaranteed NAT traversal. Manual offer/answer exchange avoids a signaling service at substantial UX cost. A short room code requires discovery infrastructure; reliable internet coverage may require TURN, which relays encrypted graph traffic. Signaling authentication, invitation expiry, message limits and backpressure remain application responsibilities. Alternative: Can keep the authoritative reducer in TypeScript/browser and use Go only as transport, avoiding duplicate validation rules. Installation, reachable TLS endpoint/tunnel and host availability remain real costs. It is not automatically a universal internet fallback. tldraw\'s authoritative server is useful prior art, not a drop-in serverless package.',
        how: 'Development / maintenance gate: Signaling, TURN, permissions, payload limits and a local-relay comparison remain real work.',
        pros: [
          'A browser data channel preserves the Pages editor after connection.',
        ],
        cons: [
          'Signaling, TURN, permissions, payload limits and a local-relay comparison remain real work.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Keep the locked host/client lobby, but replace the card\'s blanket property-LWW prescription with host-ordered atomic commands. Prioritize a shared mutation boundary and explicit session undo semantics before internet transport. Treat WebRTC and an optional local relay as interchangeable transport experiments, not separate conflict-resolution designs.',
    firstSlice: [
      'Priority: Later; shared commands and multiplayer-safe undo before transport',
      'Dependency: Define shared project state versus private selection, viewport, tabs, history and filesystem handles',
      'Dependency: Choose guest edit permissions, session save ownership, accepted pack/version identity and authenticated invitation design',
      'Dependency: Bound room size, payload bytes and pending operations; keep code generation local and prohibit guest filesystem writes',
      'Next experiment: Build a disposable protocol harness before editor integration: one host and two simulated guests, then three same-origin tabs over BroadcastChannel. Limit the command set to move, rename, connect, delete-with-attached-edges and one compound function edit. Inject delay, duplication, reordering, disconnection and host termination. Only after correctness passes, compare manual WebRTC and optional relay connectivity on an explicit LAN/home-NAT/restricted-network matrix. A two-tab demonstration alone does not validate network collaboration.',
      'Acceptance gate (proposed): Every accepted command yields the same canonical document/symbol hash and Generate output on all peers; invalid references never enter committed state',
      'Acceptance gate (proposed): Deleting a node versus concurrent wiring, editing a signature versus calls, and compound symbol/declaration changes have documented deterministic outcomes',
      'Acceptance gate (proposed): Undo is a conditional inverse command or explicitly host-controlled action; it never restores a stale whole-project snapshot over another user\'s work',
      'Acceptance gate (proposed): Host loss freezes shared editing and offers a local copy; reconnection cannot create a second authority or replay duplicate commands',
      'Acceptance gate (proposed): Missing signaling/TURN, incompatible app/registry versions, oversized messages and rejected edits produce explicit recoverable states',
    ],
    sources: [
      {
        label: 'Pinned graph editing and snapshot restoration',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/hooks/useGraphState.ts#L107-L192',
      },
      {
        label: 'Pinned full-project undo slice',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/graphHistory.ts#L30-L43',
      },
      {
        label: 'Pinned analyzer\'s structural checks',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/graph-types/src/analyze.ts#L78-L137',
      },
      {
        label: 'Figma\'s original authoritative property protocol and undo discussion',
        href: 'https://www.figma.com/blog/how-figmas-multiplayer-technology-works/',
      },
      {
        label: 'Yjs update guarantees',
        href: 'https://docs.yjs.dev/api/document-updates',
      },
      {
        label: 'Automerge conflicts',
        href: 'https://automerge.org/docs/reference/documents/conflicts/',
      },
      {
        label: 'tldraw sync server responsibilities',
        href: 'https://tldraw.dev/docs/sync',
      },
      {
        label: 'WebRTC connectivity and relay candidates',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity',
      },
      {
        label: 'Data-channel buffering, limits and DTLS',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels',
      },
      {
        label: 'BroadcastChannel scope',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API',
      },
    ],
  },
  {
    id: 'coa-compile-policy',
    systemId: 'coa-deferred',
    title: 'Cross Over Architecture: compile and export policy',
    subtitle: '[Research, 30 September 2026] Next: bounded target conformance now; complete multi-target export later. Now: correct the policy model and audit evidence; next: narrowly certified multi-target export; later: target overlays.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] COA_SHIPPED is false. analyzeCrossOverDiagnostics checks coarse PortabilityFeature lists and treats anything not listed unsupported as safe, including emulated features. nodeEffectiveness defaults most kinds to effective. A concrete counterexample is Verse Get User Input: its printer emits an (x) marker and substitutes an empty string or 0.0, yet the effectiveness resolver has no corresponding case. These helpers cannot certify portable output (C1, C2, C10). Printer availability does not establish compatible types, numeric behavior, receiver APIs, scheduling or dependency closure. A visible declaration marker may legitimately produce no separate prototype while its definition preserves the program; conversely, a printable import, discarded Implements property or missing second base can change meaning. Evaluate whole units and semantic options, not only \'behavioral nodes\' or presence of (x). The newer assessTranslation already distinguishes blocked, unvalidated and adaptation-required decisions, but requires reverse evidence from its source record. Graph-authored export should not wait for eight reverse importers. Reuse its requirement/evidence concepts through a graph-export entry point with the appropriate forward gates, rather than directly calling the source-translation path (C3).',
    constraints: [
      'One authoritative graph; no secret per-target documents, invented API or hidden VVS runtime.',
      'Keep everyday single-target warning/leftover behavior separate from a certified multi-target export claim.',
      'Unknown semantic obligations are unvalidated. Printer presence and emulated status are not correctness evidence.',
      'Keep COA_SHIPPED false until target decisions govern a real export action. No reverse importer is required for graph-authored forward validation.',
    ],
    options: [
      {
        id: 'refuse-target',
        title: 'Certified target-by-target export',
        verdict: 'ship',
        summary: 'Recommended production policy. Unknown or unsupported obligations withhold that target; validated targets remain available, with an explicit partial-success report. Requires concrete variant coverage, toolchain evidence and clear whole-unit boundaries.',
        how: 'Development / maintenance gate: Variant-level evidence and whole-unit dependency closure are needed.',
        pros: [
          'Validated targets remain exportable with an honest partial-success report.',
        ],
        cons: [
          'Variant-level evidence and whole-unit dependency closure are needed.',
        ],
      },
      {
        id: 'fanout-leftover',
        title: 'Best-effort multi-target preview',
        verdict: 'later',
        summary: 'Useful for comparison and migration even before certification, if labeled unvalidated and kept separate from the portable export action. The old card rejects this too absolutely: the harmful part is claiming compatibility, not displaying provisional output.',
        how: 'Development / maintenance gate: It must not be labeled compatible or admitted to certified export.',
        pros: [
          'Provisional output is useful for diagnosis and comparison.',
        ],
        cons: [
          'It must not be labeled compatible or admitted to certified export.',
        ],
      },
      {
        id: 'target-overlays',
        title: 'Portable core plus explicit target-specific sections',
        verdict: 'later',
        summary: 'Can represent real host-specific programs. Haxe demonstrates conditional and target-specific compilation, but that is not evidence that omitted sections preserve identical behavior. VVS needs visible boundaries, dependency checks and target tests before adding this document-model complexity (C5).',
        how: 'Development / maintenance gate: Visible boundaries and target tests add document-model complexity.',
        pros: [
          'Explicit sections can represent real host-specific requirements.',
        ],
        cons: [
          'Visible boundaries and target tests add document-model complexity.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Adopt fail-closed export per complete target, driven by semantic requirements and evidence rather than printer existence. Preserve a clearly labeled diagnostic preview. Separate \'these targets generated files\' from \'this program is portable across this set\'; partial success must never receive an all-target compatibility badge.',
    firstSlice: [
      'Priority: Next: bounded target conformance now; complete multi-target export later',
      'Dependency: Complete graph-origin semantic requirement collection, separate from reverse-import admission',
      'Dependency: Environment-aware capability contracts, variant-level evidence and native full-file validation',
      'Dependency: An explicit output naming/collision policy and unchanged single-target warning behavior',
      'Next experiment: Build a non-mutating export preflight over complete compilation units for two selected targets. Start with a small independently checked pure-function subset, then adversarial fixtures covering extra Extends, Implements, Bind receiver environments, Yield, imports and numeric variants. Emit a decision manifest naming target, exact profile/toolchain, node/property, evidence state and blocker. Keep the COA flag off until export consumes the decision.',
      'Acceptance gate (proposed): Verse Get User Input fails portable export despite an effective node classification; its empty-string/0.0 placeholder never counts as an input implementation.',
      'Acceptance gate (proposed): A node or property absent from the capability inventory returns unvalidated; emulated never means automatically safe.',
      'Acceptance gate (proposed): Any missing dependency, unsupported semantic variant or stale evidence withholds the affected complete target; no partly emitted file masquerades as success.',
      'Acceptance gate (proposed): Validated pure fixtures compile under both pinned toolchains and match independent expected behavior; deliberate operand/order/type mutations fail.',
      'Acceptance gate (proposed): Non-emitting Declare markers do not falsely block a valid definition, while dropped inheritance/interface obligations do block.',
      'Acceptance gate (proposed): All selected targets passing is required for the set-level portable claim; partial success lists omissions. Export does not mutate the graph or overwrite another target\'s files.',
    ],
    sources: [
      {
        label: 'C1 — Existing feature-list COA diagnostics',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/language-profiles/src/crossOver.ts',
      },
      {
        label: 'C2 — Limited node-effectiveness rules and default effective result',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/language-profiles/src/nodeEffectiveness.ts',
      },
      {
        label: 'C3 — Translation gates require source reverse evidence',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/language-profiles/src/translationCompatibility.ts',
      },
      {
        label: 'C4 — MLIR conversion modes and type-dependent legality',
        href: 'https://mlir.llvm.org/docs/DialectConversion/',
      },
      {
        label: 'C5 — Haxe conditional compilation',
        href: 'https://haxe.org/manual/lf-condition-compilation.html',
      },
      {
        label: 'C6 — Product COA toggle remains off',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/coaPolicy.ts',
      },
      {
        label: 'C8 — Compiler capability catalog',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/docs/design/language_capability_catalog.md',
      },
      {
        label: 'C9 — Evidence ledger distinguishes validation dimensions',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/language-profiles/src/bidirectional.ts',
      },
      {
        label: 'C10 — Concrete Verse input placeholder missed by effectiveness',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/print/printers/getInput.verse.ts',
      },
    ],
  },
  {
    id: 'ue6-attach-path',
    systemId: 'ue-plugin',
    title: 'UE6 / UEFN attach path and environment packs',
    subtitle: '[Research, 30 September 2026] Next: one compiler-validated UEFN file-handoff slice. Near-term proof of compatibility; broader packs and live attach remain gated.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] The infrastructure is real, but engine readiness is not established. The pinned repository contains 17 built-in environment manifests, none dedicated to UEFN/UE6. Types, methods, events, target bindings, host files, version linkage, and refresh machinery exist. Native spawn uses the manifest\'s callExpr and only exposes exec_out. ApiMethodDef has no return-value/effect/generic contract; ApiEventDef has no per-target subscription or lifetime contract. TypeSpec import ignores most decorators and does not translate Verse\'s API digest or semantics automatically. Verse export itself has a concrete conformance concern. The Advanced golden emits <public>Sensor(Machine) := class:, matching verse.base\'s {prefix}{name}{extendsSuffix} := class: template. Epic examples place inheritance after class, as name := class(creative_device):. The emitter\'s ordinary on_* handlers also do not establish a creative_device OnBegin lifecycle. These are source-level mismatches, not an engine compile result. \'Add a pack and drop the output into UEFN\' is therefore a hypothesis to validate, not shipped end-to-end support. Epic now documents UEFN MCP directly: it is built in, beta, and supports Verse file operations/compilation, devices, Scene Graph, and sessions. UEFN sessions are Play-in-Client, not PIE. UE 5.8\'s official MCP documentation additionally says non-loopback Origin headers are rejected, no authentication is provided, and calls execute serially on the game thread. This invalidates a casual Pages-to-localhost fetch design; UEFN\'s exact origin behavior still deserves its own test.',
    constraints: [
      'Pages remains usable without an engine, account, server or MCP. VVS generates source and does not execute gameplay.',
      'Canvas and shared graph schema remain authoritative; host APIs are versioned environment data.',
      'Current UEFN, UE5 and future UE6 are distinct contracts. Never invent UE6 APIs or assume Pages may call an unauthenticated localhost endpoint.',
      'File handoff does not require arbitrary Verse reverse import. Generated-source drift needs its own protection.',
    ],
    options: [
      {
        id: 'packs-only',
        title: 'Curated UEFN pack plus file handoff',
        verdict: 'ship',
        summary: 'Smallest dependency surface and fully compatible with static Pages. Hand-author a tiny versioned API subset; external UEFN handles compilation. Requires correct Verse shells, imports, lifecycle, paths, and clear generated-file ownership.',
        how: 'Development / maintenance gate: Verse shells, lifecycle and ownership must pass an external compiler.',
        pros: [
          'Small file-handoff scope works with static Pages.',
        ],
        cons: [
          'Verse shells, lifecycle and ownership must pass an external compiler.',
        ],
      },
      {
        id: 'live-editor-bridge',
        title: 'Optional native/local adapter plus official MCP',
        verdict: 'later',
        summary: 'Preserves the existing canvas and can correlate compile diagnostics with graph/source hashes. Requires user installation/enablement, local-only project-scoped access, tool discovery, serialized calls, and version handling. A VS Code host adapter could be reused. Do not expose the unauthenticated editor endpoint remotely or weaken origin checks.',
        how: 'Development / maintenance gate: Local opt-in, tool discovery, serialization and security/version handling required.',
        pros: [
          'Can return revision-linked external compiler diagnostics.',
        ],
        cons: [
          'Local opt-in, tool discovery, serialization and security/version handling required.',
        ],
      },
      {
        id: 'in-engine-canvas',
        title: 'Editor-embedded same web renderer',
        verdict: 'later',
        summary: 'Useful only if an in-editor authoring window solves an observed workflow need. Reuses graph schema and UI, but adds browser compatibility, native file/clipboard integration, focus, packaging, and editor-version tests. Belongs to the gated native-plugin track.',
        how: 'Development / maintenance gate: Release-era browser, focus, storage, worker and packaging compatibility remain unproven.',
        pros: [
          'Can reuse the existing renderer for genuine native authoring.',
        ],
        cons: [
          'Release-era browser, focus, storage, worker and packaging compatibility remain unproven.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Prioritize a compiler-validated UEFN Verse vertical slice before widening the API catalog. Keep file handoff as the first attach path. A later local host adapter can return external compiler diagnostics; a hosted Pages page must not assume it can call Unreal MCP directly.',
    firstSlice: [
      'Priority: Next: one compiler-validated UEFN file-handoff slice',
      'Dependency: Verse emitter conformance and an available external UEFN compiler for validation',
      'Dependency: A bounded environment contract for imports, lifecycle, native types, returns, and effects before exposing APIs that need them',
      'Dependency: Generated-source ownership and drift policy; shared host-adapter design if local attach is later selected',
      'Next experiment: Specify one version-pinned UEFN fixture: a creative_device with a visible OnBegin declaration and one Print call, plus a tiny helper class to exercise inheritance. Generate from the canvas into a disposable project and have UEFN Build Verse Code validate it. Record exact engine version and diagnostics. Only then add one well-defined native method. Do not start with a whole device catalog, input subsystem, source round-trip, or play-launch control.',
      'Acceptance gate (proposed): Generated imports, inheritance, visibility, and OnBegin signature match the documented target and compile without hand edits',
      'Acceptance gate (proposed): Every behavioral statement and compiler diagnostic maps to the correct graph/node and generated-file revision',
      'Acceptance gate (proposed): Generate preserves the graph as authority, detects externally edited output before replacement, and never overwrites unrelated project files',
      'Acceptance gate (proposed): Pack IDs and API versions are pinned; unsupported targets or unsupported signature features remain explicit',
      'Acceptance gate (proposed): Pages works without accounts, an engine, a server, MCP, or runtime execution',
    ],
    sources: [
      {
        label: 'Pinned manifest schema types',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/environment-templates/src/types.ts',
      },
      {
        label: 'Pinned environment native/event spawn',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/environment-templates/src/expandEnvironmentSymbols.ts',
      },
      {
        label: 'Pinned TypeSpec mapping',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/environment-templates/src/import/fromTypeSpec.ts',
      },
      {
        label: 'Pinned Verse shell templates',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/syntax-packs/src/packs/verse.base.json',
      },
      {
        label: 'Pinned Advanced Verse output',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/test_project_goldens/advanced/verse/_HOME_GRAPH_PREVIEW.txt',
      },
      {
        label: 'Pinned generated-file writer',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/projectFolder/writeGenerated.ts',
      },
      {
        label: 'Epic: UEFN MCP configuration and PIC distinction',
        href: 'https://dev.epicgames.com/documentation/fortnite/uefn-mcp',
      },
      {
        label: 'Epic: Unreal MCP origin/security and serialization limits',
        href: 'https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor',
      },
      {
        label: 'Epic: create and compile a Verse device',
        href: 'https://dev.epicgames.com/documentation/fortnite/create-your-own-device-using-verse-in-unreal-editor-for-fortnite?lang=en-US',
      },
      {
        label: 'Epic: documented Verse device and input example',
        href: 'https://dev.epicgames.com/documentation/fortnite/how-to-add-player-input-in-verse-in-unreal-editor-for-fortnite',
      },
    ],
  },
  {
    id: 'cl014-verse-getinput',
    systemId: 'verse-getinput-cl014',
    title: 'Verse GetInput (CL-014)',
    subtitle: '[Research, 30 September 2026] Next: align unsupported diagnostics with typed placeholders. Partial: typed placeholder shipped; actual blocking text/number read unsupported.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] printGetInputVerse emits Print(prompt), the \'# (x) Get User Input\' marker, and a typed local. Text produces string = ""; number produces float = 0.0. Both cases already have focused tests. The Advanced golden then assigns and prints that placeholder downstream. This is deliberately incomplete behavior, not a read returning an empty user response. The generic nodeEffectiveness function contains no Verse action_get_input branch and defaults to effective. Consequently, the printer\'s honest comment does not by itself prove the canvas or portability checker recognizes the node as unsupported. The card\'s \'just keep goldens and close done-as-stub\' recommendation skips this important end-to-end check. Epic\'s current /Verse.org/Input API includes player_input, GetPlayerInput, input mappings, typed action events, and cancellation. GetPlayerInput is failable and returns a manager, not a string: its signature carries transacts and decides. Epic\'s guide shows adding a mapping, subscribing to an action, matching a tuple payload, storing the returned cancelable, and cleaning up. The older input_trigger_device separately exposes press/release events with agent and duration data. Neither documented route is a general blocking text/number prompt.',
    constraints: [
      'Keep the placed node and source mapping visible; empty string and zero are unsupported placeholders, not successful reads.',
      'No invented Player.GetInput, hidden polling/UI or in-app execution.',
      'Documented gameplay action events and GetPlayerInput are a separate host capability from a synchronous text/number prompt.',
    ],
    options: [
      {
        id: 'keep-stub',
        title: 'Explicit unsupported core input',
        verdict: 'ship',
        summary: 'Lowest-risk immediate choice. Preserve node/source spans and prompt, label its value as a placeholder, and make target diagnostics agree. Retains export continuity but must not count as semantic portability or a functioning interactive example.',
        how: 'Development / maintenance gate: Placeholder output cannot count as working input or portable semantics.',
        pros: [
          'Preserves prompt, node identity and source spans honestly.',
        ],
        cons: [
          'Placeholder output cannot count as working input or portable semantics.',
        ],
      },
      {
        id: 'invent-player-api',
        title: 'Host-specific action-input pack',
        verdict: 'later',
        summary: 'Provides real, documented player interaction now through Input Trigger or the newer per-player Input API. Keep mapping/subscription/cancellation and handler payloads visible on the canvas. Useful for gameplay, but intentionally does not fulfill a free-text input request.',
        how: 'Development / maintenance gate: Different async payload/lifetime contract; does not satisfy free-text GetInput.',
        pros: [
          'Uses documented action-input APIs rather than invented names.',
        ],
        cons: [
          'Different async payload/lifetime contract; does not satisfy free-text GetInput.',
        ],
      },
      {
        id: 'device-pack-input',
        title: 'Explicit authored UI/adapter workflow',
        verdict: 'later',
        summary: 'A user-owned host-specific interaction can eventually deliver data through a visible asynchronous handler and explicit source. This requires a supported concrete UI/data API and much more modeling; reject any approach that hides a keyboard UI, polling loop, or invented runtime behind the synchronous GetInput node.',
        how: 'Development / maintenance gate: Requires a supported UI/data API; hiding it behind synchronous GetInput remains rejected.',
        pros: [
          'A concrete user-authored adapter can make data delivery visible.',
        ],
        cons: [
          'Requires a supported UI/data API; hiding it behind synchronous GetInput remains rejected.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Keep the existing prompt and explicitly unsupported fallback, but close the diagnostic gap before calling fidelity complete. Treat real gameplay action input as a separate, host-specific capability. Do not wait for UE6 or MCP to investigate an API that Epic already documents.',
    firstSlice: [
      'Priority: Next: align unsupported diagnostics with typed placeholders',
      'Dependency: Shared capability diagnostics with COA and node effectiveness',
      'Dependency: Environment pack return/effect/type contracts and honest Bind design',
      'Dependency: External engine compilation for the host-specific sample; no native UE6 plugin dependency',
      'Next experiment: Build a two-part conformance specification. First, run text and number GetInput graphs with wired downstream uses through single-target diagnostics, canvas effectiveness, source mapping, and any strict portability report; record whether each accurately identifies the placeholder. Second, model one documented PressedEvent or Jump action flow on paper against the current environment schema and list the minimal missing return/effect/binding/lifetime fields. Preserve the current printer until that evidence justifies a change.',
      'Acceptance gate (proposed): Text and number fallbacks remain type-correct, visibly unsupported, and source-mapped including wired prompts and downstream uses',
      'Acceptance gate (proposed): Canvas/diagnostic/portability results cannot claim real Verse input merely because generated text exists',
      'Acceptance gate (proposed): A host-specific input sample uses exact documented API names and payloads, explicitly owns registration/cancellation, and compiles in the declared UEFN version',
      'Acceptance gate (proposed): GetPlayerInput failure and mapping activation are represented explicitly when that route is chosen',
      'Acceptance gate (proposed): No fake GetInput/Player.GetInput API, hidden listener list, implicit input runtime, or VVS execution',
    ],
    sources: [
      {
        label: 'Pinned Verse GetInput printer',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/print/printers/getInput.verse.ts',
      },
      {
        label: 'Pinned typed text/number tests',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/getInput.test.ts',
      },
      {
        label: 'Pinned node effectiveness',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/language-profiles/src/nodeEffectiveness.ts#L111-L157',
      },
      {
        label: 'Pinned Advanced placeholder uses',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/test_project_goldens/advanced/verse/_HOME_GRAPH_PREVIEW.txt',
      },
      {
        label: 'Epic: player input semantics',
        href: 'https://dev.epicgames.com/documentation/fortnite/player-input-in-verse-in-unreal-editor-for-fortnite',
      },
      {
        label: 'Epic: GetPlayerInput signature and failure/effects',
        href: 'https://dev.epicgames.com/documentation/fortnite/verse-api/versedotorg/input/getplayerinput',
      },
      {
        label: 'Epic: input mapping, subscription, and cancellation',
        href: 'https://dev.epicgames.com/documentation/fortnite/how-to-add-player-input-in-verse-in-unreal-editor-for-fortnite',
      },
      {
        label: 'Epic: Input Trigger press/release payloads',
        href: 'https://dev.epicgames.com/documentation/fortnite/verse-api/fortnitedotcom/devices/input_trigger_device?lang=en-US',
      },
    ],
  },
  {
    id: 'bind-remaining-langs',
    systemId: 'event-bind-honest',
    title: 'Event Bind: environment contracts before additional languages',
    subtitle: '[Research, 30 September 2026] Next: verify existing host contracts before adding environments. Now: audit the three existing paths; next: one verified environment-specific adapter; later: broader host coverage.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] Current code emits C# target.event += handler, JavaScript target.on(event, handler), or GDScript target.connect(event, handler), defaulting the receiver to this/self. Other languages receive (x). The focused tests verify strings and spawn lists; they do not compile/run complete event producers and subscribers. Declare/On emits ordinary handler methods, and Dispatch calls on_* directly rather than broadcasting. This proves an evidence/contract gap, not a runtime failure executed in this review (B1–B3). The old card incorrectly treats the existing three as language-native and says to wait for a future Verse/standard subscription API. Node\'s .on belongs to EventEmitter; browser EventTarget instead uses addEventListener. Epic already documents subscribable.Subscribe and returned cancelable handles. Godot signals and Qt C++ QObject.connect are also established environment APIs. Language syntax alone is the wrong admission boundary (B4–B8). Registration APIs differ materially: Node EventEmitter permits repeated identical listeners and supplies the emitter as this; Godot normally rejects duplicate callable connections; Verse subscription returns a cancellation object. The current ApiEventDef contains only id, name and parameters, so environment manifests cannot yet express receiver requirements, callback effects, connection result or cancellation behavior (B4–B6, B9).',
    constraints: [
      'Visible registration and teardown only; U100 hidden subscribe/emit and hidden listener lists remain rejected.',
      'Dispatch remains a direct handler call. Do not claim it broadcasts a host event.',
      'Admission depends on language, environment, receiver, callback and lifecycle, not language alone.',
      'Unsupported contexts stay unspawned or honestly (x); do not invent a common runtime to make a target look supported.',
    ],
    options: [
      {
        id: 'leave-unspawned',
        title: 'Verified environment-specific binding',
        verdict: 'ship',
        summary: 'Recommended. Reuse visible receiver, event and callable operands; add typed connection outputs or explicit cancellation operations when the host requires them. Start by checking current Node/Godot/C# contracts, then one Verse host API with exact toolchain evidence.',
        how: 'Development / maintenance gate: Needs receiver, callback, duplicate and teardown evidence for each environment.',
        pros: [
          'Models real registration and cancellation against exact host APIs.',
        ],
        cons: [
          'Needs receiver, callback, duplicate and teardown evidence for each environment.',
        ],
      },
      {
        id: 'inject-helper',
        title: 'Freeze all five remaining languages',
        verdict: 'later',
        summary: 'Safe short-term scope control, but an incorrect permanent technical conclusion. Keep plain-language contexts blocked until a real adapter exists; do not imply Python/C++/Rust/Go/Verse must gain new language syntax.',
        how: 'Development / maintenance gate: A temporary freeze is not proof that other languages can never support Bind.',
        pros: [
          'Scope control keeps unverified contexts honest.',
        ],
        cons: [
          'A temporary freeze is not proof that other languages can never support Bind.',
        ],
      },
      {
        id: 'per-lang-if-epic-or-std',
        title: 'Generic native-call representation or common runtime',
        verdict: 'later',
        summary: 'An explicit typed native Call can be a useful escape hatch where event semantics are not yet modeled. A universal bus would add dependencies and different dispatch/lifetime behavior; it needs a separately approved visible runtime design and is unsuitable as an invisible printer fix.',
        how: 'Development / maintenance gate: A hidden common bus remains rejected; any visible runtime would need separate product approval.',
        pros: [
          'A visible typed native Call can cover an API before dedicated Bind modeling.',
        ],
        cons: [
          'A hidden common bus remains rejected; any visible runtime would need separate product approval.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Replace the language-only definition of Bind with an explicit language + environment + receiver/event contract. Verify C#, JavaScript and GDScript end to end before expanding. A Verse Subscribe pilot is technically justified today, conditional on an available official validation environment; no hidden VVS bus is needed.',
    firstSlice: [
      'Priority: Next: verify existing host contracts before adding environments',
      'Dependency: Extend environment event signatures with per-target registration, receiver and lifecycle semantics',
      'Dependency: Capability-aware spawn/diagnostics using the same contract as emission and COA',
      'Dependency: Independent host fixtures; reverse recognition only after bindings resolve to the verified API',
      'Next experiment: Build complete trusted fixtures with a real event source, two distinguishable callbacks, registration, host-triggered delivery and teardown for the existing three paths. Include a plain JavaScript class without EventEmitter as a negative case. Separately specify one UEFN device-event Subscribe/Cancel mapping against official signatures; keep it unvalidated if the official compiler/runtime is unavailable.',
      'Acceptance gate (proposed): Missing receiver capability, missing declared/native event and incompatible callback signature block acceptance/export with precise diagnostics.',
      'Acceptance gate (proposed): Observe callback arguments, order, receiver identity, duplicate registration and removal using each host\'s declared semantics; do not silently normalize differences.',
      'Acceptance gate (proposed): Prove an explicit Dispatch direct-call remains distinguishable from triggering the host event. A Bind must not falsely imply Dispatch broadcasts.',
      'Acceptance gate (proposed): Subscription handles, cancellation and any required imports/base types remain visible and survive save/load. Unsupported target changes cannot leave apparently effective Bind nodes.',
      'Acceptance gate (proposed): Full-file compiler/runtime fixtures pass for admitted environments; string snapshots alone cannot promote the support state.',
    ],
    sources: [
      {
        label: 'B1 — Bind printer and receiver defaults',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/print/stmt.ts#L249-L266',
      },
      {
        label: 'B2 — Existing tests assert registration strings',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/eventBind.test.ts',
      },
      {
        label: 'B3 — Event declarations emit ordinary handlers',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/transpiler/src/emit/members.ts#L513-L537',
      },
      {
        label: 'B4 — Node EventEmitter: registration, receiver, delivery order and duplicates',
        href: 'https://nodejs.org/api/events.html',
      },
      {
        label: 'B5 — Godot Signal connection and lifetime rules',
        href: 'https://docs.godotengine.org/en/stable/classes/class_signal.html',
      },
      {
        label: 'B6 — Epic official device Subscribe and Cancel examples',
        href: 'https://dev.epicgames.com/documentation/fortnite/coding-device-interactions-in-verse?lang=en-US',
      },
      {
        label: 'B7 — Browser EventTarget API',
        href: 'https://dom.spec.whatwg.org/#interface-eventtarget',
      },
      {
        label: 'B8 — Qt QObject connect/disconnect and receiver context',
        href: 'https://doc.qt.io/qt-6/qobject.html',
      },
      {
        label: 'B9 — Current environment event schema lacks binding lifecycle fields',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/environment-templates/src/types.ts#L18-L42',
      },
      {
        label: 'B10 — C# event subscription, handler signatures and unsubscription',
        href: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/how-to-subscribe-to-and-unsubscribe-from-events',
      },
      {
        label: 'B11 — Verse cancelable interface',
        href: 'https://dev.epicgames.com/documentation/fortnite/verse-api/versedotorg/verse/cancelable',
      },
      {
        label: 'B12 — Current JS direct-dispatch and .on templates',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/syntax-packs/src/packs/javascript.base.json#L43-L50',
      },
      {
        label: 'B13 — Go signal notifications use channels',
        href: 'https://pkg.go.dev/os/signal#Notify',
      },
      {
        label: 'B14 — Python Future callback scheduling',
        href: 'https://docs.python.org/3/library/asyncio-future.html#asyncio.Future.add_done_callback',
      },
    ],
  },
  {
    id: 'library-u90-auth',
    systemId: 'library-backend',
    title: 'Library U90: trusted community consumption after read-only catalogs',
    subtitle: '[Research, 30 September 2026] Parallel: harden read-only catalogs; reviewed installation later. Read-only catalog browsing shipped; automatic installation and community publishing workflow open; auth/upload frozen.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] PR8 already includes catalog/vvs-catalog.json, fetchPublicGitCatalog, useGitCatalog and LibraryView wiring. The client requests a static JSON index from raw.githubusercontent.com, requires schemaVersion 1, caps assets at 200, validates basic fields/URL host patterns and rejects text longer than 500,000 characters after downloading it. Repository preferences live in localStorage; fetched catalog contents live in React state. The checked-in index contains one first-party core-registry entry. Cards open asset.repoUrl; they do not fetch or install asset.manifestUrl. The default index and sample manifest use moving main refs. The contract lacks required immutable revision, content digest, compatibility, license and complete per-pack validation. Existing catalog tests check the example and a few malformed URLs, not safe consumption. Mock community assets in libraryCatalog.ts do not demonstrate real third-party publishing. Concrete robustness gaps from code inspection: the response-size guard occurs after response.text(), persisted repo objects are only array-checked, and custom IDs concatenate owner-repo with a hyphen, allowing collisions between different owner/repo pairs. These are bounded read-only improvements, not reasons to build auth.',
    constraints: [
      'No VVS accounts or dedicated app server; auth/upload remain frozen.',
      'Reuse shipped static public catalogs and source links. Browsing an index is not cloning or installing a pack.',
      'An immutable digest proves identity, not safety. Initial consumption must be data-only, bounded, reviewed and cancelable.',
      'No executable pack hooks, arbitrary dependency loading or unsafe output paths.',
    ],
    options: [
      {
        id: 'git-catalog',
        title: 'Publisher-owned static catalogs with optional curation',
        verdict: 'ship',
        summary: 'Preserves today\'s Pages path and scales contributions without VVS accounts. Publishers maintain their own repository and schema; maintainers optionally review links into a curated index. Tradeoffs are authoring friction, discoverability, dead links and the fact that a public repository or claimed author field is not a safety endorsement. Central-curation alternative: Makes reviews, compatibility fixtures and removal policy consistent, using ordinary PRs and CI. It also creates a maintainer bottleneck and release responsibility. A dedicated repository is an organizational choice, not a technical prerequisite: the existing VVS-Web catalog can prove the process first.',
        how: 'Development / maintenance gate: Publishers and curators still own compatibility, dead links and review policy.',
        pros: [
          'Reuses public repository catalogs without product accounts.',
        ],
        cons: [
          'Publishers and curators still own compatibility, dead links and review policy.',
        ],
      },
      {
        id: 'vvs-accounts-upload',
        title: 'Immutable release bundles or commit-pinned manifests',
        verdict: 'later',
        summary: 'A content digest plus resolved commit makes an accepted import reproducible. GitHub immutable releases can additionally protect release tags/assets and provide attestations. Browser download/CORS and archive handling require testing; checksums and provenance establish identity, not benign contents. Keep dependencies, scripts, dynamic module loading and arbitrary executables out of the initial pack format.',
        how: 'Development / maintenance gate: CORS, archive safety and complete pack validation require testing; provenance is not safety.',
        pros: [
          'Pinned revisions and digests make reviewed imports reproducible.',
        ],
        cons: [
          'CORS, archive safety and complete pack validation require testing; provenance is not safety.',
        ],
      },
      {
        id: 'stay-frozen',
        title: 'Leave automatic install deferred',
        verdict: 'later',
        summary: 'Read-only links remain useful without a trust-sensitive installer. Add clear \'View source\' language and contribution instructions. A hosted upload store might reduce publishing clicks, but accounts, moderation and server operation conflict with the current product locks and should remain rejected.',
        how: 'Development / maintenance gate: Contribution friction remains; accounts/upload are still outside the product direction.',
        pros: [
          'Read-only source links remain useful while installation is gated.',
        ],
        cons: [
          'Contribution friction remains; accounts/upload are still outside the product direction.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Do not rebuild catalog listing or reopen accounts. First harden the existing read-only contract and search integration. Then prove one narrowly supported, reviewed pack import using immutable provenance and a preview. Prefer publisher-owned public repositories plus an optional curated index; defer a separate vvs-library service/repository until actual contributors justify it.',
    firstSlice: [
      'Priority: Parallel: harden read-only catalogs; reviewed installation later',
      'Dependency: Precisely define which pack types current editor APIs can consume and their compatibility/migration contracts',
      'Dependency: Choose license and maintainer-review requirements plus update/removal policy; avoid implying \'verified safe\'',
      'Dependency: Run contributor validation with unprivileged CI, pinned tools and no untrusted pack scripts; keep auth and upload frozen',
      'Next experiment: Use the existing index with two reviewed fixture repositories representing distinct supported pack types. Define a versioned manifest and validate it in CI and the browser. Trial only one installable type first, preferably data-only node metadata or a bounded environment template. Show source repository, resolved revision, license, compatibility and exact project diff; import into a new project/copy rather than silently replacing current content. Keep public catalog fetching usable without this experiment.',
      'Acceptance gate (proposed): Malformed/stored entries, duplicate asset IDs, colliding repository names, missing indexes, unsupported schemas and one stalled repository cannot break all catalogs',
      'Acceptance gate (proposed): Fetch timeout, byte/depth/string/asset limits and redirect/host policy reject excessive input before unbounded allocation; cached content is explicitly marked stale',
      'Acceptance gate (proposed): Accepted imports record resolved revision and digest; upstream main changes never silently alter an installed project',
      'Acceptance gate (proposed): Unsupported pack types, external dependencies, executable extensions and unsafe output paths are rejected before materialization',
      'Acceptance gate (proposed): One realistic contributor can publish a valid pack through documented PR/CI steps; a rejected or cancelled preview leaves the project unchanged',
    ],
    sources: [
      {
        label: 'Pinned catalog validation and fetch',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/gitCatalog.ts#L1-L71',
      },
      {
        label: 'Pinned repository preferences and fetch lifecycle',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/hooks/useGitCatalog.ts',
      },
      {
        label: 'Pinned read-only asset links',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/components/views/LibraryView.tsx#L413-L424',
      },
      {
        label: 'Pinned one-entry first-party index',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/catalog/vvs-catalog.json',
      },
      {
        label: 'Pinned existing catalog tests',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/gitCatalog.test.ts',
      },
      {
        label: 'GitHub immutable releases',
        href: 'https://docs.github.com/en/code-security/concepts/supply-chain-security/immutable-releases',
      },
      {
        label: 'GitHub provenance limitations and verification',
        href: 'https://docs.github.com/en/actions/concepts/security/artifact-attestations',
      },
      {
        label: 'GitHub Actions untrusted-PR security guidance',
        href: 'https://docs.github.com/en/actions/reference/security/secure-use',
      },
      {
        label: 'GitHub public content and explicit ref API',
        href: 'https://docs.github.com/en/rest/repos/contents',
      },
    ],
  },
  {
    id: 'search-embeddings',
    systemId: 'search',
    title: 'Library search: fix coverage, evaluate lexical ranking, gate local semantics',
    subtitle: '[Research, 30 September 2026] Parallel: fix asset-level lexical search before model experiments. Token search and chips shipped; catalog-search inconsistency actionable; embeddings unproven.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] librarySearch.ts lowercases and splits queries using an ASCII-oriented expression retaining . + # and hyphens, then requires every token to appear as a substring in a combined haystack. It does not rank, stem, normalize language aliases or perform embeddings. Querying only non-Latin letters can produce zero tokens and therefore match everything. Language chips use default/supported target IDs; display labels are not a comprehensive query-alias layer. LibraryView has a more immediate discoverability problem: it first filters repository cards using repository name/description/owner/repo, then filters their fetched assets using the whole query as a substring of title/description/tags. A matching asset can disappear because its parent repository metadata does not match. Multiword order and punctuation also behave differently between templates, repositories and assets. Existing unit tests cover helper behavior, not this nested UI contract. The installed model/runtime is absent from apps/web dependencies. The card\'s approximately 23 MB MiniLM claim corresponds to one quantized ONNX file, not the whole downloadable/runtime footprint. Tokenizer/config, JavaScript, WASM, cache and memory costs remain. First-party templates are a small, documented 17-pack corpus; there is no measured evidence that embeddings outperform improved metadata and lexical retrieval here.',
    constraints: [
      'Immediate lexical search and language/type filters remain available without a model or account.',
      'Reject a required hosted search service; local similarity never overrides compatibility constraints.',
      'Model opt-in, cancellation, offline fallback and total download/memory measurements are prerequisites, not measured successes.',
      'Use realistic relevance judgments. No invented benchmark, fixed model-footprint claim or multilingual guarantee.',
    ],
    options: [
      {
        id: 'token-is-the-product',
        title: 'Small deterministic lexical ranker',
        verdict: 'ship',
        summary: 'Unify templates, fetched assets and installed items into searchable records with stable IDs, field weights and explicit language aliases. Rank exact ID/title, then token/prefix matches; constrain typo handling for identifiers such as C++, C# and Go. Easy to explain and test, but synonym coverage requires curated metadata and relevance tuning.',
        how: 'Development / maintenance gate: Curated metadata and held-out relevance testing remain necessary.',
        pros: [
          'Deterministic asset-level ranking can fix current coverage and alias issues.',
        ],
        cons: [
          'Curated metadata and held-out relevance testing remain necessary.',
        ],
      },
      {
        id: 'hosted-vector',
        title: 'MiniSearch or fuzzy matching library',
        verdict: 'later',
        summary: 'MiniSearch supplies local indexing, field boosts, prefix/fuzzy matching and scored results; Fuse is a plausible fuzzy-substring alternative for small lists. Neither is semantic understanding. Dependency/bundle and tokenizer behavior must be measured. Configure term-combination behavior explicitly so adopting a library does not silently change AND to OR.',
        how: 'Development / maintenance gate: Measure bundle/tokenizer behavior and preserve the explicit token/filter contract.',
        pros: [
          'MiniSearch/Fuse offer established local ranking and fuzzy-match tools.',
        ],
        cons: [
          'Measure bundle/tokenizer behavior and preserve the explicit token/filter contract.',
        ],
      },
      {
        id: 'local-minilm',
        title: 'Opt-in local hybrid embeddings',
        verdict: 'later',
        summary: 'Precompute public-catalog vectors during publishing, embed the query locally in a Worker, and combine with lexical candidates. At this scale brute-force similarity is enough; no vector database is required. Model identity, tokenizer/pooling/normalization and catalog digest must match. Local/private additions need local embeddings. Similarity cannot override language/type compatibility or prove a template can perform a task.',
        how: 'Development / maintenance gate: Version model/index/preprocessing together; quantify total bytes, latency, false positives and memory.',
        pros: [
          'Opt-in local hybrid retrieval may help demonstrated conceptual misses.',
        ],
        cons: [
          'Version model/index/preprocessing together; quantify total bytes, latency, false positives and memory.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Prioritize one consistent asset-level search contract and relevance tests now. Compare a small custom lexical ranker with MiniSearch before adding a model. Keep embeddings as an optional, measured hybrid retrieval experiment; reject a required hosted vector service. The decision should follow demonstrated missed queries, not the word \'semantic\' on the roadmap.',
    firstSlice: [
      'Priority: Parallel: fix asset-level lexical search before model experiments',
      'Dependency: Stable catalog asset identity, shared metadata/aliases and reproducible relevance judgments',
      'Dependency: Decide whether multilingual search is required; English MiniLM is not a multilingual guarantee',
      'Dependency: Version model, preprocessing and vector index together; cache invalidation and Pages basePath-aware Worker/model URLs',
      'Next experiment: Create 50 labeled queries against the actual current catalog: exact names/IDs, language aliases, typos, reordered tokens, non-Latin input, asset-only matches, conceptual phrases and deliberate no-match cases. Compare current behavior, normalized lexical ranking and MiniSearch; reserve held-out queries. Trial MiniLM only if meaningful conceptual misses remain. Use a pinned model/runtime and same-origin model plus WASM assets, with remote loading disabled; test cold, cached, offline, denied WebGPU and storage-eviction states.',
      'Acceptance gate (proposed): All asset-only queries surface their repository or asset; templates, catalogs and installed records obey one documented token/filter contract',
      'Acceptance gate (proposed): Exact IDs/names and C++/cpp, C#/csharp, JS/JavaScript cases rank correctly; incompatible language/type filters never leak results; no-token input is handled honestly',
      'Acceptance gate (proposed): Proposed lexical gate: p95 query work below 50 ms at 1,000 realistic records on a named low-end reference device; benchmark before claiming it',
      'Acceptance gate (proposed): Optional semantic gate: at least 10 percentage-point Recall@5 improvement on held-out conceptual queries with no exact-match regressions; report false positives and no-match behavior',
      'Acceptance gate (proposed): No model request before opt-in, immediate usable lexical results, cancellation and fallback on inference failure; publish measured total bytes, cold/warm latency and peak memory',
    ],
    sources: [
      {
        label: 'Pinned lexical matching and language helpers',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/librarySearch.ts',
      },
      {
        label: 'Pinned parent-repository filter',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/components/views/LibraryView.tsx#L93-L96',
      },
      {
        label: 'Pinned child-asset substring filter',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/components/views/LibraryView.tsx#L416-L424',
      },
      {
        label: 'Pinned existing search tests',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/librarySearch.test.ts',
      },
      {
        label: 'MiniSearch ranking and search options',
        href: 'https://lucaong.github.io/minisearch/classes/MiniSearch.MiniSearch.html',
      },
      {
        label: 'MiniSearch fuzzy/prefix/field controls',
        href: 'https://lucaong.github.io/minisearch/types/MiniSearch.SearchOptions.html',
      },
      {
        label: 'Fuse project documentation',
        href: 'https://www.fusejs.io/',
      },
      {
        label: 'MiniLM original model card, dimensions, pooling and language',
        href: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2',
      },
      {
        label: 'Quantized ONNX file size and digest',
        href: 'https://huggingface.co/Xenova/all-MiniLM-L6-v2/blob/main/onnx/model_quantized.onnx',
      },
      {
        label: 'Transformers.js pinned custom assets and remote-disable settings',
        href: 'https://huggingface.co/docs/transformers.js/v3.8.1/en/custom_usage',
      },
      {
        label: 'Transformers.js WebGPU configuration',
        href: 'https://huggingface.co/docs/transformers.js/v3.8.1/en/guides/webgpu',
      },
      {
        label: 'ONNX Runtime browser performance diagnosis',
        href: 'https://onnxruntime.ai/docs/tutorials/web/performance-diagnosis.html',
      },
    ],
  },
  {
    id: 'mobile-gestures-radial',
    systemId: 'mobile',
    title: 'Touch gestures and radial menus',
    subtitle: '[Research, 30 September 2026] Parallel: reproduce touch correctness gaps before new gestures. Partially implemented; prioritize basic touch correctness and discoverability, defer radial interaction.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] The code already distinguishes narrow viewports from coarse primary pointers, sets a 40px connection snap radius versus 20px for mouse, and uses 44px TopNav controls. GraphCanvas relies on React Flow with panOnDrag=[1,2], selectionOnDrag and no touch-specific selection mode. React Flow documents pinch zoom and tap-to-connect as enabled defaults; VVS does not override them. Consequently, \'implement pinch zoom\' is the wrong starting task. Verify how those defaults interact with VVS\'s desktop-oriented overrides on actual devices. There are concrete gaps beyond menu appearance. GraphCanvas\'s unsuccessful connection-end handler reads event.touches[0]; a touchend with no remaining contact can supply no entry there. MDN identifies changedTouches as the released contacts. This is a code-level risk to reproduce, not a claimed hardware-tested crash. The 40px connection radius is magnetic drop tolerance, not proof that pins or help icons have adequate tappable areas. The pointer media query describes the primary device, so it is insufficient alone to decide how every touch on a mouse-and-touch laptop should behave. The existing spawn menu is NodeContextMenu, reached from pane context-menu and Add node actions. Space now focuses node search, as useGraphKeyboardShortcuts explicitly states; the research card\'s repeated \'Space spawn\' description is stale. Reuse the catalog, filtering, handleAddNode and graphWiring path rather than introducing gesture-specific node creation.',
    constraints: [
      'Preserve mouse/keyboard behavior and browser scrolling outside the canvas.',
      'Visible single-pointer controls remain available; long-press is optional and radial menus remain evidence-gated.',
      'Reuse the existing catalog and mutation rules; do not create a gesture-specific editor.',
      'Coarse primary pointer and magnetic connection radius do not prove all touch inputs or actual target boxes are accessible.',
    ],
    options: [
      {
        id: 'keep-hit-targets',
        title: 'Visible Add + existing catalog; built-in viewport gestures',
        verdict: 'ship',
        summary: 'Recommended first slice. Discoverable, supports single-pointer use, preserves one semantic path and can anchor a menu above the soft keyboard. Requires deliberate pan/select mode and usable controls, not just a smaller desktop layout.',
        how: 'Development / maintenance gate: Requires actual-device pan/select/focus and target-box checks.',
        pros: [
          'Visible Add and existing controls support discoverable single-pointer editing.',
        ],
        cons: [
          'Requires actual-device pan/select/focus and target-box checks.',
        ],
      },
      {
        id: 'radial-everywhere',
        title: 'Long-press empty pane',
        verdict: 'later',
        summary: 'Useful secondary accelerator. Cancel on movement, second contact, pointer cancellation, focus loss or a node/handle/input target. Browser context-menu and pan conflicts must be measured; it must never be the only spawn route.',
        how: 'Development / maintenance gate: Must handle movement, second contact, cancellation and browser-menu conflicts.',
        pros: [
          'Cancelable long-press can accelerate experienced users.',
        ],
        cons: [
          'Must handle movement, second contact, cancellation and browser-menu conflicts.',
        ],
      },
      {
        id: 'coarse-long-press-spawn',
        title: 'Radial quick actions',
        verdict: 'later',
        summary: 'Defer, rather than dismiss as inherently wrong. A small stable set of frequent actions might help expert pen users; a full searchable node catalog is a poor radial fit. It adds directional precision, edge clipping, labeling and keyboard-equivalence work.',
        how: 'Development / maintenance gate: Directional precision, clipping, labels and keyboard alternatives need comparative evidence.',
        pros: [
          'A small stable action set may help pen users.',
        ],
        cons: [
          'Directional precision, clipping, labels and keyboard alternatives need comparative evidence.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Make a complete, testable touch workflow using the existing spawn catalog and editing rules. First audit and repair touch-end, pan/selection, tap-to-connect and visible controls. Treat long-press as an optional shortcut. A radial menu needs evidence that it improves task completion enough to justify its interaction and accessibility cost.',
    firstSlice: [
      'Priority: Parallel: reproduce touch correctness gaps before new gestures',
      'Dependency: Reuse the existing graph command path; a wholesale shared-editor extraction is not required for the initial input audit',
      'Dependency: Before gestures add new edit implementations, centralize any duplicated mutation rules; keep touch-action scoped to the canvas and preserve scrolling elsewhere',
      'Next experiment: Instrument one existing graph fixture on Android Chrome, iPad Safari and a hybrid touch/mouse device. Compare visible Add alone with Add plus a cancelable long-press, keeping graph creation identical. Exercise spawn, connect, rewire, move, select, undo and zoom; record completion, accidental actions and recovery. End the experiment with an explicit supported interaction map and reproducible failures, not a blanket \'mobile supported\' badge.',
      'Acceptance gate (proposed): Ending or canceling a wire gesture with zero active touches never throws or creates an unintended node; two-finger gestures never trigger spawn or undo',
      'Acceptance gate (proposed): Pinch and pan leave selection intact; tap-to-connect obeys the same compatibility and rewiring rules as mouse connections',
      'Acceptance gate (proposed): Spawn, zoom and moving nodes have discoverable single-pointer alternatives; keyboard operation remains available separately',
      'Acceptance gate (proposed): Audit actual target boxes and spacing against WCAG 2.5.8\'s 24px minimum/exceptions; use larger comfortable touch controls where practical',
      'Acceptance gate (proposed): No desktop right-click, middle/right drag, keyboard search, history or soft-keyboard focus regression',
    ],
    sources: [
      {
        label: 'GraphCanvas: connection end and desktop interaction props',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/components/graph/GraphCanvas.tsx#L743-L795',
      },
      {
        label: 'GraphCanvas: React Flow configuration',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/components/graph/GraphCanvas.tsx#L2541-L2615',
      },
      {
        label: 'Mobile sizing and pointer helpers',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/mobileViewport.ts',
      },
      {
        label: 'Current keyboard contract',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/hooks/useGraphKeyboardShortcuts.ts',
      },
      {
        label: 'React Flow interaction defaults',
        href: 'https://reactflow.dev/api-reference/react-flow#interaction-props',
      },
      {
        label: 'React Flow touch connection example',
        href: 'https://reactflow.dev/examples/interaction/touch-device',
      },
      {
        label: 'MDN changedTouches',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/TouchEvent/changedTouches',
      },
      {
        label: 'MDN primary pointer media feature',
        href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/pointer',
      },
      {
        label: 'WCAG pointer gesture alternatives',
        href: 'https://www.w3.org/WAI/WCAG22/Understanding/pointer-gestures.html',
      },
      {
        label: 'WCAG dragging alternatives',
        href: 'https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html',
      },
      {
        label: 'WCAG target size minimum',
        href: 'https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html',
      },
    ],
  },
  {
    id: 'reveal-in-explorer',
    systemId: 'folder-os-path',
    title: 'Reveal in Explorer / Finder',
    subtitle: '[Research, 30 September 2026] Parallel after native document/root identity is correct. Browser OS reveal remains unsupported; existing native extension makes a bounded host-specific implementation feasible.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] The browser uses showDirectoryPicker and FileSystemDirectoryHandle. ProjectFolderContext stores a handle and display label, not an absolute OS path. The project\'s virtual output tree is derived from graph/integration metadata and emitted file paths. FileSystemDirectoryHandle.resolve returns segments relative to an already-held parent, or null if the entry is outside it. Neither a handle name nor those segments establish C:\\\\... or /Users/...; a virtual output path also does not prove that the file has been generated onto disk. The original platform constraint remains sound, but \'a native shell is a different future product\' now misses code already in the repository. apps/vscode owns workspace URIs and reads/writes through workspace.fs. Its Show generated source command navigates to a text range; it does not reveal the file in Finder or Windows Explorer. A small capability-gated command can be added to that host without changing hosted Pages or adding a wrapper. Distinguish the IDE\'s Explorer tree from the operating system\'s file manager. Current VS Code source implements revealFileInOS in its desktop layer, while revealInExplorer works on workspace resources. A remote URI can refer to a machine other than the user\'s desktop; uri.fsPath is not evidence that Finder can open it. Current upstream has a special WSL conversion, but that must not be generalized to SSH/Codespaces or assumed available at VVS\'s minimum engine version.',
    constraints: [
      'Browser handles and relative paths are not absolute OS paths; never invent a location from handle.name.',
      'Pages remains useful without native installation, extra path disclosure or broader filesystem access.',
      'Distinguish IDE Explorer from OS file-manager reveal. Remote workspace URIs are not automatically local paths.',
      'Candidate: a helper, shell wrapper or protocol-URL workaround solely for reveal - Rejected. Reason: it adds trust/lifecycle costs without establishing browser file identity.',
    ],
    options: [
      {
        id: 'honest-unavailable',
        title: 'Capability-based native command',
        verdict: 'ship',
        summary: 'Best actual reveal route now. Resolve the initiating graph/project URI, check command availability and resource scheme, then use the host\'s command. Remote and virtual workspaces get IDE Explorer/open-file behavior. This is small integration work, not full native-canvas parity.',
        how: 'Development / maintenance gate: Check scheme, initiating root and command availability; remote URIs need honest fallback.',
        pros: [
          'The existing extension already has resource identity and host commands.',
        ],
        cons: [
          'Check scheme, initiating root and command availability; remote URIs need honest fallback.',
        ],
      },
      {
        id: 'native-shell',
        title: 'Browser relative-location affordance',
        verdict: 'ship',
        summary: 'Small, portable improvement: folder display name plus .vvs-relative or generated-output path, with Copy relative path. It helps locate files manually and needs no new privileges. Name it accurately; it is not OS reveal.',
        how: 'Development / maintenance gate: Relative location is not OS reveal, and planned output is not necessarily on disk.',
        pros: [
          'Browser-relative breadcrumbs help locate files without new privileges.',
        ],
        cons: [
          'Relative location is not OS reveal, and planned output is not necessarily on disk.',
        ],
      },
      {
        id: 'relative-breadcrumb',
        title: 'Helper, shell wrapper or file/protocol URL workaround',
        verdict: 'reject',
        summary: 'Reason: a helper or URI scheme adds trust and lifecycle costs without giving a browser an absolute-path identity; the existing native host provides a bounded route.',
        how: '',
        pros: [
        ],
        cons: [
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Split the feature by host capability. Pages can show and copy project-relative locations with honest labels. The existing VS Code extension can offer Reveal in IDE Explorer everywhere supported, and OS reveal for verified local-file resources. Do not introduce Electron, a localhost bridge or a custom protocol solely to satisfy this card.',
    firstSlice: [
      'Priority: Parallel after native document/root identity is correct',
      'Dependency: Correct URI/project identity in the VS Code command boundary; no dependency on collaboration or full shared canvas',
      'Dependency: Source-map freshness is required only when revealing a node\'s generated output; direct graph-file reveal can use the document URI immediately',
      'Next experiment: Use one graph file and one generated output in the existing VS Code extension. Prove distinct actions for IDE Explorer and OS file manager on Windows, macOS and Linux, then verify explicit fallback on an SSH/virtual workspace. In Pages, prototype the same file\'s relative breadcrumb, distinguishing saved files from planned output. No writes or generated-code execution are needed for this experiment.',
      'Acceptance gate (proposed): Local reveal selects the intended file or reports a missing/deleted file; never silently opens a same-named file elsewhere',
      'Acceptance gate (proposed): Multi-root selection is derived from the initiating document, not the first workspace folder',
      'Acceptance gate (proposed): Remote/Codespaces resources never get converted into guessed local paths; fallback label states IDE Explorer',
      'Acceptance gate (proposed): Duplicate folder display names remain visibly relative; permission loss, moved files and resolve(null) have an honest recovery path',
      'Acceptance gate (proposed): The browser remains fully usable without native installation; no extra path disclosure, source upload or broad filesystem grant',
    ],
    sources: [
      {
        label: 'Browser folder handle context',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/contexts/ProjectFolderContext.tsx',
      },
      {
        label: 'Browser folder picker and filesystem helpers',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/projectFolder/fsAccess.ts',
      },
      {
        label: 'Virtual project paths',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/hooks/useProjectFolderPaths.ts',
      },
      {
        label: 'Existing native source navigation',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/src/extension.ts#L164-L185',
      },
      {
        label: 'URI-based workspace loader',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/src/workspaceProject.ts',
      },
      {
        label: 'MDN directory-relative resolve contract',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryHandle/resolve',
      },
      {
        label: 'MDN FileSystemHandle capabilities',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/FileSystemHandle',
      },
      {
        label: 'VS Code native reveal implementation',
        href: 'https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/files/electron-browser/fileCommands.ts',
      },
      {
        label: 'VS Code OS reveal command registration',
        href: 'https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/files/electron-browser/fileActions.contribution.ts',
      },
      {
        label: 'VS Code IDE Explorer command implementation',
        href: 'https://github.com/microsoft/vscode/blob/main/src/vs/workbench/contrib/files/browser/fileCommands.ts',
      },
      {
        label: 'VS Code virtual-workspace URI guidance',
        href: 'https://code.visualstudio.com/api/extension-guides/web-extensions',
      },
    ],
  },
  {
    id: 'vscode-native-plugin',
    systemId: 'vscode-native-plugin',
    title: 'Native VS Code plugin',
    subtitle: '[Research, 30 September 2026] Next after revision-safe persistence and the small shared edit seam. Editable native prototype exists; correctness hardening precedes coverage expansion or distribution claims.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] This is no longer a hypothetical read-only spike. apps/vscode registers a CustomTextEditorProvider for *.graph.json, renders a local HTML/SVG canvas, adds Branch/Print/Math Add, moves nodes, changes inline values and connects pins. Whole-document WorkspaceEdits feed VS Code\'s text document, giving it a real save/undo model. Generate uses @vvs/transpiler, and the loader normalizes the manifest, graph/symbol files and custom packs. It also links docs and generated source. No Next bundle or production iframe is involved. Generate currently calls workspace.fs.readFile for project inputs. It therefore ignores unsaved graph/symbol/manifest buffers; the README explicitly instructs saving before Generate. The webview calls generate without its document URI, and root selection consults activeTextEditor then falls back to the first workspace folder. That is a multi-root correctness risk. lastMap/lastRoot are process-global and not invalidated by subsequent graph edits, so source navigation lacks project/document/revision identity. These are static-code findings, not reproduced integration failures. Graph edits also diverge: the extension accepts identical pin.type strings and replaces a target input, whereas web graphWiring validates typeRef compatibility/cycles and prunes execution-output rewires. Sharing packages does not yet mean sharing legal editing semantics. The extension is Node-host-only in its manifest, uses retainContextWhenHidden, and has no test script or dedicated job in the inspected CI workflow. It is a useful prototype, not demonstrated browser-host/Codespaces coverage or published Marketplace availability.',
    constraints: [
      'Build on the existing CustomTextEditor and .vvs manifest/graph/symbol files; generated source is not the authoritative document.',
      'Keep Pages, local editing and ordinary source export independent of accounts, MCP and extension installation.',
      'No Play, runtime execution, iframe of production Pages or model-synthesized graph as a shortcut to native correctness.',
      'Retain a restricted editor/JSON fallback until command parity and extension-host evidence exist; a packaging script is not Marketplace readiness.',
    ],
    options: [
      {
        id: 'thin-open-external',
        title: 'Harden the present limited editor',
        verdict: 'ship',
        summary: 'Fastest route to trustworthy value: preserve its restricted editing set and JSON fallback while fixing snapshots, roots, invalid JSON handling and source-map identity. A project-scoped Save and Generate guard is a smaller transitional fix, but cancellation must stop generation and unrelated files must not be saved.',
        how: 'Development / maintenance gate: Dirty inputs/outputs, async versions and multi-root identity need integration tests.',
        pros: [
          'Hardens useful existing native editing without broadening its node set.',
        ],
        cons: [
          'Dirty inputs/outputs, async versions and multi-root identity need integration tests.',
        ],
      },
      {
        id: 'iframe-live-pages',
        title: 'Shared headless commands, then optional shared canvas',
        verdict: 'later',
        summary: 'Recommended architecture. Extract pure validation/mutation for the existing operations with explicit policy and deterministic results; browser history and VS Code WorkspaceEdit remain host adapters. Broader UI reuse can follow a separate bundle/CSP/state-restoration spike. Do not move the entire Next app first.',
        how: 'Development / maintenance gate: Keep renderers/history outside the core; full canvas reuse needs separate CSP/bundle evidence.',
        pros: [
          'A pure command seam reduces browser/agent/native rule divergence.',
        ],
        cons: [
          'Keep renderers/history outside the core; full canvas reuse needs separate CSP/bundle evidence.',
        ],
      },
      {
        id: 'custom-text-editor-bridge',
        title: 'Build an independent full native editor or iframe Pages',
        verdict: 'reject',
        summary: 'Reason: rebuilding a full independent editor or embedding production Pages expands duplication and origin/workspace risks before the existing native prototype is correct.',
        how: '',
        pros: [
        ],
        cons: [
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Retain CustomTextEditor and the shared loader/transpiler. Prioritize dirty-buffer Generate, project identity, revision-aware source maps and consistent graph edits. Then expand node coverage through a bounded shared command layer; decide separately whether to share the full canvas UI. Marketplace readiness is not established by a package script.',
    firstSlice: [
      'Priority: Next after revision-safe persistence and the small shared edit seam',
      'Dependency: Small shared graph-command core is justified by inspected browser/native divergence; keep renderer and host history outside it',
      'Dependency: Revision-safe persistence and stable project identity are cross-host prerequisites; no generated-code execution or collaboration server is required',
      'Next experiment: Generate one project from a captured overlay of open TextDocument contents plus disk-only files, carrying explicit root and document versions. Compare output with the same saved snapshot through the existing loader. Include dirty manifest, graph and symbols, concurrent edits, two workspace roots, and a dirty output file. First establish this contract without adding node kinds; then parity-test one connect command across hosts.',
      'Acceptance gate (proposed): Unsaved input edits affect the captured generation snapshot, or a clear save guard blocks generation; invalid JSON never falls back silently to old disk content',
      'Acceptance gate (proposed): Edits during async loading invalidate/retry the snapshot or leave a clearly labeled prior revision; Generate does not mark later edits saved',
      'Acceptance gate (proposed): Dirty output buffers and partial write failures are surfaced; no silent overwrite of user\'s newer work',
      'Acceptance gate (proposed): Webview-originated Generate uses its own workspace root; source maps are keyed by project/graph/generation revision and stale maps are rejected',
      'Acceptance gate (proposed): Shared connection tests cover cycles, typeRef/data_any compatibility, occupied inputs, execution fan-out and undo/redo',
      'Acceptance gate (proposed): Add extension-host integration tests, minimum-engine packaging smoke tests, split-editor synchronization, malformed messages and reload recovery',
    ],
    sources: [
      {
        label: 'Native editor, Generate and source-map state',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/src/extension.ts',
      },
      {
        label: 'Disk-based workspace snapshot loader',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/src/workspaceProject.ts#L21-L81',
      },
      {
        label: 'Actual extension contract and save-before-Generate caveat',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/README.md',
      },
      {
        label: 'Extension packaging and runtime manifest',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/package.json',
      },
      {
        label: 'Browser connection invariants',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/graphWiring.ts#L99-L254',
      },
      {
        label: 'Current CI jobs',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/.github/workflows/ci.yml',
      },
      {
        label: 'VS Code custom text editor document model',
        href: 'https://code.visualstudio.com/api/extension-guides/custom-editors',
      },
      {
        label: 'VS Code TextDocument and openTextDocument APIs',
        href: 'https://code.visualstudio.com/api/references/vscode-api#TextDocument',
      },
      {
        label: 'VS Code webview state/CSP guidance',
        href: 'https://code.visualstudio.com/api/extension-guides/webview',
      },
      {
        label: 'VS Code web extension runtime requirements',
        href: 'https://code.visualstudio.com/api/extension-guides/web-extensions',
      },
    ],
  },
  {
    id: 'ue6-native-plugin',
    systemId: 'ue6-native-plugin',
    title: 'Native Unreal Engine 6 plugin, after release',
    subtitle: '[Research, 30 September 2026] Release-gated; retain the actual UE6 release decision. Strategic priority; implementation release-gated, not an immediate build item.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] plugins/README.md explicitly says the UE6 editor plugin is not started. The pinned tree contains no .uplugin, .uproject, Build.cs, or Target.cs implementation. Current value comes from the shared graph/transpiler and environment packages, not an engine-side editor. The native-plugin and attach cards should retain different completion criteria: reliable exported Verse is useful preparation, but is not a shipped native authoring window. Epic\'s June 22, 2026 roadmap targets UE6 Early Access at the end of 2027, with full release 12–18 months later. It explicitly describes the public development stream as not Alpha and the exposed Verse implementation as not intended for general adoption. This research found no superseding official release announcement as of September 30, 2026. These are targets, not a guaranteed ship date or evidence of a stable plugin SDK. UE5.8 provides documented plugin packaging and SWebBrowser today; current UEFN offers built-in beta MCP. They establish possible integration shapes, not UE6 compatibility. The old card\'s \'official UEFN MCP schema was press-only\' caveat is obsolete, although exact installed tools still require discovery. Epic also plans to retain Actors/Blueprints in early UE6 and deprecate them later when the replacement matures, so migration urgency should not be exaggerated.',
    constraints: [
      'Preserve the after-UE6-release gate. Record the exact release and clarify whether Early Access qualifies before implementation.',
      'Never invent UE6 plugin, compiler or MCP contracts; current UE5/UEFN documentation is not future compatibility proof.',
      'One graph schema and authoritative document across hosts; Pages remains usable without the plugin.',
      'No automatic gameplay launch or remote unauthenticated MCP exposure. An external compiler bridge alone is not an in-engine visual editor.',
    ],
    options: [
      {
        id: 'wait-ue6-packs-first',
        title: 'Thin native editor companion after release',
        verdict: 'later',
        summary: 'Smallest integration: project-scoped graph/source import, export ownership checks, and external compile diagnostics through documented engine contracts or MCP. Fastest path to useful native workflow, but still does not provide an in-editor canvas.',
        how: 'Development / maintenance gate: A companion is not a native canvas; exact released contracts are required.',
        pros: [
          'Offers a bounded project and diagnostic bridge after release.',
        ],
        cons: [
          'A companion is not a native canvas; exact released contracts are required.',
        ],
      },
      {
        id: 'slate-uedgraph-now',
        title: 'Native dock tab with bundled existing web UI',
        verdict: 'later',
        summary: 'Best candidate if native visual authoring is required. Retains one renderer/schema/transpiler and can work without Pages being reachable. Must prove browser support, Worker/storage behavior, keyboard/clipboard/file bridge, resource sandboxing, packaging, and upgrade compatibility in the released engine.',
        how: 'Development / maintenance gate: Must prove input, worker/storage, file bridge, sandbox and engine upgrade behavior.',
        pros: [
          'Reuses the existing renderer/schema/transpiler in a native dock.',
        ],
        cons: [
          'Must prove input, worker/storage, file bridge, sandbox and engine upgrade behavior.',
        ],
      },
      {
        id: 'thin-plugin-after-contracts',
        title: 'Native Slate presentation over the shared graph contract',
        verdict: 'later',
        summary: 'Potentially strongest engine-native interaction and accessibility, while technically preserving the same graph schema. Highest maintenance and parity burden because editing/selection/undo/layout behavior must be rebuilt. Defer unless release-era measurement shows embedding cannot meet required interaction or performance needs.',
        how: 'Development / maintenance gate: Largest parity/maintenance burden; defer unless embedding fails measured requirements.',
        pros: [
          'Can preserve shared schema while optimizing native interaction.',
        ],
        cons: [
          'Largest parity/maintenance burden; defer unless embedding fails measured requirements.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Preserve the user\'s after-UE6-release gate. Prepare a small shared host contract now only where it also serves current export/native-host work. Re-evaluate a thin editor plugin versus an embedded copy of the existing web UI when an actual UE6 release and documented extension surface are available.',
    firstSlice: [
      'Priority: Release-gated; retain the actual UE6 release decision',
      'Dependency: Actual UE6 release plus documented plugin/browser/compiler contracts',
      'Dependency: Verified Verse output and versioned environment packs from the attach vertical slice',
      'Dependency: Reusable host adapter, file ownership/drift handling, and source-map diagnostics',
      'Dependency: Representative engine hardware/project and an explicitly defined native-authoring need',
      'Next experiment: Before release, write a host-neutral contract and fixtures for open/save graph, export files, project identity, content hashes, diagnostics, and capability negotiation; do not bind them to guessed UE6 module/compiler names. Once the release gate is met, perform a compatibility spike in a disposable project: one graph, one save/reopen cycle, one generated source file, and one external compile diagnostic. Compare thin companion and embedded-renderer feasibility before selecting architecture.',
      'Acceptance gate (proposed): The gate records the exact released UE6 version, supported extension APIs, and whether EA qualifies for the user\'s release criterion',
      'Acceptance gate (proposed): Browser and engine hosts round-trip the same graph without lossy conversion, divergent schema, or a second authoritative document',
      'Acceptance gate (proposed): An embedded candidate demonstrates selection, undo/redo, focus, keyboard input, persistence, and safe close/reopen with the existing UI',
      'Acceptance gate (proposed): Local access remains project-scoped and opt-in; no remote unauthenticated MCP exposure or automatic gameplay launch',
      'Acceptance gate (proposed): The plugin is removable, Pages remains fully usable independently, and compiler output is tied to the correct generated revision',
    ],
    sources: [
      {
        label: 'Pinned release-gated roadmap row',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/developmentRoadmap.ts#L1453-L1459',
      },
      {
        label: 'Pinned plugin status and goals',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/plugins/README.md',
      },
      {
        label: 'Epic: UE6 timeline, development-stream status, transition plans',
        href: 'https://www.unrealengine.com/news/the-road-to-ue-6',
      },
      {
        label: 'Epic: current UE plugin architecture',
        href: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/plugins-in-unreal-engine',
      },
      {
        label: 'Epic: current SWebBrowser API',
        href: 'https://dev.epicgames.com/documentation/unreal-engine/API/Runtime/WebBrowser/SWebBrowser',
      },
      {
        label: 'Epic: UEFN MCP announcement and beta scope',
        href: 'https://www.fortnite.com/news/unreal-mcp-is-now-available-in-uefn',
      },
      {
        label: 'Epic: current Unreal MCP experimental limits',
        href: 'https://dev.epicgames.com/documentation/unreal-engine/unreal-mcp-in-unreal-editor',
      },
    ],
  },
  {
    id: 'interactive-node-docs-research',
    systemId: 'interactive-node-docs',
    title: 'Interactive node / option / feature docs',
    subtitle: '[Research, 30 September 2026] Parallel: catalog truth, examples and exported-artifact checks. HTML-first catalog exists; prioritize accurate capability/context coverage and tested examples.',
    problem: '[Technical analysis at 513d0afa, after merged PR #8; source-inspected findings, not new runtime/benchmark results] At the pinned commit CORE_NODE_REGISTRY contains 46 kinds. The catalog derives pins/options from it; Next generateStaticParams builds per-kind routes, and the node page renders definition, ports, option anchors and related links. Three feature pages, DocsInfoIcon, registry tooltips, sitemap, robots and llms.txt already exist. Three authored guides cover Branch, Print and Math Add. Research copy claiming \'planned /docs nav only\' is stale, and even the design document contains contradictory older integration text. Coverage does not yet equal trustworthy teaching. nodeDocStatus calls every non-legacy kind stable, with no target-language/capability context. Dynamic symbol and environment nodes need explanations of project-derived pins rather than treating generic core tables as complete instance schemas. Option rendering chooses enum values instead of the description when both exist, and does not expose conditional visibility. Only three guides explain use and pitfalls; the sidebar filters titles/IDs/semantics, not article text. No option-type pages, JSON/Markdown twins or playground are present in the inspected tree. The publishing path needs stronger verification: pages:build runs write-public-seo, but pages.yml runs build directly, so regeneration is bypassed. Existing tests check core ID presence and sitemap strings, not exported HTML, anchors, correct metadata or schema equality. Node metadata supplies title/description but no per-page canonical/Open Graph. The extension\'s docs command rejects dots in kind IDs, although core IDs such as vvs.project.call_function contain them, creating an additional cross-host link gap.',
    constraints: [
      'Selected route: registry-owned HTML-first static catalog, existing CI and GitHub Pages with /VVS-Web. No docs microservice or required search key.',
      'Node/option/pin tables come from registry truth; overlays never invent ports or unsupported target behavior.',
      'Playground is progressive enhancement using the shared transpiler, never a runtime; no-JS definition and tables remain readable.',
      'Machine-readable twins and llms.txt are access aids, not guaranteed SEO/AI rankings. Candidate: replacing the selected route with a JS-only or hosted-key docs product - Rejected. Reason: it weakens robust static reading and client-first delivery.',
    ],
    options: [
      {
        id: 'ssg-registry-catalog',
        title: 'Complete factual reference plus ten curated examples',
        verdict: 'ship',
        summary: 'Recommended. Keep registry-owned structural data; add independently authored purpose, pitfalls, language support and validated graph/output examples. Explain dynamic pins and leftovers explicitly. This gives immediate learning value without a second runtime.',
        how: 'Development / maintenance gate: Target/environment support, dynamic pins and example output need ongoing validation.',
        pros: [
          'Improves current learning value with factual reference and trusted examples.',
        ],
        cons: [
          'Target/environment support, dynamic pins and example output need ongoing validation.',
        ],
      },
      {
        id: 'client-playground',
        title: 'Progressively enhanced local playground',
        verdict: 'later',
        summary: 'Next, for a few representative nodes only. Edit canonical graph options and run the existing transpiler to show source, without executing it. Preserve the same definition/tables without JavaScript. Fake runtime simulations or hand-coded outputs would drift.',
        how: 'Development / maintenance gate: Only trusted fixtures; keep the static definition/table as the primary content.',
        pros: [
          'Shows graph-to-source changes without running generated code.',
        ],
        cons: [
          'Only trusted fixtures; keep the static definition/table as the primary content.',
        ],
      },
      {
        id: 'js-only-or-hosted-docs',
        title: 'Machine twins, Pagefind, or a separate hosted docs stack',
        verdict: 'later',
        summary: 'Generate JSON/Markdown from the same record when consumers need them; Pagefind can index the exported HTML without a server. Defer replacing the stack: current Next export already satisfies the hosting constraint, and 46 kinds do not establish a search-scaling problem.',
        how: 'Development / maintenance gate: Do not replace the selected static stack or claim automatic search/ranking gains.',
        pros: [
          'Same-record twins and Pagefind can serve demonstrated consumers.',
        ],
        cons: [
          'Do not replace the selected static stack or claim automatic search/ranking gains.',
        ],
      },
    ],
    recommendation: '[Recommendation, not a shipped claim] Build on the existing catalog. Correct status and option-context truth, add focused authored examples, and test the exported artifacts and deep links. Add a small local graph-to-generated-text playground only after those fixtures are trustworthy. Markdown/JSON twins and full-text search are useful delivery formats, not guaranteed SEO or AI-discovery mechanisms.',
    firstSlice: [
      'Priority: Parallel: catalog truth, examples and exported-artifact checks',
      'Dependency: Registry/capability metadata and reusable graph fixtures; coordinate target-support facts with the fidelity work',
      'Dependency: Shared editing commands become necessary if the playground mutates real graphs, but are not a blocker for documentation quality or static artifacts',
      'Next experiment: Take Branch, Print and Math Add plus one conditional-option node and one target-limited node through a complete fixture pipeline: canonical graph, validation, generated output, prose, HTML and optional JSON twin. Verify no-JavaScript reading and editor/extension deep links. Then use observed lookup failures to decide between improving the existing filter and adding Pagefind.',
      'Acceptance gate (proposed): Every public core kind has an exported page; legacy pages say legacy and point to a supported replacement where one exists',
      'Acceptance gate (proposed): Port/option IDs, defaults, enum values, descriptions and conditions agree across registry, HTML and any machine-readable twin',
      'Acceptance gate (proposed): Capability statements match the tested target and environment; \'stable\' never implies every target can emit every construct',
      'Acceptance gate (proposed): Example graphs validate and produce checked output with the shared transpiler; unsupported cases visibly retain leftover honesty',
      'Acceptance gate (proposed): Direct routes and #opt/#in/#out anchors work at /VVS-Web and custom-domain root; dotted IDs work from the extension',
      'Acceptance gate (proposed): CI regenerates SEO files and checks actual static output, canonical URLs, links, no-JS content and narrow-screen/keyboard access',
    ],
    sources: [
      {
        label: 'Registry-derived docs records and status',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/nodeDocCatalog.ts',
      },
      {
        label: 'Core registry with 46 kinds',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/packages/syntax-registry/core-pack.json',
      },
      {
        label: 'Static node pages and option rendering',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/app/docs/nodes/[kindId]/page.tsx',
      },
      {
        label: 'Existing authored guides',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/nodeDocGuides.ts',
      },
      {
        label: 'Docs coverage tests',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/src/lib/nodeDocCatalog.test.ts',
      },
      {
        label: 'SEO generation script',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/web/scripts/write-public-seo.ts',
      },
      {
        label: 'Pages workflow build invocation',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/.github/workflows/pages.yml#L53-L57',
      },
      {
        label: 'Native docs command ID validation',
        href: 'https://github.com/Sheriff99yt/VVS-Web/blob/513d0afa1d7c6a26f877100cd4146be72553f8f0/apps/vscode/src/extension.ts#L173-L176',
      },
      {
        label: 'Next static export behavior',
        href: 'https://nextjs.org/docs/app/guides/static-exports',
      },
      {
        label: 'Google JavaScript SEO rendering guidance',
        href: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics',
      },
      {
        label: 'Google AI Search requirements',
        href: 'https://developers.google.com/search/docs/appearance/ai-features',
      },
      {
        label: 'Pagefind static build indexing',
        href: 'https://pagefind.app/docs/',
      },
    ],
  },
];
