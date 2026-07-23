# VVS Library Backend API

**Status:** Phase 3 (Planned) — Implementation started  
**Architecture:** Git-based public library, no dedicated server per locked product direction

---

## Overview

The Library backend provides read/write access to community-shared scripts, node packs, and templates. The library itself is a **separate public GitHub repository** (`vvs-library`) that acts as the single source of truth.

### Key Design Principles

- **Public static content** — all library items are `.json` files in a public repo
- **GitHub-backed** — scripts are submitted via PRs, merged to main branch
- **Client-first queries** — VVS Web queries the backend; backend queries GitHub API or local cache
- **No dedicated server** — library metadata lives in Postgres; graph content in git
- **Rate-limited uploads** — 10 scripts per user per day to prevent spam

---

## Database Schema

### `library_items`

Stores metadata for all library items. Graph content can be inline (JSONB) or referenced from git.

```sql
CREATE TABLE library_items (
    id TEXT PRIMARY KEY,                      -- slug from title
    type VARCHAR(20) NOT NULL,                -- 'script', 'node_pack', 'template'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tags TEXT[],
    author VARCHAR(255) NOT NULL,             -- GitHub username
    graph JSONB NOT NULL,                     -- full ProjectSnapshot
    target_languages TEXT[],                  -- ['Python', 'Verse', ...]
    node_count INTEGER,
    rating FLOAT DEFAULT 0,                   -- avg of ratings table
    downloads INTEGER DEFAULT 0,              -- incremented on each fetch
    version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    license_id VARCHAR(50),                   -- 'MIT', 'Apache-2.0', etc.
    github_url TEXT                           -- link to PR/commit
);
```

### `library_ratings`

One-per-user-per-item rating system.

```sql
CREATE TABLE library_ratings (
    id SERIAL PRIMARY KEY,
    item_id TEXT NOT NULL REFERENCES library_items(id),
    user_id TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(item_id, user_id)                  -- one rating per user
);
```

---

## API Endpoints

### Search & Browse (Public)

#### `GET /library/search`

Search and filter library items.

**Query Parameters:**

| Param | Type | Example | Notes |
|-------|------|---------|-------|
| `q` | string | `"state machine"` | Searches title + description (ILIKE) |
| `type` | string | `"script"` | Filter by: `script`, `node_pack`, `template` |
| `languages` | CSV | `"Python,Verse,C++"` | Filter by target language |
| `tags` | CSV | `"ai,ml,math"` | Filter by tags (must match any) |
| `sortBy` | string | `"downloads"` | `downloads`, `rating`, `createdAt` |
| `page` | int | `1` | Pagination (default: 1) |
| `pageSize` | int | `30` | Items per page, max 100 (default: 30) |
| `semantic` | bool | `true` | Use pgvector similarity search (optional) |

**Response:**

```json
{
  "items": [
    {
      "id": "state-machine-fsm",
      "type": "script",
      "title": "Finite State Machine",
      "description": "...",
      "author": "john-doe",
      "rating": 4.5,
      "downloads": 342,
      "targetLanguages": ["Python", "Verse"],
      "version": "1.0.0"
    }
  ],
  "total": 12,
  "page": 1
}
```

---

#### `GET /library/scripts/{id}`

Fetch a complete library item (including full graph).

**Response:**

```json
{
  "id": "state-machine-fsm",
  "type": "script",
  "title": "Finite State Machine",
  "description": "...",
  "author": "john-doe",
  "graph": {
    "projectName": "My FSM",
    "targetLanguage": "Python",
    "graphs": [...]
  },
  "tags": ["control-flow", "oop"],
  "rating": 4.5,
  "downloads": 343,
  "targetLanguages": ["Python", "Verse"],
  "nodeCount": 42,
  "version": "1.0.0",
  "createdAt": "2026-07-01T10:00:00Z",
  "updatedAt": "2026-07-15T14:30:00Z",
  "licenseId": "MIT",
  "gitHubUrl": "https://github.com/vvs-library/scripts/blob/main/state-machine/..."
}
```

**Side effect:** Increments `downloads` count (asynchronously).

---

#### `GET /library/statistics`

Get library-wide stats.

**Response:**

```json
{
  "totalItems": 1024,
  "totalScripts": 750,
  "totalNodePacks": 200,
  "totalTemplates": 74
}
```

---

### Upload (Protected)

#### `POST /library/scripts`

Upload a new script (requires GitHub OAuth authentication).

**Headers:**

```
Authorization: Bearer <JWT token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "My Cool State Machine",
  "description": "A reusable FSM pattern for game logic",
  "graph": { /* full ProjectSnapshot */ },
  "targetLanguages": ["Python", "Verse"],
  "tags": ["control-flow", "game-dev"],
  "licenseId": "MIT"
}
```

**Validation:**

1. **Auth:** JWT must be valid (expires in 24h)
2. **Title:** 3–255 characters, no duplicates
3. **Graph:** Valid JSON, non-empty, passes schema check
4. **Rate limit:** 10 uploads per user per day
5. **Moderation:** Checks for spam patterns (placeholder)

**Response (201 Created):**

```json
{
  "id": "my-cool-state-machine",
  "type": "script",
  "title": "My Cool State Machine",
  "description": "...",
  "author": "your-github-username",
  "graph": { /* ... */ },
  "version": "1.0.0",
  "createdAt": "2026-07-23T12:00:00Z",
  ...
}
```

**Background workflow:**

1. Item is inserted into `library_items` table
2. **Async job** creates a GitHub PR in `vvs-library` repo:
   - Adds script to `scripts/{slug}/script.json`
   - Adds metadata to `scripts/{slug}/metadata.json`
   - Updates `_index.json`
3. GitHub Actions CI validates graph structure
4. PR auto-merges after 24h or on manual approval
5. `github_url` field is updated once merged

**Error responses:**

| Status | Error | Cause |
|--------|-------|-------|
| `400` | `"invalid graph: ..."` | Graph fails validation |
| `400` | `"content blocked by moderation: ..."` | Spam/prohibited patterns |
| `401` | `"unauthorized"` | Missing or invalid JWT |
| `429` | `"rate limit exceeded"` | > 10 uploads/day |

---

## Client Integration

### TypeScript Types

See `apps/web/src/types/libraryService.ts` for full type definitions:

- `LibraryItem` — full item with graph
- `LibraryItemSummary` — summary for search results
- `UploadScriptRequest` — request to upload
- `LibrarySearchRequest` — search/filter params

### Client Functions

See `apps/web/src/lib/libraryClient.ts`:

```typescript
// Search
await searchLibrary({ q: 'state machine', type: 'script', page: 1 });

// Get full item
await getLibraryItem('state-machine-fsm');

// Upload
await uploadScript({
  title: 'My Script',
  description: '...',
  graph: projectSnapshot,
  targetLanguages: ['Python'],
  tags: ['ai'],
  licenseId: 'MIT',
}, authToken);

// Stats
await getLibraryStatistics();
```

---

## GitHub Integration

### Library Repository (`vvs-library`)

A separate public repository that stores the authoritative library content.

**Structure:**

```
vvs-library/
├── scripts/
│   ├── state-machine-fsm/
│   │   ├── script.json          # Full ProjectSnapshot
│   │   └── metadata.json        # Title, author, tags, etc.
│   ├── calculator/
│   └── ...
├── node-packs/
├── templates/
├── _index.json                  # Auto-generated master index
└── .github/workflows/
    └── validate.yml             # CI job: validate scripts
```

### Upload → PR Workflow

1. User calls `POST /library/scripts` with title, graph, etc.
2. Backend inserts to `library_items` table
3. **Async job** calls GitHub API:
   ```
   POST /repos/{owner}/{repo}/pulls
   {
     "title": "Add script: My Cool State Machine",
     "head": "script/my-cool-state-machine",
     "base": "main",
     "body": "..."
   }
   ```
4. Pushes commit: `scripts/my-cool-state-machine/script.json` + `metadata.json`
5. GitHub Actions runs:
   - Validates graph JSON schema
   - Counts nodes
   - Tests code generation for all target languages
   - Regenerates `_index.json`
6. PR auto-merges on success (or after 24h manual approval)
7. Backend updates `github_url` field once merged

---

## Performance & Caching

### Query Optimization

- **Indexes:** `type`, `author`, `created_at`, `downloads`, `rating`, full-text search
- **Pagination:** Always required; max 100 items/page to prevent table scans
- **Lazy evaluation:** Graph JSON not fetched in search results — only summary fields

### Caching Strategy

1. **IndexedDB (client):** Cache search results, recent items (1h expiry)
2. **In-process (Go):** Cache `_index.json` + statistics (5min expiry)
3. **CDN (future):** Static `_index.json` served from Pages

---

## Rate Limiting

| Resource | Limit | Window |
|----------|-------|--------|
| Upload script | 10/user | per day |
| Search | 100 | per minute (IP-based) |
| Download (GET item) | — | unlimited |

---

## Future Enhancements

- [ ] Semantic search via pgvector embeddings
- [ ] Comments / discussion threads per script
- [ ] Version history (multiple graph versions per ID)
- [ ] Collaborative editing (Session P2P)
- [ ] Analytics dashboard (downloads, ratings over time)
- [ ] Moderation UI (flag/remove scripts)
- [ ] Auto-generated OpenAPI spec for external tools

---

## Related Documentation

- **Roadmap:** `docs/roadmap.md` (Phase 3)
- **Library Plan:** `docs/library-backend-api.md` (this file)
- **Project Requirements:** `docs/project_requirements.md` §3.5
- **Deployment:** `docs/deployment.md` (database setup)
