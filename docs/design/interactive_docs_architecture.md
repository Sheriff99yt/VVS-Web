# Interactive documentation architecture

**Status:** planned. Roadmap id `interactive-node-docs`. Research tab card `interactive-node-docs-research`.
**As of 24 August 2026.** Client-first, GitHub Pages, no docs server.

This is the contract for a public docs surface that the **editor can deep-link into**, and that **Google, answer engines, and bots** can read without running the canvas.

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
