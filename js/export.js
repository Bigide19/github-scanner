// export.js — Markdown/CSV export functions for GitHub repo scanner

const Exporter = (() => {
  'use strict';

  /**
   * Truncate a string to maxLen characters, appending "..." if truncated.
   */
  function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  }

  /**
   * Escape a value for safe inclusion in a CSV field.
   * Wraps in double quotes if the value contains commas, quotes, or newlines.
   * Double quotes within the value are escaped by doubling them.
   */
  function csvEscape(value) {
    const str = value == null ? '' : String(value);
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  /**
   * Build a Markdown table string from an array of repo objects.
   * Confluence-compatible format with pipe-delimited columns.
   *
   * Columns: Name, Description, Language, Updated, Visibility
   */
  var PERM_LABELS = {
    admin: 'Admin', maintain: 'Maintain', push: 'Write', triage: 'Triage', pull: 'Read'
  };

  function formatTeams(repo) {
    if (!repo.teams || repo.teams.length === 0) return '';
    return repo.teams.map(function (t) { return t.name; }).join(', ');
  }

  function formatTeamPermissions(repo, separator) {
    if (!repo.teams || repo.teams.length === 0) return '';
    return repo.teams.map(function (t) {
      return t.name + ': ' + (PERM_LABELS[t.permission] || t.permission);
    }).join(separator);
  }

  function toMarkdown(repos) {
    const header = '| Name | Description | Language | Teams | Team Permissions | Highest Permission | Updated | Created | Visibility | Archived | Stars |';
    const separator = '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';

    const rows = (repos || []).map((repo) => {
      const name = `[${repo.name}](${repo.url})`;
      const description = repo.description || '';
      const language = repo.language || '';
      const teams = formatTeams(repo);
      const teamPerms = formatTeamPermissions(repo, '<br>');
      const highestPerm = PERM_LABELS[repo.permission] || repo.permission || '';
      const updated = I18n.formatDate(repo.updatedAt);
      const created = I18n.formatDate(repo.createdAt);
      const visibility = repo.visibility || 'public';
      const archived = repo.archived ? 'Yes' : 'No';
      const stars = repo.stars || 0;

      return `| ${name} | ${description} | ${language} | ${teams} | ${teamPerms} | ${highestPerm} | ${updated} | ${created} | ${visibility} | ${archived} | ${stars} |`;
    });

    return [header, separator, ...rows].join('\n');
  }

  /**
   * Copy Markdown table to clipboard.
   * Returns a Promise that resolves when the copy succeeds.
   */
  function copyMarkdown(repos) {
    const markdown = toMarkdown(repos);
    return navigator.clipboard.writeText(markdown);
  }

  /**
   * Build a CSV string from an array of repo objects.
   * Includes UTF-8 BOM for Excel compatibility.
   *
   * Columns: Name, Description, Language, Updated, Created, URL, Visibility, Archived
   */
  function toCSV(repos) {
    const BOM = '\uFEFF';
    const header = ['Name', 'Description', 'Language', 'Teams', 'Team Permissions', 'Highest Permission', 'Updated', 'Created', 'URL', 'Visibility', 'Archived', 'Stars'];
    const lines = [header.join(',')];

    (repos || []).forEach((repo) => {
      const row = [
        csvEscape(repo.name),
        csvEscape(repo.description),
        csvEscape(repo.language),
        csvEscape(formatTeams(repo)),
        csvEscape(formatTeamPermissions(repo, '\n')),
        csvEscape(PERM_LABELS[repo.permission] || repo.permission || ''),
        csvEscape(repo.updatedAt),
        csvEscape(repo.createdAt),
        csvEscape(repo.url),
        csvEscape(repo.visibility || 'public'),
        csvEscape(repo.archived),
        csvEscape(repo.stars),
      ];
      lines.push(row.join(','));
    });

    return BOM + lines.join('\n');
  }

  /**
   * Trigger a CSV file download in the browser.
   * Creates a temporary anchor element to initiate the download.
   */
  function downloadCSV(repos, filename) {
    const csv = toCSV(repos);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'github-repos.csv';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    toMarkdown,
    copyMarkdown,
    toCSV,
    downloadCSV,
  };
})();
