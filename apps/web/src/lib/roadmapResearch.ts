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
];
