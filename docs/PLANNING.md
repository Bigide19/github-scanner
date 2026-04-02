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
- GitHub REST API: `GET /orgs/{org}/teams/{team_slug}/repos`
- Automatic pagination (100 per page, follows all pages)
- Client-side filtering (archived, visibility, permission)
- Permission derived from API response permissions object (admin > maintain > push > triage > pull)

### 4. Table Display

| Column | Sortable | Notes |
|--------|----------|-------|
| Name | Yes | With visibility icon (lock/globe), links to repo URL |
| Description | No | Truncated with hover tooltip |
| Updated | Yes | Default sort (newest first) |
| Permission | Yes | Color-coded badge (admin/maintain/push/triage/pull) |

### 5. Filters
- **Archived toggle** — Show/hide archived repos (hidden by default — core feature)
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
- Loading spinner during API calls
- Error handling with i18n-aware messages
- Toast notifications for clipboard copy
- Zebra-striped table rows
- Color-coded permission badges
- Visibility shown as icon (lock for private, globe for public)
- `table-fixed` layout to prevent horizontal scroll

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
- Pagination via `per_page=100` + `page` increment until response < perPage
- Visible teams: any org member can query. Secret teams: only team members or org admins.
- Required PAT scopes: `read:org` (team access), `repo` (private repos)
- Permission derived from `permissions` object: admin > maintain > push > triage > pull

## Future Considerations
- Multiple org support
- Repository search/text filter within results
- Bookmarkable URL with org/team pre-filled (query params)
- SRI hash for Tailwind CDN
- Real screenshot to replace mock SVG
