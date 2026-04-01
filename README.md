# GitHub Scanner

A client-side web tool that lists active repositories from GitHub Organization teams.

## Features

- Fetch repositories by organization team, with multi-team selection
- Archive filtering (archived repos hidden by default)
- Column sorting by name, last updated, and permission level
- Visibility and permission filters with multi-select
- Export to Markdown (with links) for Confluence or CSV for spreadsheets -- exports all data with full columns
- Dark mode with system preference detection and manual toggle
- Internationalization: English and Korean
- Client-side pagination (10 / 30 / 50 rows per page)

## Screenshot

![Screenshot](docs/screenshot.png)

## Getting Started

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
```

```bash
python3 -m http.server
```

Alternatively, deploy to GitHub Pages.

## Usage

1. Enter your GitHub Personal Access Token.
2. Enter the organization name and click **Load Teams**.
3. Select one or more teams from the list.
4. Click **Scan** to fetch repositories.
5. Filter, sort, or export the results as needed.

## PAT Scopes

| Scope      | Purpose                                              |
|------------|------------------------------------------------------|
| `read:org` | Access team and organization information              |
| `repo`     | Access private repositories (optional for public-only)|

Generate a token at **GitHub > Settings > Developer settings > Personal access tokens**.

## Security

- No backend -- all logic runs entirely in the browser.
- No tracking -- no analytics, telemetry, or third-party calls.
- Session only -- your PAT is stored in `sessionStorage` and cleared when the tab closes.
- API calls are made exclusively to `api.github.com`.

## Tech Stack

- HTML5
- [Tailwind CSS](https://tailwindcss.com/) (CDN)
- Vanilla JavaScript

No build tools, no bundler, no framework.

## License

[MIT](LICENSE)
