# Reporting a vulnerability

We appreciate responsible disclosure.

## Supported versions

This project is in **early public development**. Security fixes apply to:

- The latest commit on `main`
- The live Pages build at [https://sheriff99yt.github.io/VVS-Web/](https://sheriff99yt.github.io/VVS-Web/) (and the matching `pre-release` GitHub Release)
- The newest SemVer release zip, when published

## How to report

**Do not** open a public GitHub issue for security vulnerabilities.

1. Open a **[GitHub Security Advisory](https://github.com/Sheriff99yt/VVS-Web/security/advisories/new)** (preferred), or
2. Open a private channel via GitHub Issues with title prefix `[SECURITY]` and minimal details, asking for a private follow-up.

Include:

- Description of the issue and impact
- Steps to reproduce
- Affected paths (e.g. `apps/web`, `server/`)

## What to expect

- Acknowledgment within a reasonable timeframe
- A fix or mitigation plan for confirmed issues
- Credit in release notes if you want it (optional)

## Out of scope (today)

- Mock/offline-only features with no network exposure
- Issues requiring physical access to your machine or browser `localStorage`
- The Go server skeleton (`GET /health` only) until real APIs ship

For general bugs, use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml).
