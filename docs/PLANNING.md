# GitHub Scanner — Planning Document

## Overview

**Purpose:** A client-side web tool that extracts active (non-archived) repositories owned by specific Teams within a GitHub Organization.

**Target Users:** Developers and managers who need to periodically update Confluence or other documentation with team repository status.

**Tech Stack:** HTML5, Tailwind CSS (CDN), Vanilla JavaScript — Single Page Application.

**Deployment:** GitHub Pages — https://bigide19.github.io/github-scanner/

## Core Features

### 1. Input Configuration
- GitHub Personal Access Token (PAT) — stored in `sessionStorage` only (cleared on tab/browser close)
- Organization name — also stored in `sessionStorage`
- Team selection via API-driven multi-select dropdown
- Help tooltip explaining required PAT scopes:
  - `read:org` — required for team/org access
  - `repo` — required for private repository access

### 2. Team Loading
- Fetch all teams from `GET /orgs/{org}/teams` with auto-pagination
- Multi-select dropdown with Select All / Deselect All
- Selected teams shown as removable chips below dropdown
- Multiple teams supported — repos deduplicated by URL

### 3. Data Retrieval
- **Team repos:** REST API `GET /orgs/{org}/teams/{team_slug}/repos` with auto-pagination
- **Inheritance detection:** `GET /repos/{owner}/{repo}/teams` to verify direct vs inherited team access (batched 10 concurrent)
- **User direct permissions:** GraphQL API `collaborators(affiliation: DIRECT)` — 100 repos per query call
- **Unified scan:** Teams and users (comma-separated) combined in single Scan action, deduped by URL
- Client-side filtering (archived, visibility, permission, inherited)
- Permission derived from API response permissions object (admin > maintain > push > triage > pull)
- Permission labels: pull→Read, push→Write in display

### 4. Table Display

| Column | Sortable | Notes |
|--------|----------|-------|
| Name | Yes | With visibility icon (lock/globe), links to repo URL (new tab) |
| Description | No | Truncated with hover tooltip |
| Teams/Users | No | Indigo badge (team), emerald badge (user), gray italic (inherited) |
| Updated | Yes | Default sort (newest first) |
| Permission | Yes | Color-coded badge; per-team breakdown when permissions differ |

### 5. Filters
- **Archived toggle** — Show/hide archived repos (hidden by default — core feature)
- **Include inherited** — Show repos inherited from parent teams (hidden by default)
- **Visibility** — All / Public / Private
- **Permission** — Multi-select (admin, maintain, push, triage, pull)

### 6. Pagination
- Client-side pagination: 10 / 30 (default) / 50 per page
- Previous / Next buttons with page indicator

### 7. Export
- **Markdown copy** — Confluence-ready table with full columns (Name with link, Description, Language, Updated, Created, Visibility, Permission, Archived)
- **CSV download** — Full columns plus Stars, UTF-8 BOM for Excel
- Both export ALL fetched repos, not just current page/filter view

### 8. UI/UX
- Dark mode support (system preference + manual toggle)
- Sticky header with backdrop blur
- Progress bar with shimmer animation + cancel button during scans
- All buttons disabled during scan to prevent double-submit
- Error handling with i18n-aware messages (including rate limit)
- Toast notifications for clipboard copy and scan cancel
- Zebra-striped table rows
- Color-coded permission badges (Read/Write/Maintain/Admin/Triage)
- Visibility shown as icon (lock for private, globe for public)
- `table-auto` layout with `overflow-x-auto` wrapper
- Star button in header (PUT only, no unstar)
- PAT visibility toggle + security explanation panel
- GitHub source link in header

### 9. Internationalization (i18n)
- English (default) and Korean
- Language switcher in header
- GitHub-specific terms (Public, Private, Permission levels) remain in English across all languages

## File Structure

```
github-scanner/
├── index.html              # HTML structure + Tailwind CDN
├── js/
│   ├── app.js              # Main logic (state, render, events, sort, filter, pagination)
│   ├── api.js              # GitHub API (fetchTeamRepos, fetchOrgTeams, validateToken)
│   ├── export.js           # Markdown/CSV export
│   └── i18n.js             # English/Korean translations
├── css/
│   └── style.css           # Custom styles
├── docs/
│   ├── PLANNING.md         # This file
│   └── screenshot.svg      # Mock screenshot
├── README.md
├── LICENSE                  # MIT
└── .gitignore               # Excludes CLAUDE.md, .claude/
```

## Security
- PAT is **never** sent to any server other than `api.github.com`
- PAT and org stored in `sessionStorage` only — cleared when browser/tab closes
- All logic runs client-side — no backend, no analytics, no tracking
- HTTPS enforced via GitHub Pages

## GitHub API Notes
- Team repos endpoint does NOT support `archived` filter parameter — must fetch all and filter client-side
- Team repos endpoint returns inherited repos from parent teams — use `/repos/{owner}/{repo}/teams` to verify direct assignment
- REST pagination via `per_page=100` + `page` increment until response < perPage
- GraphQL: `collaborators(affiliation: DIRECT)` returns only directly assigned users, not team-based access
- GraphQL rate limit: 5,000 points/hour, ~50 points per 100-repo page with collaborators
- `fetchOrgTeams` response includes `parent` field for team hierarchy
- Visible teams: any org member can query. Secret teams: only team members or org admins.
- Required PAT scopes: `read:org` (team access), `repo` (private repos)
- Permission derived from `permissions` object: admin > maintain > push > triage > pull

### 10. SEO
- Meta description, keywords, canonical URL
- Open Graph tags for social sharing previews (Slack, Discord, KakaoTalk)
- Twitter Card (summary_large_image)
- JSON-LD structured data (`WebApplication` schema)

## Future Considerations
- GitHub OAuth App (eliminate PAT requirement — needs serverless backend)
- Multiple org support
- Repository search/text filter within results
- Bookmarkable URL with org/team pre-filled (query params)
- SRI hash for Tailwind CDN
- Real screenshot to replace mock SVG
- Google Search Console registration
