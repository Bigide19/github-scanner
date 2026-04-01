# GitHub Scanner — Planning Document

## Overview

**Purpose:** A client-side web tool that extracts active (non-archived) repositories owned by a specific Team within a GitHub Organization.

**Target Users:** Developers and managers who need to periodically update Confluence or other documentation with team repository status.

**Tech Stack:** HTML5, Tailwind CSS (CDN), Vanilla JavaScript — Single Page Application.

## Core Features (MVP)

### 1. Input Configuration
- GitHub Personal Access Token (PAT) — stored in `sessionStorage` only (cleared on tab/browser close)
- Organization name
- Team slug
- Help tooltip explaining required PAT scopes:
  - `read:org` — required for team/org access
  - `repo` — required for private repository access

### 2. Data Retrieval
- GitHub REST API: `GET /orgs/{org}/teams/{team_slug}/repos`
- Automatic pagination (API returns 30 per page by default)
- Client-side filtering (archived, visibility)

### 3. Table Display

| Column | Sortable | Notes |
|--------|----------|-------|
| Name | Yes | Alphabetical, links to repo URL |
| Description | No | Truncated if long |
| Language | Yes | Primary language |
| Updated At | Yes | Default sort (newest first) |
| Created At | Yes | Repository creation date |
| Visibility | No | public / private badge |
| Archived | No | Badge, hidden by default |

### 4. Filters
- **Archived toggle:** Show/hide archived repos (hidden by default — core feature)
- **Visibility filter:** All / Public / Private

### 5. Export
- **Markdown copy:** Confluence-ready table format to clipboard
- **CSV download:** For spreadsheet use

### 6. UI/UX
- Dark mode support (system preference + manual toggle)
- Loading spinner during API calls
- Error handling with user-friendly messages
- Responsive design

### 7. Internationalization (i18n)
- English (default) and Korean
- Language switcher in UI

## File Structure

```
github-scanner/
├── index.html          # HTML structure + Tailwind CDN
├── js/
│   ├── app.js          # Main logic (rendering, events, state)
│   ├── api.js          # GitHub API calls + pagination
│   ├── export.js       # Markdown/CSV export
│   └── i18n.js         # English/Korean translations
├── css/
│   └── style.css       # Custom styles (minimal)
├── docs/
│   └── PLANNING.md     # This file
├── README.md
├── LICENSE             # MIT
└── .gitignore
```

## Security
- PAT is **never** sent to any server other than `api.github.com`
- PAT stored in `sessionStorage` only — cleared when browser/tab closes
- All logic runs client-side — no backend, no analytics, no tracking

## GitHub API Notes
- Team repos endpoint does NOT support `archived` filter parameter — must fetch all and filter client-side
- Pagination via `Link` header or `per_page` + `page` params (max 100 per page)
- Visible teams: any org member can query. Secret teams: only team members or org admins.
- Required PAT scopes: `read:org` (team access), `repo` (private repos)

## Future Considerations
- GitHub Pages deployment
- Multiple team comparison
- Repository search/filter within results
- Bookmarkable URL with org/team pre-filled (query params)
