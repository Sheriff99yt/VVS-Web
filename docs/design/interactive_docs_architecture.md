# Interactive documentation architecture

**Status:** planned. Roadmap id `interactive-node-docs`. Research tab card `interactive-node-docs-research`.
**As of 24 August 2026.** Client-first, GitHub Pages, no docs server.

## Contents

- [Part I ? Product law and selected URL contract](#part-i--product-law-and-selected-url-contract)
- [Part II ? Technical analysis](#part-ii--technical-analysis)
- [Part III ? Research and future horizon](#part-iii--research-and-future-horizon)

## Part I ? Product law and selected URL contract

**Local index:** [Product law](#product-law) ? [Selected](#selected) ? [Goal](#goal) ? [Source of truth](#source-of-truth) ? [URL contract](#url-contract-this-is-the-app-api) ? [App integration](#app-integration)

### Product law

- Client-first: no VVS accounts, no docs microservice, no product accounts to read help.
- Canvas / node / option / pin is source of truth. Generated tables come from `syntax-registry` `list()`. Overlays must not invent ports, kinds, or language APIs.
- Leftover honesty: if Generate would print `(x)`, the live page says leftover first.
- Publish path: `main` ? `ci.yml` ? `pages.yml` ? `https://sheriff99yt.github.io/VVS-Web/` with `basePath` `/VVS-Web`.
- **Today in tree:** architecture + roadmap + Research card. **Not shipped:** `/docs` App Router route, `docsUrl()` helper, info icon on `VVSNode`.

### Selected

HTML-first SSG catalog from the registry. Playground later. JS-only SPA or hosted-key docs: **Rejected** ? empty HTML fails crawlers, GEO, and client-first Pages.

## Goal

Every public **node**, **option**, and **feature** has a stable URL. Clicking the info control on a canvas node (and later on an option row or a feature chip) opens that URL. The same HTML is the SEO / GEO / `llms.txt` source.

Non-goals for v1: full in-browser VVS engine, i18n, Mintlify hosting, a second node model.

## Source of truth

| Layer | Lives in | Owns |
|-------|----------|------|
| Kinds, pins, defaults, enums | `packages/syntax-registry` (`core-pack.json`, `list()`) | Generated tables. Engine wins CI. |
| Spawn labels / categories | `apps/web/src/lib/nodeCatalog.ts` (wraps `list()`) | Same `kindId` the canvas stores on `data.kindId`. |
| Narrative ("when to use") | Overlay markdown next to the registry, not instead of it | Humans. Cannot invent ports. |
| Feature essays | Overlay only (undo, groups, Generate, leftover `(x)`, …) | Humans. |
| Shared option widgets | Overlay + a small widget catalog (enum, bool, number, language gate) | Shared `#opt-*` language. |

`kindId` is the public id. Examples already in the catalog: `action_print`, `flow_branch`, `event_bind`, `function_define`. Do not slugify a second name. If a kind is renamed, keep a redirect from the old id.

Hidden / cut kinds (`event_emit`, `event_subscribe`) are **not** public pages unless marked `status: cut` with a successor link.

## URL contract (this is the app API)

Live site: `https://sheriff99yt.github.io/VVS-Web/` (`basePath` `/VVS-Web` when `GITHUB_PAGES=true`).

| Thing | Path (after basePath) | Example |
|-------|------------------------|---------|
| Docs home | `/docs` | catalog + search |
| Node | `/docs/nodes/{kindId}` | `/docs/nodes/flow_branch` |
| Node option | `/docs/nodes/{kindId}#opt-{optionId}` | `/docs/nodes/action_wait#opt-seconds` |
| Node pin | `/docs/nodes/{kindId}#in-{pinId}` / `#out-{pinId}` | `/docs/nodes/math_add#in-a` |
| Feature | `/docs/features/{slug}` | `/docs/features/generate` |
| Shared option type | `/docs/options/{type}` | `/docs/options/enum` |
| Markdown twin | `/docs/nodes/{kindId}.md` | bots / `llms.txt` |
| JSON twin | `/docs/nodes/{kindId}.json` | same fields as the table |

One helper in the app (to add; not shipped yet):

```ts
docsUrl({ type: 'node', id: kindId, hash?: `opt-${id}` })
// local:  /docs/nodes/flow_branch
// Pages:  /VVS-Web/docs/nodes/flow_branch
```

Rules:

- Same helper for editor, Library spawn list, and roadmap copy. Never hardcode the GitHub Pages host in node chrome.
- Open in a **new tab** (`target="_blank"` + `rel="noreferrer"`). The graph stays put.
- Missing kind: `/docs/nodes/{kindId}` still builds a stub page ("undocumented") so the icon never 404s. CI tracks stubs.
- Dynamic symbol rows (a user function, not a core kind) do **not** get a core page. Info goes to `/docs/features/symbols` or the Declare kind page.

## App integration

Today: `VVSNode` header is title + metadata only (`VVSNode.tsx`). Hover chrome (`NodeHoverChrome.tsx`) is modifiers / import language gate. **No info icon yet.**

### Node info icon (first editor slice)

- Place a small `CircleHelp` / info control on the **node header**, always visible at a readable hit target (do not hide it only in hover chrome; hover-only fails on touch).
- `aria-label`: `Open documentation for {title}`.
- `href` = `docsUrl({ type: 'node', id: resolveNodeKindId(data) })`.
- Tooltip: "Docs".
- `nodrag nopan` so it does not start a drag.
- Same control later on: Library catalog cards, option inspectors (`#opt-`), feature rows in settings.

### In-app vs site

Phase 1: icon opens the **hosted Pages URL** (or local `/docs` in dev).
Phase 2: optional in-app panel that fetches the markdown twin (static file) if we want F1 without leaving the editor. Same URL ids. Do not write a second article.

## Part II ? Technical analysis

**Local index:** [Page anatomy](#page-anatomy-node) ? [Build pipeline](#build-pipeline-pages-native) ? [Schema](#schema-sketch-node-docv1) ? [SEO / GEO / bots](#seo--geo--bots-locked)

## Page anatomy (node)

HTML-first. If JS is off, the page still reads.

1. **H1** = node title. First paragraph = one-sentence definition (this is the GEO quote).
2. **Meta**: unique title + description. Canonical. Open Graph.
3. **Status** chip: stable / partial / cut / undocumented.
4. **Ports table** (`<table>`): id, direction, types, required, default, summary. Row `id="in-image"`.
5. **Options table**: id, type, default, min/max/enum, summary. Row `id="opt-radius"`.
6. **When to use / pitfalls** (overlay MD, optional).
7. **Related** kinds + features.
8. **Playground** (later): one widget, progressive enhancement. Never the only copy.
9. JSON-LD `TechArticle` only when the page has real prose, not an empty stub.

Feature pages and option-type pages follow the same first-paragraph + table rule.

## Build pipeline (Pages-native)

```
syntax-registry list()
        │
        ▼
 node-doc.v1 JSON (generated)
        │         + overlay/*.md
        ▼
 Next static export  (GITHUB_PAGES=true, existing pages.yml)
        │
        ├─ /docs/nodes/{kindId}/index.html
        ├─ /docs/nodes/{kindId}.md
        ├─ /docs/nodes/{kindId}.json
        ├─ sitemap.xml + robots.txt
        └─ llms.txt / llms-full.txt
```

- New App Router routes under `apps/web/src/app/docs/...`.
- `generateStaticParams` from the registry so `output: 'export'` emits **real HTML per slug**, not an empty client shell.
- `basePath` `/VVS-Web` already in `next.config.ts`. All doc links and the sitemap use it.
- Keep `.github/workflows/ci.yml` and `pages.yml`. Add a CI check: every public `kindId` has a page (or an explicit `undocumented` / `internal` flag). Overlay must not list a port the registry does not have.
- Search: Pagefind **after** `next build`, bundle in `pagefind/` (not `_pagefind/`). Optional later.

## Schema sketch (`node-doc.v1`)

```json
{
  "id": "flow_branch",
  "title": "Branch",
  "category": "Flow Control",
  "status": "stable",
  "summary": "Takes a boolean and continues on true or false.",
  "ports": [{ "id": "condition", "dir": "in", "types": ["boolean"], "required": true }],
  "options": [],
  "related": ["flow_switch", "flow_sequence"],
  "features": ["leftover-honesty"]
}
```

Generated fields win. Overlay may set `summary`, pitfalls, related prose.

## SEO / GEO / bots (locked)

- Unique URL, title, H1, meta description per node / feature / option-type.
- Crawlable HTML in `apps/web/out` (the Pages artifact).
- `robots.txt` + `sitemap.xml` listing every public slug (with basePath).
- Canonical + Open Graph.
- `llms.txt` index + `.md` / `.json` twins (n8n pattern).
- First paragraph is a definition an answer engine can quote.
- No cloaking. Playground does not replace the tables.
- GEO here means **generative engine optimization**, not geography.

## Part III ? Research and future horizon

**[Research]** Phases below are planned. Checkboxes use `[x]` only for items that exist in tree.

**Local index:** [Phased plan](#phased-plan) ? [Risks](#risks) ? [Open questions](#open-questions) ? [Implementation order](#implementation-order-when-we-build) ? [Future horizon](#future-horizon)

## Phased plan

### Phase 0 — contract (this doc + Research card)

- [x] Roadmap item `interactive-node-docs`
- [x] Research study with ship / later / reject
- [x] This architecture
- [ ] `docsUrl()` helper + unit tests for local vs `/VVS-Web`

### Phase 1 — editor link + stub catalog

- Info icon on `VVSNode` header → node URL.
- `/docs` + `/docs/nodes/[kindId]` static pages generated from `list()`.
- Stub is enough: title, summary from registry label, ports table, "docs incomplete" badge.
- `sitemap.xml`, `robots.txt`, `llms.txt` for those slugs.
- CI: no 404 for a public kindId.

### Phase 2 — prose + options + features

- Overlay MD for flagship kinds (Branch, Print, Bind, Declare Function, Wait, …).
- Option anchors + info on inspector rows.
- Feature pages: Generate, leftover `(x)`, node/option/pin grammar, packs, Pages/local persist.
- Pagefind.

### Phase 3 — playground

- One Try-it per page. Hover option ↔ highlight control.
- Copy graph JSON. Before/after stills when the node cannot run in-browser.
- In-app F1 panel that loads the markdown twin (optional).

### Phase 4 — generate-from-engine only

- Registry dump is a build artifact. Overlays never hand-edit generated JSON.
- In-app help and website are viewers of the same files.

## Risks

| Risk | Mitigation |
|------|------------|
| Icon 404s on Pages basePath | Single `docsUrl()`; test with `GITHUB_PAGES=true`. |
| Client-only `/docs` empty HTML | `generateStaticParams` + inspect `apps/web/out/docs/nodes/.../index.html` in CI. |
| Docs invent ports | Overlay schema check vs `list()`. |
| Dynamic user symbols | Do not mint `kindId`s; send info to the Declare/Call feature page. |
| Hover-only icon | Always-visible header control. |

## Open questions

1. Public `summary` field on each registry item today, or overlay-only until we add it?
2. Option ids: do inspector properties already have stable ids we can use as `#opt-*`?
3. Should Library cards get the icon in the same slice as the canvas node?

## Implementation order (when we build)

1. `docsUrl()` + tests.
2. Header info icon on `VVSNode`.
3. Static `/docs/nodes/[kindId]` from `list()`.
4. sitemap / robots / llms.txt.
5. Overlays + features.
6. Playground last.

Do not start hosted docs, Algolia keys, or a docs microservice.


## Future horizon

**[Research] ? planned.** Not a shipped protocol. The first slices make a catalog that does not lie. The longer bet is that **docs become a protocol the product speaks**, not a brochure next to it. If that holds, five years from now the website, the canvas info icon, the in-page agent, a VS Code host, and an Unreal attach path all open the **same ids**. Nobody writes a second Branch article for "the engine."

### Docs as a protocol

Treat `/docs/nodes/{kindId}` the way we treat IR kinds: a public, stable name. The HTML page is one projection. The `.md` and `.json` twins are the same record. The editor tooltip is `summary`. The agent tool is `get_node_doc(kindId)`. The VS Code hover is that JSON. If a surface cannot consume the record, it does not get a private rewrite.

That is why we refuse a Mintlify body that is not generated from the registry, and why we refuse an in-app help essay that is not the markdown twin. Drift is not a docs bug. It is a second product.

### Context-aware help (same URL, extra query)

The icon always lands on the kind page. Later, the editor may pass **context it already knows**, never a new identity:

| Query | Meaning | Rule |
|-------|---------|------|
| `?lang=verse` | Highlight what this kind emits in the current pack | Dim or leftover `(x)` must match Generate, not a prettier story |
| `?opt=seconds` | Scroll/highlight an option | Same as `#opt-seconds` |
| `?from=leftover` | Open the honesty note | If Generate would print `(x)`, the page says so first |
| `?example=wait-then-print` | Load a checked-in graph snippet | Snippet ids are real files, not prompt text |

Do not mint `/docs/nodes/flow_branch_verse`. Language is a view over one kind. Eight sites is how we get eight lies.

### The page can talk back to the canvas

Once graph JSON is canonical, a docs example is not a screenshot. It is a **tiny graph document**:

- "Copy graph" writes the same JSON the editor already imports.
- "Open in VVS" is `https://sheriff99yt.github.io/VVS-Web/editor?example=wait-then-print` or a `.vvs` download. Native hosts use a file, not a web-only scheme, when the OS needs a path.
- "Drop Branch" from the page is the spawn catalog row (`kindId`), not a special docs node.

The teaching loop becomes: read the definition → drop the example → Generate → the leftover note on the page matches the panel. If they disagree, the page is wrong.

### Versions without a museum

Cut a docs version when the **node ABI or `.vvs` schema** breaks, not on every push. Follow the Docusaurus habit: few frozen trees, current is default.

- Current Pages site is always "the product as of this `main`."
- `/docs/v/{schemaVersion}/nodes/flow_branch` exists only after a breaking cut.
- Removed kinds 301 to a successor. Cut kinds stay as `status: cut` with the date and the replacement (`event_emit` → Dispatch / Bind).
- Old Pages artifacts can stay on GitHub releases. Do not keep twelve live trees.

### Language packs and environments

A node page has one ports table. Under it, a **pack matrix**: Python / JS / C++ / C# / GDScript / Go / Rust / Verse — emit shape, or honest leftover. That matrix is generated from the same printers Generate uses. If a cell is green on the page and `(x)` in the panel, CI fails.

Environment packs (Godot, console, future UE/Verse natives) get **feature pages** and, when they add kinds, real `kindId`s. Do not document a Verse device API we invented. The docs rule is the same as the canvas rule.

### Agents, GEO, and "do not invent a node"

The in-page agent, Cursor, and answer engines will all hit this surface. Design for that now:

- `llms.txt` lists every public kind. `llms-full.txt` is the concatenated markdown twins (size-capped; link the rest).
- A future agent tool `get_node_doc` / `search_docs` returns the JSON twin, not a hallucinated schema.
- If the model wants a node that is not in the registry, the only legal move is leftover + link to `/docs/features/leftover`. That is U93's honesty rule applied to help.
- GEO (generative engine optimization) is this: a quotable first paragraph, tables instead of canvas-only facts, stable ids, changelog. It is not keyword stuffing and not a hidden "AI" page.

Five years out, "how does Bind work in GDScript?" should be answerable by citing `/docs/nodes/event_bind?lang=gdscript`, not by a blog.

### Native hosts

VS Code and a future UE6 attach path do not get a second manual. They open the same URL or embed the markdown twin.

- VS Code: hover on a generated source span (source map) → kind page. Command "VVS: Open node docs."
- Unreal / UEFN: after a real engine exists, "open docs" on a VVS node still uses `kindId`. No Slate-only help book.
- Offline: a zipped `docs/` from the Pages artifact in the release zip we already publish. The icon falls back to the zip when there is no network. Same files.

### In-app F1, later — still not a second article

When we want help without leaving the graph: a side panel loads the **markdown twin** (static fetch, no API). F1 / `?` on a selected node is the icon action with `target=panel`. Selection of a pin opens `#in-*`. The panel is a viewer. If the fetch fails, the icon still has the Pages href.

### Community and compounds

Core kinds stay first-party. If the Library ever grows user graphs-as-nodes, those pages are **graph documents with a summary**, not forged `kindId`s in `core-pack.json`. A community overlay repo (Comfy `embedded-docs` shape) can PR prose, never ports.

Preset / compound nodes (if we ever ship them) are catalogued as instances with a link to their inner graph, the Substance distinction: primitive vs library instance.

### Teaching, not a course platform

A future `/docs/learn/...` can be a sequence of example graphs that Generate. It is still the catalog underneath. We do not become an LMS. We do not hide a node from the catalog because it is "advanced." Status chips tell the truth.

### Accessibility and media

Tables stay real `<table>`s. Icon hit targets stay large. Playground is enhancement. Before/after stills get transcripts ("Branch with true takes the top exec pin"). No autoplay GPU circus on a docs page.

### What we still refuse in five years

- A docs microservice or product accounts to read help.
- Play / run-from-docs. Execution stays out of VVS.
- Invented language APIs to make a page look complete.
- Per-host manuals that disagree with Generate.
- Cloaking a rich page for Google and a different page for the user.

### North-star stories

1. A new user clicks info on Branch, reads one sentence, drops the example, Generates, sees the `if` they expected.
2. Someone on Verse hits leftover on GetInput, follows `?from=leftover`, and is told we will not invent a player API — same text as the Research card.
3. The in-page agent is asked "wire a wait then print." It reads `action_wait` and `action_print` JSON, spawns those kinds, and cites the pages. It does not spawn `event_subscribe`.
4. A VS Code user hovers the generated `connect` line, lands on `event_bind`, GDScript cell.
5. An answer engine quotes the Bind first paragraph and links the stable URL. The quote is still true because CI generates that paragraph's facts from the registry.

If a future idea cannot serve those stories without a second source of truth, it is not a docs feature.
