# U93: source to visual import

Status: experimental JavaScript class import slice implemented, 30 September 2026. General code-to-visual import (U93) remains open.

## Implemented slice

Start → **Import JavaScript source…** reads a local file or pasted text, classifies every UTF-16 source offset, and builds a read-only graph/code review. Acceptance saves a fresh browser project and opens the editor; it cannot overwrite an open project or host file. The original full file, SHA-256, file name and selected offsets persist in `class_define.properties.sourceImport`.

The closed unit is one plain named JavaScript class. It must already have a non-static `on_start` method, and the reviewer must explicitly map that method to VVS's required program entry event. No entry method is invented and the normal blocking analyzer rules remain unchanged. Other methods may be ordinary or static, with identifier parameters. Bodies support one value-return statement or one complete if/else whose branches recursively end in value returns. Expressions support parameter reads, finite number/string/boolean literals, and + / - / * / / arithmetic. Unresolved names, calls, local declarations, receiver access, empty bodies, duplicate methods, exports, inheritance, constructors, async/generators, class fields and embedded comments cannot be accepted.

`sourceImportGraph.ts` uses registry kinds and existing binding helpers to materialize visible Class Declare, Function Declare/Define, entry event Declare/On, function body entries, Return, If and Math nodes. Symbols and documents are built together in an isolated snapshot. Ordinary `analyzeProject` errors block acceptance. Generate then parses again and must match the selected source AST after discarding locations/comments/spelling metadata and empty statements. This permits formatting, equivalent parentheses/quote style and harmless trailing semicolons; it does not approximate executable behavior. An emitter limitation such as invalid escaped strings blocks acceptance rather than replacing the source.

Import is lazy loaded and bounded to 128 KiB, 32 methods and 512 nodes; larger files are refused before parsing rather than blocking the UI with an unbounded import. A worker and broader limits remain later work. The preview is a separate read-only React Flow store; accepted graphs use the existing editor. Source outside the class stays in provenance and is explicitly excluded from generated output. No runtime or automatic source synchronization is added.

Verification: web suite, type checking, lint and production build; browser review → acceptance → reload with provenance retained. This slice is intentionally narrower than the original standalone-function proposal below: existing Generate is class-shaped and the analyzer requires program entry. Standalone functions need a separate module-scope design before they can pass the same gate.

## Goal and boundary

Let an author inspect an existing source file and accept a **supported region** as an editable VVS graph. The imported graph becomes authoritative only for that accepted region. Source outside it remains the author's original file; VVS must not claim to own or regenerate it. An import is an explicit, one-time operation. Re-importing edits from the original file is a separate feature with separate conflict rules.

This keeps the current contract: every line VVS generates comes from a visible node. It does not add a runtime, server, or account. The original source never leaves the browser during the default import path.

## Why the old direct CST to IR plan needs a seam

`packages/transpiler/src/ir/types.ts` describes graph-derived statements with `sourceGraphNodeId`, and `graphToIr` assumes VVS nodes, documents, symbols, and roles. Arbitrary source lacks many of those facts. A syntax tree determines the *written* constructs, but cannot infer that `on_go()` is a VVS Dispatch or an ordinary method call, or that a method declaration belongs to a particular canvas chain. Passing a parsed tree straight to the existing IR would hide guesses.

Add a source-linked **import plan** before graph materialization. It describes candidate regions, exact spans and source text, diagnostics, and the explicit VVS construct each candidate proposes. The plan is inspectable without mutating a project. A validated mapper then creates normal graph nodes and symbol indexes together; the existing analyzer and generator verify the result. Do not persist the import plan as a second canonical graph.

## Import plan contract

- Preserve the full original file and a content hash. Span offsets refer to this immutable input; retain line and column for display. Track parser errors and comments, including text between candidates.
- Each candidate names its syntax span, proposed VVS node kind and option/pin mapping, required symbol context, and the reason for its confidence. The UI must not turn an ambiguous role into a confirmed node.
- Represent every skipped or unresolved region with its original text and reason. A gap is **not** a generated `(x)` node containing executable source: today's `(x)` is an explanatory comment and would silently disable code if exported.
- Adjacent supported statements cannot be accepted as a whole when control flow, definitions, imports, decorators, or unsupported text between them changes their behavior. The selection boundary must be a closed unit such as a whole function or module. Preserve file order.
- Import cannot overwrite an existing project or source file automatically. Show generated output and the source difference before accepting a new graph; any later write to a host file requires its existing integration policy.
- Never call user supplied code while parsing, mapping, or validating.

## First implementation slice

`apps/web/src/lib/sourceImportPreview.ts` is the read-only JavaScript source classifier used by this slice (including the earlier standalone-function candidates). It records the original text and SHA-256, divides the input into exact candidate/unresolved/trivia spans, and refuses function candidates with unsupported statements, embedded comments, or parse errors. Candidate means only that a later mapper may evaluate the region; it is not an assertion of VVS graph fidelity. This parser choice is provisional and must still be compared with alternatives before expanding this experimental slice.

1. **Read-only preview.** Parse one local JavaScript file in the browser, with a worker for large input. Compare Tree-sitter and the existing JavaScript tooling on bundle size, browser loading, recovery, span fidelity, and maintenance. Do not select a parser solely because its syntax tree is incremental; one-shot import is the first requirement.
2. **Closed mapping.** Start with whole, standalone functions containing literal/local expressions, local assignment, simple calls, `if`, and `return`. Do not infer VVS event roles, receiver ownership, external call signatures, async semantics, or class lifecycle. Reject a candidate if any child statement cannot map to a visible node and compatible pins.
3. **Graph materialization.** Build graph documents, registry-backed node ports, symbol entries and visible Declare/Define nodes as one operation. Use a simple deterministic layout after wiring. Run ordinary VVS analysis and Generate against the candidate snapshot without mutating the open project. Only a graph with no blocking diagnostics can be offered for acceptance.
4. **Review and accept.** Show supported and unresolved source ranges, proposed graph, and generated code/diff. The user accepts a new graph; the original file is left alone. Do not claim whole-file import if only one function qualifies.

The first slice excludes TypeScript-specific syntax, modules, classes, closures, dynamic calls, comments that cannot be placed faithfully, and automatic synchronization. A language can be added after its mapping and round-trip evidence pass the same gate.

## Verification gates

| Gate | Check |
|---|---|
| Coverage | Every UTF-16 source offset is classified as accepted, preserved outside the graph, or unresolved; gaps are shown. |
| Fidelity | Compare the selected source region with generated output, including control flow, evaluation order, scope, calls, and comments. Syntactic normalization is disclosed; unresolved behavior blocks acceptance. |
| Graph validity | Existing schema/analyzer accepts the document. Every generated line maps to a visible node; symbols and define nodes agree. |
| Generated fixtures | Generate existing VVS JavaScript fixtures, import a supported subset, and compare their normalized graph semantics and output. Canvas coordinates and generated IDs are excluded. |
| Real files | Test hand-written code with unsupported syntax, malformed input, comments, and ambiguous calls. No source is dropped or replaced on a rejected import. |
| Project safety | Preview is read-only; acceptance creates a new document only after explicit confirmation. Existing files stay byte-for-byte unchanged. |

Passing tests on VVS-generated files alone does not establish support for arbitrary code. A parser's recovery from an error is a diagnostic, not proof of semantic correctness. Avoid promising graph identity where the original text has no layout, graph IDs, or VVS roles.

## Later work

Add more mappings one construct at a time, followed by other languages. Source-linked provenance can enable targeted re-import later, but must include file hashes, changed-range reconciliation, and conflicts for simultaneous graph/source edits. An optional agent may suggest a mapping for an unresolved span; it cannot accept or write a graph without review.
