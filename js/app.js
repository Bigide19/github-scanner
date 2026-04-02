/**
 * App — Main application logic for GitHub Scanner
 */
(function () {
  'use strict';

  var state = {
    allRepos: [],
    filtered: [],
    teams: [],
    selectedTeams: [],
    sort: { key: 'updatedAt', dir: 'desc' },
    filters: { archived: false, visibility: 'all', permissions: [], includeInherited: false },
    page: 1,
    pageSize: 30,
    loading: false,
    scanAborted: false
  };

  var $ = function (id) { return document.getElementById(id); };
  var els;

  function cacheEls() {
    els = {
      form: $('scan-form'),
      pat: $('input-pat'),
      org: $('input-org'),
      btnScan: $('btn-scan'),
      btnLoadTeams: $('btn-load-teams'),
      teamSelectBtn: $('team-select-btn'),
      teamSelectLabel: $('team-select-label'),
      teamDropdown: $('team-dropdown'),
      teamList: $('team-list'),
      teamChips: $('team-chips'),
      teamSelectAll: $('team-select-all'),
      teamDeselectAll: $('team-deselect-all'),
      loading: $('loading'),
      error: $('error-banner'),
      errorMsg: $('error-message'),
      results: $('results-section'),
      tbody: $('repo-tbody'),
      empty: $('empty-state'),
      count: $('result-count'),
      filterArchived: $('filter-archived'),
      filterVisibility: $('filter-visibility'),
      permSelectBtn: $('perm-select-btn'),
      permDropdown: $('perm-dropdown'),
      permBadge: $('perm-badge'),
      pageSize: $('page-size'),
      pageInfo: $('page-info'),
      btnPrev: $('btn-prev'),
      btnNext: $('btn-next'),
      btnCopyMd: $('btn-copy-md'),
      btnCsv: $('btn-csv'),
      darkToggle: $('dark-toggle'),
      langSwitcher: $('lang-switcher'),
      patHelpBtn: $('pat-help-btn'),
      patHelpPanel: $('pat-help-panel'),
      patToggleBtn: $('pat-toggle-btn'),
      patIconShow: $('pat-icon-show'),
      patIconHide: $('pat-icon-hide'),
      filterInherited: $('filter-inherited'),
      username: $('input-username'),
      btnScanUser: $('btn-scan-user'),
      btnCancel: $('btn-cancel-scan'),
      loadingText: $('loading-text')
    };
  }

  // ── Dark mode ──────────────────────────────────────────
  function initDarkMode() {
    var saved = localStorage.getItem('github-scanner-theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
    updateDarkIcon();
  }

  function toggleDarkMode() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('github-scanner-theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateDarkIcon();
  }

  function updateDarkIcon() {
    var isDark = document.documentElement.classList.contains('dark');
    $('icon-sun').classList.toggle('hidden', !isDark);
    $('icon-moon').classList.toggle('hidden', isDark);
  }

  // ── i18n ───────────────────────────────────────────────
  function initI18n() {
    els.langSwitcher.value = I18n.getLang();
    applyTranslations();
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = I18n.t(el.getAttribute('data-i18n'));
    });
    document.title = I18n.t('page.title');
    els.pat.placeholder = I18n.t('placeholder.pat');
    updateTeamLabel();
    if (state.allRepos.length) renderTable();
  }

  // ── Toast ──────────────────────────────────────────────
  function showToast(msg) {
    var container = $('toast-container');
    var t = document.createElement('div');
    t.className = 'toast bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 px-4 py-2 rounded-lg shadow-lg text-sm font-medium';
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(function () {
      t.classList.add('toast-out');
      t.addEventListener('animationend', function () { t.remove(); });
    }, 2000);
  }

  // ── Team loading & multi-select ────────────────────────
  async function loadTeams() {
    var token = els.pat.value.trim();
    var org = els.org.value.trim();
    if (!token || !org) return;

    els.btnLoadTeams.disabled = true;
    els.btnLoadTeams.textContent = '...';

    try {
      state.teams = await GitHubAPI.fetchOrgTeams(token, org);
      renderTeamList();
      els.teamSelectBtn.disabled = false;
    } catch (err) {
      showError(err.message);
    } finally {
      els.btnLoadTeams.disabled = false;
      els.btnLoadTeams.textContent = I18n.t('team.loadBtn');
    }
  }

  function renderTeamList() {
    var html = '';
    state.teams.forEach(function (team) {
      var checked = state.selectedTeams.indexOf(team.slug) !== -1 ? 'checked' : '';
      html += '<label class="flex items-center gap-2 text-sm px-3 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">'
        + '<input type="checkbox" value="' + escHtml(team.slug) + '" class="team-check rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" ' + checked + '>'
        + '<span class="truncate">' + escHtml(team.name) + '</span>'
        + '</label>';
    });
    els.teamList.innerHTML = html;

    els.teamList.querySelectorAll('.team-check').forEach(function (cb) {
      cb.addEventListener('change', syncSelectedTeams);
    });
  }

  function syncSelectedTeams() {
    state.selectedTeams = [];
    els.teamList.querySelectorAll('.team-check:checked').forEach(function (cb) {
      state.selectedTeams.push(cb.value);
    });
    updateTeamLabel();
    renderTeamChips();
  }

  function updateTeamLabel() {
    if (state.selectedTeams.length === 0) {
      els.teamSelectLabel.textContent = I18n.t('team.placeholder');
      els.teamSelectLabel.className = 'truncate text-gray-400';
    } else {
      els.teamSelectLabel.textContent = I18n.t('team.selected', { count: state.selectedTeams.length });
      els.teamSelectLabel.className = 'truncate';
    }
  }

  function renderTeamChips() {
    if (state.selectedTeams.length === 0) {
      els.teamChips.innerHTML = '';
      return;
    }
    var html = '';
    state.selectedTeams.forEach(function (slug) {
      var team = state.teams.find(function (t) { return t.slug === slug; });
      var name = team ? team.name : slug;
      html += '<span class="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">'
        + escHtml(name)
        + '<button type="button" class="team-chip-remove hover:text-indigo-900 dark:hover:text-indigo-100" data-slug="' + escHtml(slug) + '">&times;</button>'
        + '</span>';
    });
    els.teamChips.innerHTML = html;

    els.teamChips.querySelectorAll('.team-chip-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var slug = this.getAttribute('data-slug');
        state.selectedTeams = state.selectedTeams.filter(function (s) { return s !== slug; });
        // Uncheck in dropdown
        var cb = els.teamList.querySelector('input[value="' + slug + '"]');
        if (cb) cb.checked = false;
        updateTeamLabel();
        renderTeamChips();
      });
    });
  }

  function toggleTeamDropdown() {
    els.teamDropdown.classList.toggle('hidden');
  }

  function selectAllTeams(select) {
    els.teamList.querySelectorAll('.team-check').forEach(function (cb) { cb.checked = select; });
    syncSelectedTeams();
  }

  // ── Permission multi-select ────────────────────────────
  function togglePermDropdown() {
    els.permDropdown.classList.toggle('hidden');
  }

  function syncPermissions() {
    state.filters.permissions = [];
    document.querySelectorAll('.perm-check:checked').forEach(function (cb) {
      state.filters.permissions.push(cb.value);
    });
    if (state.filters.permissions.length > 0) {
      els.permBadge.textContent = state.filters.permissions.length;
      els.permBadge.classList.remove('hidden');
    } else {
      els.permBadge.classList.add('hidden');
    }
    state.page = 1;
    applyFiltersAndSort();
  }

  function handleDocumentClick(e) {
    if (!els.teamDropdown.classList.contains('hidden') && !e.target.closest('#team-select-wrapper')) {
      els.teamDropdown.classList.add('hidden');
    }
    if (!els.permDropdown.classList.contains('hidden') && !e.target.closest('#perm-select-btn') && !e.target.closest('#perm-dropdown')) {
      els.permDropdown.classList.add('hidden');
    }
  }

  // ── Scan ───────────────────────────────────────────────
  async function handleScan(e) {
    e.preventDefault();
    var token = els.pat.value.trim();
    var org = els.org.value.trim();

    if (!token || !org) return;
    if (state.selectedTeams.length === 0) {
      showError(I18n.t('error.noTeamSelected'));
      return;
    }

    setLoading(true);
    hideError();
    els.results.classList.add('hidden');

    try {
      var seen = {};
      var allRepos = [];

      // Step 1: Collect repos from selected teams
      for (var i = 0; i < state.selectedTeams.length; i++) {
        if (state.scanAborted) { showToast(I18n.t('status.cancelled')); break; }
        var teamSlug = state.selectedTeams[i];
        var team = state.teams.find(function (t) { return t.slug === teamSlug; });
        var teamName = team ? team.name : teamSlug;
        var repos = await GitHubAPI.fetchTeamRepos(token, org, teamSlug);
        for (var j = 0; j < repos.length; j++) {
          var key = repos[j].url;
          if (!seen[key]) {
            repos[j].teams = [{ name: teamName, slug: teamSlug, permission: repos[j].permission, inherited: false }];
            seen[key] = repos[j];
            allRepos.push(repos[j]);
          } else {
            seen[key].teams.push({ name: teamName, slug: teamSlug, permission: repos[j].permission, inherited: false });
            seen[key].permission = highestPermission(seen[key].teams);
          }
        }
      }

      // Step 2: Check actual team assignments per repo to detect inheritance
      var childTeamSlugs = state.selectedTeams.filter(function (slug) {
        var t = state.teams.find(function (x) { return x.slug === slug; });
        return t && t.parent;
      });
      if (childTeamSlugs.length > 0) {
        var reposToCheck = allRepos.filter(function (r) {
          return r.teams.some(function (t) { return childTeamSlugs.indexOf(t.slug) !== -1; });
        });
        var totalCheck = reposToCheck.length;
        for (var ri = 0; ri < reposToCheck.length; ri++) {
          if (state.scanAborted) { showToast(I18n.t('status.cancelled')); break; }
          els.loadingText.textContent = I18n.t('status.scanTeamProgress', { current: ri + 1, total: totalCheck });
          var repo = reposToCheck[ri];
          try {
            var directTeams = await GitHubAPI.fetchRepoTeams(token, org, repo.name);
            var directSlugs = {};
            for (var di = 0; di < directTeams.length; di++) {
              directSlugs[directTeams[di].slug] = directTeams[di].permission;
            }
            for (var ti = 0; ti < repo.teams.length; ti++) {
              var entry = repo.teams[ti];
              if (childTeamSlugs.indexOf(entry.slug) !== -1) {
                if (!directSlugs[entry.slug]) {
                  entry.inherited = true;
                  var parentTeam = state.teams.find(function (x) { return x.slug === entry.slug; });
                  entry.parentTeam = parentTeam && parentTeam.parent ? parentTeam.parent.name : null;
                } else {
                  entry.permission = directSlugs[entry.slug];
                  entry.inherited = false;
                }
              }
            }
            repo.permission = highestPermission(repo.teams);
          } catch (e) {
            if (e.message && e.message.indexOf('Rate limited') !== -1) { showError(e.message); break; }
          }
        }
      }
      state.allRepos = allRepos;
      sessionStorage.setItem('github-scanner-pat', token);
      sessionStorage.setItem('github-scanner-org', org);
      state.page = 1;
      applyFiltersAndSort();
      if (allRepos.length) els.results.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── User Scan ──────────────────────────────────────────
  async function handleUserScan() {
    var token = els.pat.value.trim();
    var org = els.org.value.trim();
    var username = els.username.value.trim();

    if (!token || !org || !username) return;

    setLoading(true);
    hideError();
    els.results.classList.add('hidden');

    try {
      var orgRepos = await GitHubAPI.fetchOrgRepos(token, org);
      var total = orgRepos.length;
      var results = [];

      var BATCH = 10;
      for (var bi = 0; bi < orgRepos.length; bi += BATCH) {
        if (state.scanAborted) { showToast(I18n.t('status.cancelled')); break; }

        var batch = orgRepos.slice(bi, bi + BATCH);
        var batchResults = await Promise.all(batch.map(function (repo) {
          return GitHubAPI.fetchRepoDirectCollaborators(token, org, repo.name)
            .then(function (collabs) { return { repo: repo, collabs: collabs }; })
            .catch(function (err) { return { repo: repo, error: err }; });
        }));

        var rateLimited = false;
        for (var br = 0; br < batchResults.length; br++) {
          var item = batchResults[br];
          if (item.error) {
            if (item.error.message && item.error.message.indexOf('Rate limited') !== -1) {
              showError(item.error.message);
              rateLimited = true;
              break;
            }
            continue;
          }
          var userCollab = item.collabs.find(function (c) {
            return c.login.toLowerCase() === username.toLowerCase();
          });
          if (userCollab) {
            var repo = item.repo;
            repo.permission = userCollab.permission;
            repo.teams = [{ name: I18n.t('status.userDirect'), slug: '_direct_', permission: userCollab.permission, inherited: false }];
            results.push(repo);
          }
        }

        els.loadingText.textContent = I18n.t('status.scanProgress', { current: Math.min(bi + BATCH, total), total: total });
        if (rateLimited) break;
      }

      state.allRepos = results;
      sessionStorage.setItem('github-scanner-pat', token);
      sessionStorage.setItem('github-scanner-org', org);
      state.page = 1;
      applyFiltersAndSort();
      if (results.length) els.results.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(on) {
    state.loading = on;
    state.scanAborted = false;
    els.loading.classList.toggle('hidden', !on);
    els.btnScan.disabled = on;
    els.btnScanUser.disabled = on;
    els.btnLoadTeams.disabled = on;
    els.loadingText.textContent = I18n.t('status.loading');
  }

  function showError(msg) {
    var i18nMsg = msg;
    if (msg.includes('Unauthorized')) i18nMsg = I18n.t('error.unauthorized');
    else if (msg.includes('Not found')) i18nMsg = I18n.t('error.notFound');
    else if (msg.includes('Rate limited')) i18nMsg = I18n.t('error.rateLimit');
    els.errorMsg.textContent = i18nMsg;
    els.error.classList.remove('hidden');
  }

  function hideError() { els.error.classList.add('hidden'); }

  // ── Filter & Sort ──────────────────────────────────────
  function applyFiltersAndSort() {
    var repos = state.allRepos.slice();

    if (!state.filters.archived) {
      repos = repos.filter(function (r) { return !r.archived; });
    }
    if (state.filters.visibility !== 'all') {
      repos = repos.filter(function (r) { return r.visibility === state.filters.visibility; });
    }
    if (state.filters.permissions.length > 0) {
      repos = repos.filter(function (r) {
        return state.filters.permissions.indexOf(r.permission) !== -1;
      });
    }
    if (!state.filters.includeInherited) {
      repos = repos.filter(function (r) {
        if (!r.teams) return true;
        // Keep repo if at least one team association is direct (not inherited)
        return r.teams.some(function (t) { return !t.inherited; });
      });
    }

    var key = state.sort.key;
    var dir = state.sort.dir === 'asc' ? 1 : -1;
    repos.sort(function (a, b) {
      var va = a[key] || '';
      var vb = b[key] || '';
      if (key === 'updatedAt' || key === 'createdAt') return dir * (new Date(va) - new Date(vb));
      if (typeof va === 'string') return dir * va.localeCompare(vb, undefined, { sensitivity: 'base' });
      return dir * (va - vb);
    });

    state.filtered = repos;
    renderTable();
  }

  function handleSort(key) {
    if (state.sort.key === key) {
      state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sort.key = key;
      state.sort.dir = key === 'name' || key === 'permission' ? 'asc' : 'desc';
    }
    updateSortIndicators();
    state.page = 1;
    applyFiltersAndSort();
  }

  function updateSortIndicators() {
    document.querySelectorAll('.sortable').forEach(function (th) {
      th.classList.remove('asc', 'desc');
      if (th.getAttribute('data-sort') === state.sort.key) th.classList.add(state.sort.dir);
    });
  }

  // ── Pagination ─────────────────────────────────────────
  function getPageSlice() {
    var start = (state.page - 1) * state.pageSize;
    return state.filtered.slice(start, start + state.pageSize);
  }

  function getTotalPages() {
    return Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
  }

  function updatePagination() {
    var total = getTotalPages();
    els.pageInfo.textContent = I18n.t('pagination.page', { current: state.page, total: total });
    els.btnPrev.disabled = state.page <= 1;
    els.btnNext.disabled = state.page >= total;
  }

  // ── Render ─────────────────────────────────────────────
  var PERM_COLORS = {
    admin:    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    maintain: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    push:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    triage:   'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    pull:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  };

  var PERM_LABELS = {
    admin: 'Admin', maintain: 'Maintain', push: 'Write', triage: 'Triage', pull: 'Read'
  };

  var PERM_ORDER = ['admin', 'maintain', 'push', 'triage', 'pull'];

  function highestPermission(teams) {
    var best = 4;
    for (var i = 0; i < teams.length; i++) {
      var idx = PERM_ORDER.indexOf(teams[i].permission);
      if (idx !== -1 && idx < best) best = idx;
    }
    return PERM_ORDER[best];
  }

  // Visibility: lock icon for private, globe for public
  var VISIBILITY_ICON = {
    'private': '<svg class="w-3.5 h-3.5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20" title="private"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>',
    'public':  '<svg class="w-3.5 h-3.5 text-green-500 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20" title="public"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 012 2v1a2 2 0 01-2 2 1 1 0 00-1 1v2.268A5.972 5.972 0 014.332 8.027z" clip-rule="evenodd"/></svg>'
  };

  function renderTable() {
    els.count.textContent = I18n.t('status.resultCount', { count: state.filtered.length });

    var pageRepos = getPageSlice();

    if (state.filtered.length === 0) {
      els.tbody.innerHTML = '';
      els.empty.classList.remove('hidden');
      updatePagination();
      return;
    }
    els.empty.classList.add('hidden');

    var html = '';
    for (var i = 0; i < pageRepos.length; i++) {
      var r = pageRepos[i];
      var rowBg = i % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-800/30';
      var permClass = PERM_COLORS[r.permission] || PERM_COLORS.pull;
      var visIcon = VISIBILITY_ICON[r.visibility] || VISIBILITY_ICON['public'];

      // Compute visible teams (respect inherited filter)
      var visibleTeams = [];
      if (r.teams && r.teams.length > 0) {
        for (var ti = 0; ti < r.teams.length; ti++) {
          var teamEntry = r.teams[ti];
          if (!teamEntry.inherited || state.filters.includeInherited) {
            visibleTeams.push(teamEntry);
          }
        }
      }

      // Build teams badges
      var teamsHtml = '';
      for (var ti2 = 0; ti2 < visibleTeams.length; ti2++) {
        var vt = visibleTeams[ti2];
        if (vt.inherited) {
          teamsHtml += '<span class="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 italic" title="' + escHtml(I18n.t('team.inheritedFrom', { parent: vt.parentTeam || '' })) + '">' + escHtml(vt.parentTeam || vt.name) + '</span>';
        } else {
          teamsHtml += '<span class="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">' + escHtml(vt.name) + '</span>';
        }
      }

      // Build permission display based on visible teams
      var permHtml = '';
      var multiTeam = visibleTeams.length > 1;
      var uniquePerms = {};
      if (multiTeam) {
        for (var pi = 0; pi < visibleTeams.length; pi++) { uniquePerms[visibleTeams[pi].permission] = true; }
      }
      var hasDiffPerms = Object.keys(uniquePerms).length > 1;

      if (multiTeam && hasDiffPerms) {
        permHtml = '<div class="flex flex-col gap-1">';
        for (var pi2 = 0; pi2 < visibleTeams.length; pi2++) {
          var tp = visibleTeams[pi2];
          var tpClass = PERM_COLORS[tp.permission] || PERM_COLORS.pull;
          var tpName = tp.inherited ? (tp.parentTeam || tp.name) : tp.name;
          permHtml += '<div class="flex items-center justify-between gap-2 text-[10px]">'
            + '<span class="text-gray-500 dark:text-gray-400 truncate">' + escHtml(tpName) + '</span>'
            + '<span class="font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ' + tpClass + '">' + (PERM_LABELS[tp.permission] || tp.permission) + '</span>'
            + '</div>';
        }
        permHtml += '</div>';
      } else {
        var displayPerm = visibleTeams.length > 0 ? visibleTeams[0].permission : r.permission;
        var dpClass = PERM_COLORS[displayPerm] || PERM_COLORS.pull;
        permHtml = '<span class="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ' + dpClass + '">' + (PERM_LABELS[displayPerm] || displayPerm) + '</span>';
      }

      html += '<tr class="' + rowBg + '">'
        // Name with visibility icon
        + '<td class="px-4 py-3">'
          + '<div class="flex items-center gap-1.5 min-w-0">'
            + visIcon
            + '<a href="' + escHtml(r.url) + '" target="_blank" rel="noopener" class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate">' + escHtml(r.name) + '</a>'
            + (r.archived ? '<span class="badge badge-archived text-[10px] flex-shrink-0">archived</span>' : '')
          + '</div>'
        + '</td>'
        // Description
        + '<td class="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px]">'
          + '<span class="block truncate" title="' + escHtml(r.description || '') + '">' + escHtml(r.description || '—') + '</span>'
        + '</td>'
        // Teams
        + '<td class="px-4 py-3"><div class="flex flex-wrap gap-1">' + teamsHtml + '</div></td>'
        // Updated
        + '<td class="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">' + I18n.formatDate(r.updatedAt) + '</td>'
        // Permission
        + '<td class="px-4 py-3' + (multiTeam && hasDiffPerms ? '' : ' text-center') + '">' + permHtml + '</td>'
        + '</tr>';
    }
    els.tbody.innerHTML = html;
    updatePagination();
  }

  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── Export (always uses allRepos, not filtered/paged) ──
  function handleCopyMarkdown() {
    if (!state.allRepos.length) return;
    Exporter.copyMarkdown(state.allRepos).then(function () {
      showToast(I18n.t('status.copiedToClipboard'));
    });
  }

  function handleDownloadCSV() {
    if (!state.allRepos.length) return;
    Exporter.downloadCSV(state.allRepos);
  }

  // ── Session restore ────────────────────────────────────
  function restoreSession() {
    var pat = sessionStorage.getItem('github-scanner-pat');
    if (pat) els.pat.value = pat;
    var org = sessionStorage.getItem('github-scanner-org');
    if (org) els.org.value = org;
  }

  // ── Events ─────────────────────────────────────────────
  function bindEvents() {
    els.form.addEventListener('submit', handleScan);
    els.darkToggle.addEventListener('click', toggleDarkMode);
    els.langSwitcher.addEventListener('change', function () {
      I18n.setLang(this.value);
      applyTranslations();
    });
    els.patHelpBtn.addEventListener('click', function () {
      els.patHelpPanel.classList.toggle('open');
    });

    els.patToggleBtn.addEventListener('click', function () {
      var isPassword = els.pat.type === 'password';
      els.pat.type = isPassword ? 'text' : 'password';
      els.patIconShow.classList.toggle('hidden', isPassword);
      els.patIconHide.classList.toggle('hidden', !isPassword);
    });

    els.btnLoadTeams.addEventListener('click', loadTeams);
    els.btnScanUser.addEventListener('click', handleUserScan);
    els.btnCancel.addEventListener('click', function () { state.scanAborted = true; });
    els.teamSelectBtn.addEventListener('click', toggleTeamDropdown);
    els.teamSelectAll.addEventListener('click', function () { selectAllTeams(true); });
    els.teamDeselectAll.addEventListener('click', function () { selectAllTeams(false); });

    els.filterArchived.addEventListener('change', function () {
      state.filters.archived = this.checked;
      state.page = 1;
      applyFiltersAndSort();
    });
    els.filterInherited.addEventListener('change', function () {
      state.filters.includeInherited = this.checked;
      state.page = 1;
      applyFiltersAndSort();
    });
    els.filterVisibility.addEventListener('change', function () {
      state.filters.visibility = this.value;
      state.page = 1;
      applyFiltersAndSort();
    });

    els.permSelectBtn.addEventListener('click', togglePermDropdown);
    document.querySelectorAll('.perm-check').forEach(function (cb) {
      cb.addEventListener('change', syncPermissions);
    });

    document.querySelectorAll('.sortable').forEach(function (th) {
      th.addEventListener('click', function () {
        handleSort(this.getAttribute('data-sort'));
      });
    });

    els.pageSize.addEventListener('change', function () {
      state.pageSize = parseInt(this.value, 10);
      state.page = 1;
      renderTable();
    });
    els.btnPrev.addEventListener('click', function () {
      if (state.page > 1) { state.page--; renderTable(); }
    });
    els.btnNext.addEventListener('click', function () {
      if (state.page < getTotalPages()) { state.page++; renderTable(); }
    });

    els.btnCopyMd.addEventListener('click', handleCopyMarkdown);
    els.btnCsv.addEventListener('click', handleDownloadCSV);

    document.addEventListener('click', handleDocumentClick);
  }

  // ── Init ───────────────────────────────────────────────
  function init() {
    cacheEls();
    initDarkMode();
    initI18n();
    restoreSession();
    bindEvents();
    updateSortIndicators();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
