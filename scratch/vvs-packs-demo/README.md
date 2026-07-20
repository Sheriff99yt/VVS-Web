# VVS Pack Versions Demo (U78)

Sample pack manifests + publishing guide for the Pack Versions manager view.

## File naming convention (REQUIRED)

Uploaded assets in GitHub Releases must match this regex:

```
^([a-z]+)\.(base|[a-z][a-z0-9-]*)@([0-9]+[^@]*)\.json$
```

| Pack type    | Filename                              | id                |
|--------------|---------------------------------------|-------------------|
| Base pack    | ``{family}.base@{version}.json``      | `python.base`     |
| Overlay pack | ``{family}.{overlay}@{version}.json`` | `javascript.es2026`|

The `PacksView` parses these names to populate the available-updates list.

## Sample manifests in `packs/`

| File                              | family    | type    | version |
|-----------------------------------|-----------|---------|---------|
| `python.base@1.3.0.json`          | python    | base    | 1.3.0   |
| `python.base@2.0.0.json`          | python    | base    | 2.0.0   |
| `javascript.es2026@1.0.0.json`     | javascript| overlay | 1.0.0   |
| `rust.base@1.1.0.json`            | rust      | base    | 1.1.0   |

## Publishing a release (GitHub UI)

1. Create a repo at `https://github.com/VVS-Web/syntax-packs` (rename as desired).
2. Repo → Releases → Draft a new release.
3. Choose a tag, e.g. `python@1.3.0` or `packs-2026-07`.
4. Drag the relevant `.json` files into the "Attach binaries" drop zone.
5. Publish the release.

The Pack Versions view fetches `GET /repos/{owner}/{name}/releases?per_page=100`,
parses each release.s assets by the naming convention, dedupes against installed
packs, and lists the rest as "New Syntax Pack Releases Available".

## Publishing via GitHub CLI

```powershell
gh release create python-1.3.0 `
  --repo VVS-Web/syntax-packs `
  --title "Python 1.3.0" `
  "S:\Projects\VVS Web\scratch\vvs-packs-demo\packs\python.base@1.3.0.json"
```

## Changing the source repo in VVS

Top-nav → Syntax packs tab → "Pack repository (owner/name)" → type `owner/repo`
→ Apply. Stored in `localStorage` under `vvs_packs_github_repo`. Listing is
cached for 5 minutes in `sessionStorage` (`vvs_packs_releases_cache`).

## Optional: raise the GitHub rate limit (dev only)

GitHub allows 60 unauthenticated requests/hour per IP. To raise it to 5,000/hr:

```js
localStorage.setItem('vvs_packs_github_token', 'ghp_your_pat_here')
```

The token is read by `apps/web/src/lib/packsGitHub.ts` `authHeaders()` and sent
as `Authorization: Bearer <token>`. Never commit a PAT to the repo.