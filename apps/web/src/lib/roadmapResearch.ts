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

/** In-app Research tab. One upcoming system, three real approaches. */
export const RESEARCH_TOPICS: ResearchTopic[] = [
  {
    id: 'u93-code-to-visual',
    systemId: 'code-to-visual-u93',
    title: 'Code \u2192 visual (U93)',
    subtitle:
      'Reverse of Generate. Read ordinary source, produce a text-shaped graph the user can keep editing.',
    problem:
      'Generate already walks canvas \u2192 IR \u2192 eight language printers. U93 is the missing import: raw source in, graph document out. The Open tab already marks this a research track, not near-term polish. The failure mode is the same one that killed hidden event runtime and fake Function Declare: a guessed node that looks real. Canvas stays source of truth after import, so a wrong Call or a silent rewrite is worse than an honest leftover.',
    constraints: [
      'Canvas is source of truth after import. Round-trip drift is a bug, not a style choice.',
      'Client-first: must run on static Pages. WASM / Worker is fine. No dedicated parser server, no product accounts, no source leaving the machine as the default path.',
      'Reuse the existing IR the printers already emit. Do not invent a second graph model.',
      'Unknown syntax is an (x) leftover that keeps the original span. Never invent a language API to make import look complete.',
      'Node / option / pin still hold. Import must not collapse those into one blob node.',
      'Eight shipped printers: Python, JavaScript, C++, Verse, GDScript, Rust, C#, Go. Start with one pack; do not pretend all eight land together.',
      'VVS roles are not plain AST. this.go += this.on_go is Bind, not assign. self.on_go(...) is Dispatch, not a generic Call.',
    ],
    options: [
      {
        id: 'deterministic-ir-reverse',
        title: 'Deterministic IR reverse',
        verdict: 'ship',
        summary:
          'Parse in the browser with tree-sitter WASM, lower the CST onto the same IR Generate already uses, then materialize nodes, options, pins, and edges. Layout is a separate pass.',
        how:
          "A Worker loads web-tree-sitter plus one grammar. The pack lowerer maps CST kinds onto existing IR (class, function, if/for/return, get/set, call, Bind/Dispatch where the text is that line). IR \u2192 graph document. Unknown CST becomes an (x) leftover that stores the source span. Layout uses ELK or Dagre (same class of engine ASTraFlow uses). Goldens invert today's test_project_goldens: graph \u2192 text \u2192 graph identity, ignoring x/y.",
        pros: [
          'Deterministic. The labs can be inverted into goldens the same way Generate already proves printers.',
          'Runs on hosted Pages. web-tree-sitter is WASM. No server, no key, no source upload.',
          'Reuses graphToIr and the eight packs. Import is the inverse of a path that already exists.',
          'Honesty is structural: unmapped syntax stays (x) with the snippet, same rule as Verse GetInput.',
          'Tree-sitter is incremental and error-tolerant, so a live "import this file" and a later "re-import this function" are the same engine.',
          'Official or solid grammars exist for Python, JS, C++, Rust, C#, Go, and GDScript. Verse has a community grammar (taku25/tree-sitter-verse), not an Epic-official one.',
        ],
        cons: [
          'Eight inverse lowerers is real work. Every printer construct needs a matching CST pattern.',
          "x/y, comments, groups, and reroutes are not in the AST. Import will look like a fresh layout, not the author's original canvas.",
          'Ambiguous text needs VVS-aware patterns. += / .on / .connect / on_*() can be Bind, Dispatch, or ordinary code.',
          'C++ preprocessor, macros, templates, Go generics, and Verse effects/fail will have holes on day one.',
          'The Verse grammar is community-maintained and can drift from Epic. Treat Verse as a later pack, not the first slice.',
          'A broken file still parses, but the mapping will drop pieces. Partial import must be visible, not silent.',
        ],
      },
      {
        id: 'llm-graph-json',
        title: 'LLM emits the graph',
        verdict: 'reject',
        summary:
          'Send source to a model and ask for VVS nodes, edges, and options as JSON. Optional verify loop, the way Unreal agents now call describe_graph after every edit.',
        how:
          'User pastes or drops a file. A prompt asks for graph JSON in the live canvas schema. A second pass could re-read the produced graph and diff it, copying the UE 5.7 describe_graph / RT2 habit: agents that cannot see topology invent wires.',
        pros: [
          'Fastest demo. One prompt surface instead of eight lowerers.',
          'Handles messy comments, odd formatting, and languages the CST lowerer has not met yet.',
          'Can propose layout and names, which a CST never carries.',
          'The verify-loop idea from Blueprint MCP (describe_graph, compile, orphan check) is real and useful as a later review tool.',
        ],
        cons: [
          'Not deterministic. Goldens flake. graph \u2192 text \u2192 graph will not hold.',
          'Invented nodes look like real Calls. That is the same leak as hidden _subscribe and fake Declare.',
          'Default path needs a model and a key. Hosted Pages cannot ship a secret. BYO-key is a product account by another name.',
          'Source leaves the machine. That fights client-first and the no-accounts lock.',
          'UE Blueprint AI editing failed for years for this reason: the model cannot see topology unless the host gives it a graph dump. VVS already has the graph. Guessing it from text throws that away.',
          'Quiet drift. A wrong import that Generate then "fixes" teaches the user the canvas is disposable.',
        ],
      },
      {
        id: 'deterministic-plus-confirmed',
        title: 'Deterministic core + confirmed leftovers',
        verdict: 'later',
        summary:
          'Option 1 owns structure. The already-shipped in-page Agent may propose a mapping for leftover spans only. The user accepts or keeps (x). The model never writes the canvas unattended.',
        how:
          'Same Worker + lowerer as Option 1. Leftover spans stay (x). The in-page Agent (Worker tools against the live canvas) can patch a leftover into a real kind the way Bind Details already write through. Offline, or with the Agent closed, import is still Option 1. No new hosted AI product.',
        pros: [
          'Default path stays honest and offline. Pages + folder/.vvs still work with the Agent tab closed.',
          'Long tail (weird Verse, macros, unfamiliar sugar) gets a helper without owning source of truth.',
          'Uses the in-page Agent already shipped. No Cursor sidecar, no hosted MCP, no new account.',
          'Confirmation is the same consume-path rule as Bind / Dispatch Details: a proposal is a patch the user keeps or drops.',
          'The deterministic core is still golden-testable. Agent proposals stay out of the goldens.',
        ],
        cons: [
          'Two systems. The temptation is to let the Agent "fix" structure when a lowerer is incomplete.',
          'Confirmation UI is real work: a diff of proposed nodes, not a silent apply.',
          'Still need the eight lowerers, or the Agent is doing Option 2 under a friendlier name.',
          'Layout is still a separate unsolved pass.',
          'Agent quality varies. Treat every proposal as a patch against leftover spans, never as a full-file replace.',
        ],
      },
    ],
    recommendation:
      'Ship Option 1 as the product path. Start with one pack that already has the richest goldens (Python or JavaScript), invert the lab goldens, and require graph \u2192 text \u2192 graph identity on that set (ignore x/y). Keep Option 3 as a later assist on leftover spans only, through the in-page Agent that already exists. Do not ship Option 2. A guessed graph that Generate then rewrites is how the canvas stops being source of truth.',
    firstSlice: [
      'Worker + web-tree-sitter + one grammar (Python or JavaScript).',
      'CST \u2192 existing IR for a closed set: class, function, if / for / return, get / set, call.',
      'IR \u2192 graph document + a simple layered layout. No comment / group / reroute recovery in v1.',
      'Unknown syntax \u2192 (x) leftover that stores the source span and the original text.',
      'Golden: invert First Graph and Branch. graph \u2192 Generate \u2192 import \u2192 same IR (layout ignored).',
      'VVS-aware patterns from day one for the closed set only. Bind / Dispatch wait until that pack already prints them.',
      'Verse, C++ macros, and Agent-proposed leftovers are out of the first slice.',
    ],
    sources: [
      { label: 'Tree-sitter (incremental parse, WASM)', href: 'https://tree-sitter.github.io/tree-sitter/' },
      { label: 'web-tree-sitter (browser / Worker)', href: 'https://www.npmjs.com/package/web-tree-sitter' },
      { label: 'ASTraFlow \u2014 CST to flowchart, React Flow + Dagre', href: 'https://github.com/Mayukh-Jain/ASTraFlow' },
      { label: 'Codag \u2014 tree-sitter live graph, LLM only for semantics', href: 'https://github.com/ai-codespark/codag' },
      { label: 'Why Blueprint AI editing fails without describe_graph', href: 'https://www.strayspark.studio/blog/ai-blueprint-editing-describe-graph-closed-loop-ue5' },
      { label: 'BAIBv2 RT2 \u2014 explicit wire manifest for graph rebuild', href: 'https://xrvp.io/fab/BAIBv2+MCP-User-Guide.pdf' },
      { label: 'Verse editor: graph canonical, Import parses text back', href: 'https://adamhafez.co/articles/blueprints-to-verse/' },
      { label: 'tree-sitter-verse (community, not Epic-official)', href: 'https://github.com/taku25/tree-sitter-verse' },
    ],
  },
  {
    id: 'collab-session-sync',
    systemId: 'collab',
    title: 'Session client / host (Phase 4)',
    subtitle:
      'Game-lobby sync of the live canvas. Not account cloud. The Open item already locks the product shape; transport and conflict rules are still TBD.',
    problem:
      'Phase 4 is a lobby: one host, a few guests, same graph, then everyone leaves. It is not Figma.com, not tldraw.com, and not a VVS account room. The durable project stays folder / .vvs / git, the same way Unreal Multi-User Editing sits on top of Perforce and does not replace it. The open questions are who linearises edits, what the conflict grain is, and how two browsers find each other on static Pages. A guessed merge that leaves a dangling wire or a fake Bind is worse than a dropped guest. The roadmap still says "Go WS candidate". That is one transport, not the product.',
    constraints: [
      'Client-first. No dedicated VVS app server, no accounts, no Durable-Object cloud room as the product path.',
      'Hosted Pages must still work. A local Go process can be an optional host tool, not a requirement to open the editor.',
      'Session is ephemeral. The project on disk is source of truth after the lobby ends. Do not invent a VVS sync database.',
      'Canvas must stay a legal VVS graph: kinds, pins, options, Bind spawn rules. Convergence that breaks schema is a bug.',
      'Conflict grain is object/property, not characters. A node move and a pin rewire are Figma-shaped edits, not Google Docs.',
      'Generate / IR still run locally on each client from the same graph. Collab must not become a second runtime.',
      'Lobby, not mesh-of-equals as the default. Someone is host, the way a game lobby has a listen server.',
    ],
    options: [
      {
        id: 'lobby-host-lww',
        title: 'Lobby host authority + property LWW',
        verdict: 'ship',
        summary:
          'One browser is the host. The host holds the graph and is the only linearisation point. Guests send ops; the host applies last-writer-wins per node, edge, or property, validates schema, then broadcasts the result. Same trick Figma used, except the "server" is a player.',
        how:
          'Ops are small: upsert/delete node, upsert/delete edge, set property. Host applies them in arrival order, rejects anything that breaks kinds / pins / Bind rules, and sends the accepted op (or a snapshot) to every guest. First slice is BroadcastChannel between two tabs on one machine, then WebRTC data channels on a LAN. Internet join is a room code plus a short signaling handshake (SDP/ICE only). Graph bytes stay on the data channel. When the host tab closes, the session ends. Guests keep a local snapshot and write it themselves if they want; no silent merge into .vvs.',
        pros: [
          'Matches the locked product: lobby, not accounts. Host is the listen server, like a game and like Unreal Multi-User Editing.',
          'Schema stays honest. Illegal wires and illegal Binds die on the host before anyone else paints them.',
          'Property-level LWW is the grain Figma and tldraw actually ship for canvases. OT and full CRDTs are the wrong complexity.',
          'Pages-native first slice. BroadcastChannel and WebRTC need no Go and no VVS cloud.',
          'Durable SoT stays folder / git. Session history does not become a second project store.',
          'Figma dropped OT and full CRDT for this reason: a central authority makes LWW cheap and debuggable.',
        ],
        cons: [
          'Host tab close ends the lobby. That is correct for a session, but it feels abrupt unless the UI says so.',
          'WebRTC still needs a signaling path and often TURN on real NATs. Signaling is not "no infrastructure", it is a handshake.',
          'Public signaling servers are untrusted and they rot (y-webrtc Heroku hosts already have). Encrypt the handshake; do not send graph bytes there.',
          'Two people editing the same property: last arrival wins. Fine for x/y and a title, bad if two people rewrite the same function body as text.',
          'Undo across clients is host-ordered undo, not per-user magic. Same hard problem Figma accepted.',
          'Same-network first. Cross-internet without TURN will fail and must look failed, not "syncing".',
        ],
      },
      {
        id: 'yjs-graph-crdt',
        title: 'Yjs / Automerge as graph source of truth',
        verdict: 'reject',
        summary:
          'Put the graph document in a CRDT. Peers merge without a host. y-webrtc plus a public signaling server is the usual demo.',
        how:
          'Wrap nodes and edges in Y.Maps. Every client applies local edits immediately. Updates flood over WebRTC. Awareness carries cursors. No host role. Offline edits merge later by CRDT rule.',
        pros: [
          'Host can leave and the room can continue. Nice for a long-lived shared file, which this item is not.',
          'Library ecosystem is large (Yjs, Automerge, Loro). Demos look finished in a week.',
          'Awareness (cursors, follow) is a solved add-on and can be reused even if the document path is not CRDT.',
          'True P2P once signaling is done. Matches a "no server" slogan on paper.',
        ],
        cons: [
          'A legal VVS graph is not a CRDT. Two concurrent deletes plus a new wire can converge to a dangling edge that Generate will print.',
          'Y.Map on a blob JSON is the wrong grain. tldraw built a canvas-specific sync for this reason; they did not drop Y.Text on a shape tree.',
          'Tombstones, clocks, and undo are the overhead Figma deleted once they had a linearisation point.',
          'Public y-webrtc signalers are untrusted and several official ones are already dead. Still not a VVS-shaped product.',
          'Offline merge into .vvs fights canvas source of truth: two "valid" graphs that Generate cannot both be.',
          'Does not match the locked lobby. A mesh of equals is a different product than session client / host.',
        ],
      },
      {
        id: 'go-ws-room',
        title: 'Local Go WebSocket room',
        verdict: 'later',
        summary:
          'The roadmap candidate: a Go process on the host machine plays TLSocketRoom. Same host-authority LWW as option 1, over WebSocket instead of WebRTC.',
        how:
          'Host clicks "host session". A local Go binary (same family as the existing localhost sidecar, not a hosted product) binds a WS room, holds the graph, validates ops, fans them out. Guests paste ws://host:port or a tunnel URL. Persist-to-disk is still the host .vvs folder. Do not deploy this binary as VVS cloud.',
        pros: [
          'WebSocket is boring and reliable. Reconnect, backpressure, and "one room process" are well understood (tldraw TLSocketRoom, Figma server).',
          'NAT/corporate Wi-Fi that break WebRTC often still allow an outbound WS if the host is reachable or tunneled.',
          'Go is already in the repo as a local sidecar. This is a new room, not a new language.',
          'Same op schema and LWW as option 1, so the product logic is shared. Transport is the only swap.',
          'Easier to log and test: one process sees every op, like Figma\'s linearisation point.',
        ],
        cons: [
          'Extra install. Hosted Pages users do not have Go. This cannot be the default path or we have reintroduced a sidecar requirement.',
          'Looks like a dedicated server. The moment it is hosted for everyone, it becomes the cut "VVS accounts / app server" track.',
          'The host machine must be reachable. Home NAT still needs a tunnel (not a VVS product).',
          'Two implementations of the room if WebRTC also exists. Keep one op schema; do not fork conflict rules.',
          'Guests on Pages talking to a random home port is a trust prompt. Room codes must expire with the lobby.',
        ],
      },
    ],
    recommendation:
      'Ship option 1 as the product path. The lobby host is Figma\'s server. Conflict grain is property-level last-writer-wins plus schema reject. Durable SoT stays folder / .vvs / git. Do not put Yjs under the graph. Keep option 3 as the optional internet/fallback transport when WebRTC or TURN is stuck, and only as a local process the host chose to run. Cursors can later ride awareness (Yjs or homemade) without owning the document.',
    firstSlice: [
      'Op schema: node upsert/delete, edge upsert/delete, property set. Each op names an id and a field.',
      'Two-tab BroadcastChannel: one host, one guest, same origin. Host validates and echoes.',
      'Host reject path: illegal kind, illegal wire, Bind spawn rule, unknown property. Guest shows the reject, does not keep a ghost node.',
      'Host close ends the lobby. Guest snapshot is a local copy only. No auto-write into .vvs.',
      'Presence later. No cursors in v1.',
      'WebRTC + room code after the two-tab path is golden. Signaling carries SDP only, never graph bytes.',
      'Go WS room only if the WebRTC path is blocked, sharing the same op schema. Not a hosted VVS cloud.',
    ],
    sources: [
      { label: 'How Figma multiplayer works (LWW, not OT, not full CRDT)', href: 'https://www.figma.com/blog/how-figmas-multiplayer-technology-works/' },
      { label: 'tldraw sync (WebSocket room, per-shape LWW)', href: 'https://tldraw.dev/docs/sync' },
      { label: '2026 canvas collab: tldraw vs Excalidraw vs Yjs', href: 'https://www.youngju.dev/blog/culture/2026-05-25-realtime-collab-crdt-liveblocks-partykit-yjs-automerge-loro-2026-deep-dive.en' },
      { label: 'Sync engines: property-level vs character-level', href: 'https://liveblocks.io/blog/understanding-sync-engines-how-figma-linear-and-google-docs-work' },
      { label: 'y-webrtc (signaling is handshake, not the document path)', href: 'https://github.com/yjs/y-webrtc/' },
      { label: 'Unreal Multi-User Editing (session on top of version control)', href: 'https://dev.epicgames.com/community/learning/tutorials/7Jx6/collaborating-with-multi-user-editing-in-unreal-engine' },
    ],
  },
  {
    id: 'coa-compile-policy',
    systemId: 'coa-deferred',
    title: 'Cross Over Architecture (compile policy)',
    subtitle:
      'One language-neutral graph, many printers. The missing piece is not another emitter. It is the documented rule for warn vs error when a node has no honest line in a target.',
    problem:
      'COA_SHIPPED is false. Settings show Planned. U66/U67 already dim and comment a node that is ineffective for the current single target. analyzeCrossOverDiagnostics exists and does not block Generate. The deferred spec still needs two things: multi-target export (one graph to App.py, App.cpp, ...) and a compile policy. Without the policy, "export all eight" is either a zip of leftovers or a silent lie. Bind, Implements, multi-base Extends, Yield, and Verse GetInput already prove the eight printers are not equal. A guessed stub to make them look equal is the same leak as hidden _subscribe.',
    constraints: [
      'Canvas stays language-neutral and source of truth. COA must not fork the graph into eight secret documents.',
      'Single-target Generate keeps today: U66 (x) + U67 dim. Verse GetInput and non-C++ Declare stay honest leftovers, not a hard error on everyday Python.',
      'Never invent a language API or a VVS runtime to make a target look complete.',
      'No dedicated app server. Multi-target export is still client-side Generate.',
      'Node / option / pin still hold. Effectiveness is per node for a target, not a vibe on the project.',
      'Spawn is already gated where a pack cannot print the line (Bind). COA must not reopen those nodes as fake emit.',
      'Do not flip COA_SHIPPED until multi-emit and the policy both exist. Switching targetLanguage and regenerating stays the shipped path until then.',
    ],
    options: [
      {
        id: 'refuse-target',
        title: 'Refuse the target (intersection)',
        verdict: 'ship',
        summary:
          'A graph is portable to a set S only when every behavioral node has an honest printer in every language in S. Multi-target export withholds or errors that target instead of writing a file full of (x).',
        how:
          'User picks an allowed language set (the COA mode already sketched: allowedLanguages). analyzeCrossOverDiagnostics lists which nodes fail which targets. Multi-target export writes only the targets that pass. A failing target is an error on that file, not a comment novel. Optional later: when the set is active, catalog/spawn follows the intersection (Bind hidden if Python is in the set). Single-target Generate is unchanged.',
        pros: [
          'Matches Polyglot and ProofForge: unsupported is refused, never miscompiled.',
          'Makes "portable" a real predicate, not a zip. Eight files means eight honest printers.',
          'Reuses nodeEffectiveness + analyzeCrossOverDiagnostics. The code is already waiting.',
          'Agrees with Bind spawn gating: if the pack cannot print the line, COA will not pretend it can.',
          'Keeps everyday single-target (x) so Coverage Lab Declare and Verse GetInput do not become project-wide errors.',
          'The policy is a few rules, not a new graph schema. That is what the deferred prerequisite asked for.',
        ],
        cons: [
          'Many real graphs will not export to all eight. Bind alone drops Python, C++, Rust, Go, Verse.',
          'Users will ask why "COA" produced three files. The UI must name the failing nodes, not a generic fail.',
          'Intersection can feel harsh on Extends extra bases (python/cpp only) and Implements (csharp/rust only).',
          'Authoring limits (hide Bind when Python is selected) are easy to get wrong if v1 ships them half-wired.',
          'Does not help a project that truly needs csharp Bind and python core in one repo. That is option 3.',
        ],
      },
      {
        id: 'fanout-leftover',
        title: 'Fan-out (x) (Generate N times)',
        verdict: 'reject',
        summary:
          'Multi-target export just runs the current printer per language. Every gap is U66 (x). Warnings never become errors. This is a button, not an architecture.',
        how:
          'One click writes App.py through App.go. Each file is whatever today\'s single-target Generate would print, leftovers included. analyzeCrossOverDiagnostics stays a log. COA_SHIPPED flips because "multi-emit exists".',
        pros: [
          'Cheapest demo. The printers already exist.',
          'Always produces eight files, which looks like the deferred "App.py, App.cpp, ..." bullet.',
          'No new refuse path to test.',
        ],
        cons: [
          'Portable is a lie. Five of eight files can be comment stacks and still count as shipped COA.',
          'The deferred spec asked for warn vs error. This option never picks error.',
          'Teaches the user that (x) is how other languages work, so they stop trusting Generate.',
          'Fights visual-first: the canvas looks live, the zip is dead.',
          'Same shape as inventing emit. A leftover that is easy to ignore will get copy-pasted into a real project.',
          'analyzeCrossOverDiagnostics stays unused. We already have this product: switch the language dropdown.',
        ],
      },
      {
        id: 'target-overlays',
        title: 'Portable core + target overlays',
        verdict: 'later',
        summary:
          'Haxe-style: a portable layer that must pass the intersection, plus optional per-language overlays (Bind on csharp only). Export emits core everywhere and overlays only on their target.',
        how:
          'Graph document gains a layer or target tag on nodes. Unlayered nodes are the portable core and follow option 1. Overlay nodes spawn only when that language is in the set and never appear in other files, not even as (x). Like Haxe target-specific files and ProofForge extension SDKs: target-only constructs stay out of the portable IR.',
        pros: [
          'Honest about shared vs special. One project can have python core and csharp Bind without refusing python.',
          'Matches how Haxe actually ships multi-target: #if / Foo.js.hx, not one file pretending to be every backend.',
          'Keeps canvas as SoT: overlays are visible nodes, not sidebar flags or secret #if text.',
          'Authoring limits become a layer picker instead of a hide-the-catalog fight.',
        ],
        cons: [
          'New document model. That is bigger than the deferred "document the policy" prerequisite.',
          'Easy to park shared logic on an overlay and only notice when another target is empty.',
          'U93 import and session collab both get harder (which layer does this node belong to).',
          'Eight overlay colors on one canvas will look like a second product.',
          'Do not build this to avoid writing the refuse rule. The refuse rule is still the definition of portable.',
        ],
      },
    ],
    recommendation:
      'Ship option 1 as the compile policy. Portable-to-S means every behavioral node has an honest printer in every language in S. Multi-target export errors or withholds a failing target. Single-target Generate keeps U66/U67. Do not call fan-out (x) a COA ship. Keep option 3 for a later document-model if one repo must carry target-only nodes. Do not flip COA_SHIPPED until the diagnostics actually block multi-emit and the settings toggle is real.',
    firstSlice: [
      'Write the policy in language_profiles.md and unified_symbol_model.md: warn = single-target U66/U67; error = COA multi-emit on an ineffective behavioral node.',
      'Define behavioral vs chrome: leftover Declare (x) on single-target stays warn; Bind / Yield / Implements / extra Extends on a COA set that cannot print them is error for that target.',
      'Wire analyzeCrossOverDiagnostics to multi-target export only. Everyday Generate stays unblocked.',
      'Export writes one file per passing target. Failing targets get a named node list, not a stub file.',
      'COA allowedLanguages picker can exist as UI, still behind COA_SHIPPED until export uses it.',
      'Authoring limits (intersection spawn) and overlays are out of the first slice.',
      'No hidden helper, no invented Verse player API, no "portable runtime".',
    ],
    sources: [
      { label: 'VVS language profiles (COA deferred, U66/U67 shipped)', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/language_profiles.md' },
      { label: 'VVS unified symbol model (COA steps 1-4)', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/design/unified_symbol_model.md' },
      { label: 'MintPlayer Polyglot: refuse unsupported, never miscompile', href: 'https://github.com/MintPlayer/MintPlayer.Polyglot' },
      { label: 'ProofForge: reject unsupported target capabilities at compile time', href: 'https://github.com/yizhinailong/proof_forge' },
      { label: 'Haxe conditional compilation and target-specific files', href: 'https://haxe.org/manual/lf-condition-compilation.html' },
      { label: 'Haxe target-specific modules (Foo.js.hx)', href: 'https://haxe.org/manual/lf-target-specific-files.html' },
    ],
  },
  {
    id: 'ue6-attach-path',
    systemId: 'ue-plugin',
    title: 'UE6 / UEFN attach path (Phase 5)',
    subtitle:
      'How VVS meets Unreal. Same graph schema and Verse emit, or a rewritten in-engine editor. The Open items (plugin, round-trip, engine packs, Blueprint habits) are one cluster, not four architectures.',
    problem:
      'Phase 5 says "UE6-embedded canvas on the same graph schema with Verse emitter" and "not Blueprint VM". Hosted VVS already emits Verse from the browser. The missing decision is the attach path: stay on Pages and ship API packs, talk to a running editor, or rebuild the canvas inside Unreal. On 20 August 2026 Epic enabled Unreal MCP inside UEFN (read/write/compile Verse, place devices, Scene Graph, PIE) with no third-party plugin. That changes the bridge option. It does not change the lock: VVS does not become a hosted MCP product, and Generate still writes ordinary Verse, not Blueprint bytecode.',
    constraints: [
      'Client-first. Hosted Pages must keep working with no Unreal install and no VVS accounts.',
      'Canvas is source of truth in VVS. Do not grow a second graph model inside UEdGraph / Blueprint VM.',
      'Generate ordinary Verse. No hidden VVS runtime, no invented player API (CL-014 stays (x)).',
      'Hosted MCP is not the product path. A local editor that already speaks Unreal MCP is optional attach, like the Go sidecar, not a Pages requirement.',
      'Same graph schema if anything is embedded. A Slate rewrite that drifts from web IR is a fork.',
      'Engine packs are data (environment-templates / TypeSpec apiSurface), not a node per UE API hardcoded in the app.',
      'Blueprint-bridge is habit/docs, not a Blueprint compiler.',
    ],
    options: [
      {
        id: 'packs-only',
        title: 'Environment packs + Generate Verse',
        verdict: 'ship',
        summary:
          'Stay on the hosted editor. Ship UE/Verse API manifests as installable Library environments. Author on Pages, Generate ordinary .verse, drop the file into the UEFN or UE project. Round-trip is file-shaped until U93 exists.',
        how:
          'Extend @vvs/environment-templates the way console packs already work. TypeSpec / apiSurface already exists as a CLI path. Packs declare native Verse/UE types, devices, and portability gates. Catalog spawn is data-driven. Generate writes App.verse. User copies or saves into the Fortnite/UE project. Web to engine is export; engine to web waits on U93 IR reverse. No editor process, no CEF, no Slate canvas.',
        pros: [
          'Matches every lock: Pages, no extra install, canvas SoT, ordinary source, no Blueprint VM.',
          'Can start without UE hardware. Pack format and goldens live in the repo we already ship.',
          'Reuses shipped template/env machinery (17 first-party packs, skip/emit, TypeSpec emit).',
          'COA policy still applies: Verse-only natives stay gated, not invented on Python.',
          'Does not compete with Epic MCP. VVS remains the visual author; UE remains the compiler.',
          'Blueprint-bridge can be a pack + docs ("this Dispatch is an event, not a custom event node") instead of a translator.',
        ],
        cons: [
          'No live compile/PIE loop. User still alt-tabs to UEFN to see if Verse built.',
          'Device placement and Scene Graph stay in the engine. Packs do not replace the level editor.',
          'API surface will lag Epic. Manifests need a refresh story (same as env template Refresh).',
          'Round-trip without U93 is export-only. Importing hand-edited Verse is the U93 problem.',
          'Does not satisfy the literal "in-engine graph editor" bullet. That bullet is option 3.',
        ],
      },
      {
        id: 'live-editor-bridge',
        title: 'Live editor bridge (official Unreal MCP)',
        verdict: 'later',
        summary:
          'Keep the VVS canvas in the browser. When a local UEFN/UE editor is open, push generated Verse and ask the editor to compile, place devices, or start PIE. Use Epic\'s built-in MCP, not a VVS-hosted server.',
        how:
          'Optional local attach. User enables UEFN MCP Toolset (Beta Access, shipped 20 August 2026) or the UE 5.8 registry. VVS writes .verse into the project folder (already client-first) and, if the user opted in, calls the local editor tools: compile, read logs, place a device. Community bridges (uefn-verse-mcp) already queue work onto the Slate tick because unreal.* is not thread-safe. Do not embed those tools in Pages. Do not invent a second protocol if Epic\'s toolset covers write/compile.',
        pros: [
          'Canvas stays the web app we already maintain. No Slate rewrite.',
          'Epic now owns the editor attach surface. Verse write/compile/device/PIE is their job.',
          'Same shape as the locked Go sidecar: optional, local, not the hosted product.',
          'Closes the alt-tab loop that packs-only cannot: compile errors come back as named spans.',
          'Community prior art exists (UnrealMasterAI, Blueprint extractors, tick-queued Python). We should not copy their hosted-agent product shape.',
        ],
        cons: [
          'Requires a running editor and Beta MCP. Pages users get nothing extra.',
          'Temptation to make VVS an MCP client-as-product or to wrap Cursor. That fights the in-page Agent lock.',
          'UEFN MCP toolsets are not a full copy of UE 5.8. Coverage will move as Epic unifies toward UE6.',
          'File ownership: VVS graph vs Verse the agent just rewrote. Canvas must remain SoT; the bridge applies Generate output, it does not let MCP edit nodes.',
          'Still not an in-engine canvas. verse-parity here is "push files + compile", not a live shared graph.',
        ],
      },
      {
        id: 'in-engine-canvas',
        title: 'In-engine embedded canvas',
        verdict: 'later',
        summary:
          'The literal roadmap item: a graph editor inside UE6. Either rewrite React Flow in Slate, or host the existing web app in CEF / WebView2 and speak the same graph JSON.',
        how:
          'Slate rewrite: new C++ graph widget, same IR, Verse emitter called in-process. Years, and it will drift. WebView embed: UCefView / WebView2 / SWebBrowser loads the hosted or bundled VVS UI, JS bridge for "save into this .vvs / .verse". Same schema, one codebase. UE-Mapping already hosts React Flow inside UE5 via CEF for Blueprint topology, which is the embed shape, not the Slate rewrite.',
        pros: [
          'Artists never leave the editor. That is the only unique value of this option.',
          'WebView embed can reuse the Pages app and the graph schema. Slate rewrite cannot.',
          'In-process Verse emit could hook Epic compile without MCP.',
          'Matches the Phase 5 title if that title is treated as a promise.',
        ],
        cons: [
          'Slate rewrite is a second product. It will diverge from web IR, U66, Bind, Agent, Research, everything.',
          'CEF/WebView in the UE editor is a moving target (UE 5.7 built-in WebBrowser fights third-party CEF).',
          'Needs UE hardware, Epic APIs, and a plugin signed into a project. Cannot be the hosted path.',
          'Round-trip then becomes two live canvases unless one is clearly a view. Two SoTs is the failure mode.',
          'Do not start Phase 5 here. Packs and a later MCP attach deliver Verse-first without a C++ canvas.',
        ],
      },
    ],
    recommendation:
      'Ship option 1 as the first Phase 5 slice: engine environment packs and honest Verse Generate on the hosted app. Treat option 2 as the later attach when a user has UEFN/UE open: write files, then optionally call Epic\'s Unreal MCP to compile. Do not build a VVS-hosted MCP. Keep option 3 for a later WebView wrap of the same web app if an in-editor window is truly required. Never rewrite the canvas in Slate. Never compile to Blueprint VM. verse-parity in v1 is .verse + .graph.json files, not a live dual editor.',
    firstSlice: [
      'One Verse/UE environment pack format on @vvs/environment-templates (devices, types, portability gates). TypeSpec apiSurface is an input, not a runtime.',
      'Catalog spawn from the pack. No hardcoded UE node kinds in the app.',
      'Generate ordinary Verse into the project folder. Goldens for a tiny device + class, including CL-014 leftover.',
      'Do not flip an in-engine plugin target. Do not embed CEF.',
      'Document attach-later: if UEFN MCP is enabled, a future optional button can compile the file VVS just wrote.',
      'Blueprint-bridge stays a habit guide, not an importer, until U93 exists.',
      'Same graph schema. No UEdGraph as SoT.',
    ],
    sources: [
      { label: 'VVS roadmap Phase 5 (same graph, Verse text, not Blueprint VM)', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md' },
      { label: 'UEFN Unreal MCP built-in as of 20 August 2026', href: 'https://www.invenglobal.com/articles/24955/speeding-up-development-with-ai-uefn-supports-unreal-mcp-plugin-starting-aug-20' },
      { label: 'uefn-verse-mcp: tick-queued Python, editor is not thread-safe', href: 'https://github.com/quangdang46/uefn-verse-mcp' },
      { label: 'UnrealMasterAI: C++ plugin + WebSocket, GameThread only', href: 'https://github.com/jaguarcode/UnrealMasterAI' },
      { label: 'UCefView: CEF WebView in UE Slate/UMG (5.0-5.8)', href: 'https://cefview.github.io/UCefView/' },
      { label: 'UE-Mapping: React Flow hosted inside UE5 via CEF', href: 'https://github.com/Yunetone/UE-Mapping' },
    ],
  },
{
    id: 'cl014-verse-getinput',
    systemId: 'verse-getinput-cl014',
    title: 'Verse GetInput (CL-014)',
    subtitle:
      'A blocking string read is not a plain-class Verse API. The Open item is leftover fidelity, not a missing printer.',
    problem:
      'Coverage Lab GetInput already emits Print + (x) + empty string. That is user-owned. Verse player input lives on devices and session APIs, not on a class method you would type on a plain object. Inventing GetInput() or a fake Player.GetInput would be the same leak as hidden _subscribe. The research is whether to keep the stub, wait for an Epic-shaped line, or move input onto an environment-pack device node that is not GetInput.',
    constraints: [
      'Do not invent a Verse player API (CL-014).',
      'Honest (x) stays the leftover. Never silent skip a GetInput the user placed.',
      'Canvas source of truth. Do not hide the node from the catalog on Verse.',
      'Environment packs may add device natives. That is a different kind, not GetInput on a class.',
      'Single-target U66/U67 still apply. This is not a COA error on Python.',
      'No live execution in VVS to "just read stdin".',
    ],
    options: [
      {
        id: 'keep-stub',
        title: 'Keep Print + (x) + empty string',
        verdict: 'ship',
        summary:
          'Leave the shipped stub. The node stays visible. Verse output stays honest. Close the item as leftover-fidelity-done, not as a real read.',
        how:
          'No new printer. Docs and the Open row already say this. If Epic later publishes a plain-class read, reopen with a real line, not a helper. Coverage Lab goldens stay as they are.',
        pros: [
          'Matches the lock and the goldens already on main.',
          'Does not pretend Verse has stdin.',
          'User can still see the node and the leftover.',
          'No new API surface to maintain when Epic changes devices.',
        ],
        cons: [
          'Labs still show a hole on Verse. That is honest, but it looks unfinished.',
          'Does not unblock a real interactive Verse sample.',
          'People will keep asking for GetInput until the row is marked done-as-stub.',
        ],
      },
      {
        id: 'invent-player-api',
        title: 'Invent Player.GetInput / blocking read',
        verdict: 'reject',
        summary:
          'Emit a guessed Verse player or console read so the lab looks complete.',
        how:
          'Printer grows a fake API. Goldens go green. Real UEFN compile goes red or silently no-ops.',
        pros: [
          'The lab screenshot looks finished.',
          'Parity with Python input() on paper.',
        ],
        cons: [
          'Breaks CL-014. This is the leak the item exists to prevent.',
          'Not a line you would type in Verse.',
          'Same class of bug as Function Declare without a prototype.',
        ],
      },
      {
        id: 'device-pack-input',
        title: 'Input as an environment-pack device',
        verdict: 'later',
        summary:
          'A different node, spawned from a Verse/UE pack, that prints a real device or input API when that pack is installed. Not GetInput on a class.',
        how:
          'Phase 5 packs can declare a native. GetInput on a plain class stays (x). The new kind is pack-gated, like Bind is language-gated.',
        pros: [
          'Keeps GetInput honest.',
          'Fits engine packs research: natives come from manifests.',
          'Can wait for Epic MCP / device catalog instead of guessing.',
        ],
        cons: [
          'Does not close CL-014. It adds a different node.',
          'Needs the pack format from Phase 5 first.',
          'Easy to name it GetInput and smuggle the invention back in.',
        ],
      },
    ],
    recommendation:
      'Ship the stub as the answer. Mark the leftover done-as-honest-(x), not done-as-real-read. A later device native is a pack node, never a guessed Player API.',
    firstSlice: [
      'Keep current emit. Do not touch the printer.',
      'Reword the Open row to "done as honest leftover" only if you want the item off Open. Otherwise leave planned as a reminder not to invent.',
      'No new Verse GetInput tests that expect a real read.',
    ],
    sources: [
      { label: 'VVS CL-014 lock (roadmap leftover fidelity)', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md' },
      { label: 'visual_to_text_fidelity: never invent language APIs', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/visual_to_text_fidelity.md' },
    ],
  },
  {
    id: 'bind-remaining-langs',
    systemId: 'event-bind-honest',
    title: 'Event Bind (remaining languages)',
    subtitle:
      'C# +=, JS .on, GDScript .connect are shipped. Python, C++, Rust, Go, and Verse still have no honest one-line registration.',
    problem:
      'Bind is one node that prints one registration line. Extra On is illegal until a Bind is on the graph. The other five languages do not have that line in the language itself. C++ multicast += is a library people write on top of std::function. Python and Rust put callbacks in a list. Go uses channels or a bus package. Verse has no +=. Shipping those as Bind would inject a VVS helper, which is U100 again.',
    constraints: [
      'One node, one honest line. No _subscribe, no hidden listener list.',
      'U100 stays cut. Do not spawn event_emit / event_subscribe.',
      'Unspawned or (x) on langs without a line. Do not invent multicast.',
      'Declare / On / Dispatch stay as they are.',
      'COA: Bind on a portable set that includes Python is a failing target, not a stub file.',
    ],
    options: [
      {
        id: 'leave-unspawned',
        title: 'Leave other langs unspawned or (x)',
        verdict: 'ship',
        summary:
          'Catalog already hides Bind where eventBindIsSpawnable is false. Printers already emit (x) Bind if a leftover node exists. That is the product.',
        how:
          'No new printers. Document the three shipped lines as the complete Bind surface. Partial status stays until a language grows a real line of its own, not a VVS header.',
        pros: [
          'Matches the honest-Bind plan already shipped.',
          'Does not reopen U100.',
          'COA refuse-the-target still works: Python in the set plus Bind is an error.',
          'Zero new goldens to fake.',
        ],
        cons: [
          'Item stays partial forever unless a language committee adds a line.',
          'Users on Python will not see Bind in the catalog and will ask why.',
          'Leftover-canvas Bind nodes on Python still need the (x) path.',
        ],
      },
      {
        id: 'inject-helper',
        title: 'Inject a helper list / bus in the other five',
        verdict: 'reject',
        summary:
          'Emit _listeners, std::vector<std::function>, or a vendored bus so Bind "works" everywhere.',
        how:
          'Printers grow a runtime. Dispatch becomes a loop over that list. Same banned shape as event_subscribe.',
        pros: [
          'Eight-language screenshots look symmetric.',
          'COA intersection gets easier on paper.',
        ],
        cons: [
          'Hidden runtime. This is U100.',
          'Not a line you would type.',
          'C++ += blogs are libraries, not the language.',
          'Go channels and Python lists are different models pretending to be Bind.',
        ],
      },
      {
        id: 'per-lang-if-epic-or-std',
        title: 'Add a lang only when the std/host has the line',
        verdict: 'later',
        summary:
          'If a future Verse or C++ standard actually ships a one-line subscribe that is not a helper we wrote, add that pack printer then. Until then, nothing.',
        how:
          'Same gate as csharp/js/gdscript. New row in eventBindIsSpawnable plus one printer test. No shared helper.',
        pros: [
          'Keeps the door open without inventing.',
          'Same consume path as the three shipped langs.',
        ],
        cons: [
          'May never happen for Python/Go/Rust.',
          'Must not treat UE delegates as "C++ Bind" on a plain class.',
        ],
      },
    ],
    recommendation:
      'Ship the current partial as the answer for the other five languages. Do not invent a bus. Reopen a printer only for a real host line.',
    firstSlice: [
      'No printer work. Keep eventBindIsSpawnable as csharp/javascript/gdscript.',
      'Research card is the documentation. Item stays partial.',
      'Do not add Python Bind goldens.',
    ],
    sources: [
      { label: 'C# += subscribe (language line)', href: 'https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/events/how-to-subscribe-to-and-unsubscribe-from-events' },
      { label: 'C++ has no native multicast; += is a library', href: 'https://codesmith.hashnode.dev/building-a-c-style-multicast-event-system-in-modern-c' },
      { label: 'Go event buses are packages, not language', href: 'https://pkg.go.dev/github.com/igorrius/go-vein' },
    ],
  },
  {
    id: 'library-u90-auth',
    systemId: 'library-backend',
    title: 'Library remaining (U90 auth / upload)',
    subtitle:
      'Templates and git import are shipped. Accounts and upload are frozen because the product is client-first.',
    problem:
      'Phase 3 leftover is "vvs-library repo, CI, web UI wiring" plus auth/upload. Auth as a VVS account is the cut hosting track. A community catalog still needs a way to share packs without becoming a SaaS. The fork is stay frozen, share via git only, or unfreeze accounts.',
    constraints: [
      'No VVS accounts as product. No dedicated app server.',
      'Library page redesign and 17 first-party packs already shipped.',
      'Git import already exists. Do not pretend upload requires a new cloud.',
      'Client-first: folder / .vvs / git is how projects move.',
    ],
    options: [
      {
        id: 'git-catalog',
        title: 'Git catalog, no accounts',
        verdict: 'ship',
        summary:
          'Community packs live in a public git repo (vvs-library). The Library page clones/lists manifests. Publish is a pull request. No login.',
        how:
          'Wire the remaining Phase 3 repo + CI to Pages fetch of pack indexes. User adds a git URL. Same path as current git import. Auth/upload stay frozen.',
        pros: [
          'Fits client-first. GitHub/git is the account they already have.',
          'Reuse shipped git import instead of a new backend.',
          'CI on the catalog repo is ordinary GitHub Actions, not a VVS server.',
          'Unfreeze path remains closed, which is the lock.',
        ],
        cons: [
          'Not one-click upload. PR friction is real.',
          'Offline users cannot browse a remote index without a fetch.',
          'Does not close a "my private team catalog" story without a repo they own.',
        ],
      },
      {
        id: 'vvs-accounts-upload',
        title: 'VVS accounts + upload',
        verdict: 'reject',
        summary:
          'Stand up auth and a pack store. Users sign in and upload.',
        how:
          'The cut Phase 2 hosting track. Postgres, GoTrue, tokens. Pages would need a server.',
        pros: [
          'One-click publish.',
          'Private catalogs look easy.',
        ],
        cons: [
          'Breaks no-accounts / no app server.',
          'PWA/enterprise/self-host were cut for this reason.',
          'Code leftovers in the repo are experiments, not a product path.',
        ],
      },
      {
        id: 'stay-frozen',
        title: 'Leave auth/upload frozen, first-party only',
        verdict: 'later',
        summary:
          'Keep 17 packs + git import. Do not build vvs-library until someone is actually publishing.',
        how:
          'Item stays partial. No catalog CI. Docs already say frozen.',
        pros: [
          'Zero work. Lock stays obvious.',
          'No fake "community" page with three sample zips.',
        ],
        cons: [
          'Phase 3 never completes.',
          'Git import stays a power-user path only.',
        ],
      },
    ],
    recommendation:
      'If Phase 3 moves, ship a git catalog with no VVS accounts. Do not unfreeze upload. Frozen is acceptable until there is a real third-party pack to list.',
    firstSlice: [
      'Do not build auth.',
      'If anything ships: a static pack index fetched from a git repo URL, using the existing git import.',
      'Keep the Open row partial until that index exists.',
    ],
    sources: [
      { label: 'VVS roadmap: library remaining frozen, no accounts', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md' },
      { label: 'current_state: first-party templates Done, community Phase 3', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/current_state.md' },
    ],
  },
  {
    id: 'search-embeddings',
    systemId: 'search',
    title: 'Semantic library search',
    subtitle:
      'Token match and language chips are shipped. Embeddings are the leftover people hear as "semantic".',
    problem:
      'librarySearch.ts already filters name/category/language/description on the client. Chips stay visible at count 0. The Open row still says semantic backend TBD. A hosted vector index needs a server. In-browser embeddings (Transformers.js, MiniLM ~23MB q8) can run on WebGPU with WASM fallback, first-download heavy. The product question is whether token search is the answer, or a later optional local model, or a cloud index.',
    constraints: [
      'No dedicated search server, no accounts.',
      'Library must work on static Pages on first paint, not after a 30MB model fetch.',
      'Token + chips stay. Embeddings cannot replace them as the only path.',
      'Client-first: if a model runs, it runs in a Worker, source stays on the machine.',
    ],
    options: [
      {
        id: 'token-is-the-product',
        title: 'Token + chips are the product',
        verdict: 'ship',
        summary:
          'Keep client token match. Mark embeddings as later, not a hole in the current search. Partial stays until you actually add a model, or you close the row as done-for-v1.',
        how:
          'No new backend. Empty-state copy already names search + chip. Docs stop saying "semantic TBD" as if the box is fake.',
        pros: [
          'Works offline, instant, no WASM.',
          'Already shipped and honest.',
          'Seventeen packs and git import are small enough that tokens work.',
        ],
        cons: [
          'Will not match "fireball" to "projectile damage" without shared tokens.',
          'Item stays partial if the row still promises embeddings.',
        ],
      },
      {
        id: 'hosted-vector',
        title: 'Hosted vector index',
        verdict: 'reject',
        summary:
          'Embed packs on a server, query by cosine similarity.',
        how:
          'Needs a store and usually an account. Opposite of Pages.',
        pros: [
          'Best recall on a huge catalog.',
        ],
        cons: [
          'Dedicated server. Cut track.',
          'Pack text leaves the machine.',
          'Overkill for 17 first-party packs.',
        ],
      },
      {
        id: 'local-minilm',
        title: 'Optional in-page MiniLM',
        verdict: 'later',
        summary:
          'A Worker loads Transformers.js MiniLM (about 23MB q8). Embed the local catalog. Token search stays default until the model is cached.',
        how:
          'Lazy load after first paint. WebGPU with WASM fallback. Never block the Library page. No Hub calls if you vendor the onnx.',
        pros: [
          'Still client-first. No VVS server.',
          'Genuine semantic match on-device.',
          'Token path remains if the model fails.',
        ],
        cons: [
          'First load is large for Pages.',
          'Mobile and low-end WASM will hitch.',
          'Need to vendor models or hit Hugging Face at runtime.',
        ],
      },
    ],
    recommendation:
      'Ship token + chips as v1 search. Optional MiniLM is later, never the default fetch. Do not build a vector server.',
    firstSlice: [
      'No embeddings work in this pile.',
      'Keep search partial, or reword to "token search shipped, embeddings later" on the Open row.',
      'Do not add a Hugging Face runtime to Pages verify.',
    ],
    sources: [
      { label: 'Transformers.js (browser WASM / WebGPU)', href: 'https://github.com/huggingface/transformers.js' },
      { label: 'MiniLM embeddings in-browser ~23MB q8', href: 'https://vadimall.com/posts/transformers-js-v4-webgpu-browser-ai-typescript' },
      { label: 'VVS search: token + chips, not embeddings', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md' },
    ],
  },
  {
    id: 'mobile-gestures-radial',
    systemId: 'mobile',
    title: 'Touch gestures and radial menus',
    subtitle:
      'Hide/pin/hit is shipped. Gestures and radial menus are the leftover chrome, not a new editor.',
    problem:
      'Mobile already hides Agent/Bot/StatusBar at 768px, uses 40px coarse pin snap, and larger TopNav hit targets. The remaining ask is multi-touch (pinch, two-finger pan) and radial spawn menus. Those fight the current desktop canvas (React Flow, space-to-spawn, right-click Node Actions) and are easy to ship as a toy that breaks selection. This is UX chrome with a real input-model fork.',
    constraints: [
      'Desktop must not change. Coarse-pointer branches already exist.',
      'No new gesture that duplicates undo or spawn accidentally.',
      'Radial menus were listed with UE/collab as locked leftover needing hardware/intent.',
      'Client-first web. No native app shell required for v1 mobile.',
    ],
    options: [
      {
        id: 'keep-hit-targets',
        title: 'Keep hide / pin / hit. No radial, no extra gestures',
        verdict: 'ship',
        summary:
          'Treat shipped coarse UX as the mobile v1. Pinch-zoom is already React Flow. Do not add a second spawn path until desktop spawn is the one path.',
        how:
          'Leave item partial or close as done-for-v1 with gestures explicitly later. No radial component.',
        pros: [
          'Desktop stays clean.',
          'What shipped is already the high-value mobile work (fat fingers, hidden chrome).',
          'Space spawn and catalog stay one model.',
        ],
        cons: [
          'Phones still lack a comfortable spawn. Long-press is missing.',
          'Row stays partial if copy still promises radial.',
        ],
      },
      {
        id: 'radial-everywhere',
        title: 'Radial spawn on desktop and mobile',
        verdict: 'reject',
        summary:
          'A pie menu around the cursor/finger as the new spawn.',
        how:
          'New overlay, new hit testing, new discoverability vs space and right-click.',
        pros: [
          'Looks like a game editor.',
        ],
        cons: [
          'Third spawn path. Catalog, space, and radial will fight.',
          'Desktop muscle memory already exists.',
          'Easy to ship a demo that misses accessibility and keyboard.',
        ],
      },
      {
        id: 'coarse-long-press-spawn',
        title: 'Coarse long-press opens the existing spawn catalog',
        verdict: 'later',
        summary:
          'On coarse pointers only, long-press empty canvas opens the same spawn menu space already uses. No new radial widget.',
        how:
          'Reuse Graph spawn search. Gate on useCoarsePointer. Desktop unchanged.',
        pros: [
          'One spawn model.',
          'Small, testable, matches shipped coarse branching.',
        ],
        cons: [
          'Long-press vs pan conflict on React Flow.',
          'Still not pinch-to-spawn or radial.',
        ],
      },
    ],
    recommendation:
      'Ship current hide/pin/hit as mobile v1. Later, coarse long-press to the existing spawn catalog. Do not build a radial menu.',
    firstSlice: [
      'No radial work.',
      'Optional later: long-press empty pane on coarse pointer = spawn menu.',
      'Keep desktop right-click and space as they are.',
    ],
    sources: [
      { label: 'VVS mobile partial: hide/pin/hit, gestures later', href: 'https://github.com/Sheriff99yt/VVS-Web/blob/main/docs/roadmap.md' },
    ],
  },
  {
    id: 'reveal-in-explorer',
    systemId: 'folder-os-path',
    title: 'Reveal in Explorer / Finder',
    subtitle:
      'The File System Access API gives opaque handles, not OS paths. A web app cannot tell Explorer where the folder is.',
    problem:
      'Users want "show this .vvs in Explorer". showDirectoryPicker returns a handle with a name, not C:\\.... resolve() only walks relative to a handle you already have. WICG declined absolute paths. Native shells (Electron, Tauri) can shell.openPath. That is a different product than hosted Pages.',
    constraints: [
      'Hosted editor stays a browser. No silent native helper.',
      'Do not fake a path from handle.name (that is not a location).',
      'Folder / .vvs already works via the picker. Reveal is extra chrome.',
      'Client-first does not mean ship an Electron fork to tick this row.',
    ],
    options: [
      {
        id: 'honest-unavailable',
        title: 'Keep the action hidden or disabled with the real reason',
        verdict: 'ship',
        summary:
          'Do not ship a button that cannot work on Pages. If the menu exists, disable it and say the browser cannot see the OS path.',
        how:
          'Status stays planned/blocked. Copy names File System Access API, not "coming soon".',
        pros: [
          'Honest. Matches the Open description already.',
          'No fake path, no extra install.',
          'VS Code web has the same hole.',
        ],
        cons: [
          'Power users on desktop will still want it.',
          'Item never closes while VVS is a web app.',
        ],
      },
      {
        id: 'native-shell',
        title: 'Native helper / Electron / Tauri Reveal',
        verdict: 'reject',
        summary:
          'Ship a desktop wrapper just to call reveal.',
        how:
          'shell.showItemInFolder. Requires a second runtime and a path the web app does not have unless the wrapper owns the folder.',
        pros: [
          'The button would actually work in that wrapper.',
        ],
        cons: [
          'A native app is a new product, not a menu item.',
          'Fights hosted Pages as the editor.',
          'PWA was cut; this is the same shape.',
        ],
      },
      {
        id: 'relative-breadcrumb',
        title: 'Show relative path inside the picked folder',
        verdict: 'later',
        summary:
          'directoryHandle.resolve(fileHandle) can show .vvs/foo.graph.json under the folder the user picked. Not Explorer, but a location they recognize.',
        how:
          'UI breadcrumb from handle.name + relative segments. Copy relative path. Still no Reveal.',
        pros: [
          'Uses the API as designed.',
          'Helps when several graphs sit in one folder.',
        ],
        cons: [
          'Not Reveal in Explorer.',
          'Folder display name is not unique on disk.',
        ],
      },
    ],
    recommendation:
      'Do not ship Reveal on Pages. Keep the item blocked. A later breadcrumb of relative segments is fine. A native wrapper is a different product.',
    firstSlice: [
      'No Explorer integration.',
      'If a menu entry exists, disable it with the API reason.',
      'Optional later: relative path from directoryHandle.resolve.',
    ],
    sources: [
      { label: 'Chrome: File System Access API (handles, not paths)', href: 'https://developer.chrome.com/docs/capabilities/web-apis/file-system-access' },
      { label: 'MDN: resolve() is relative to a directory handle', href: 'https://developer.mozilla.org/en-US/docs/Web/API/File_System_API' },
      { label: 'WICG: absolute paths will not be added', href: 'https://github.com/WICG/native-file-system/issues/145' },
      { label: 'Stack Overflow: full path is not revealed', href: 'https://stackoverflow.com/questions/69236490/how-do-you-get-the-selected-directory-path-from-file-system-access-api-window-sh' },
    ],
  },
];
