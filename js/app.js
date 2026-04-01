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
    filters: { archived: false, visibility: 'all', permissions: [] },
    page: 1,
    pageSize: 30,
    loading: false
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
      patHelpPanel: $('pat-help-panel')
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
      for (var i = 0; i < state.selectedTeams.length; i++) {
        var repos = await GitHubAPI.fetchTeamRepos(token, org, state.selectedTeams[i]);
        for (var j = 0; j < repos.length; j++) {
          var key = repos[j].url;
          if (!seen[key]) {
            seen[key] = true;
            allRepos.push(repos[j]);
          }
        }
      }
      state.allRepos = allRepos;
      sessionStorage.setItem('github-scanner-pat', token);
      sessionStorage.setItem('github-scanner-org', org);
      state.page = 1;
      applyFiltersAndSort();
      els.results.classList.remove('hidden');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function setLoading(on) {
    state.loading = on;
    els.loading.classList.toggle('hidden', !on);
    els.btnScan.disabled = on;
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

      html += '<tr class="' + rowBg + '">'
        // Name (wide) with visibility icon
        + '<td class="px-5 py-3">'
          + '<div class="flex items-center gap-2">'
            + visIcon
            + '<a href="' + escHtml(r.url) + '" target="_blank" rel="noopener" class="font-medium text-indigo-600 dark:text-indigo-400 hover:underline truncate">' + escHtml(r.name) + '</a>'
            + (r.archived ? '<span class="badge badge-archived text-[10px] flex-shrink-0">archived</span>' : '')
          + '</div>'
        + '</td>'
        // Description
        + '<td class="px-5 py-3 text-gray-500 dark:text-gray-400">'
          + '<span class="block truncate" title="' + escHtml(r.description || '') + '">' + escHtml(r.description || '—') + '</span>'
        + '</td>'
        // Updated
        + '<td class="px-5 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400 text-xs">' + I18n.formatDate(r.updatedAt) + '</td>'
        // Permission
        + '<td class="px-5 py-3 text-center">'
          + '<span class="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ' + permClass + '">' + escHtml(r.permission) + '</span>'
        + '</td>'
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

    els.btnLoadTeams.addEventListener('click', loadTeams);
    els.teamSelectBtn.addEventListener('click', toggleTeamDropdown);
    els.teamSelectAll.addEventListener('click', function () { selectAllTeams(true); });
    els.teamDeselectAll.addEventListener('click', function () { selectAllTeams(false); });

    els.filterArchived.addEventListener('change', function () {
      state.filters.archived = this.checked;
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
