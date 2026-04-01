/**
 * I18n — Internationalization module for GitHub Scanner
 *
 * Supports English (en) and Korean (ko).
 * Usage: load via <script src="js/i18n.js"></script>, then call I18n.t('key').
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'github-scanner-lang';
  var DEFAULT_LANG = 'en';
  var SUPPORTED_LANGS = ['en', 'ko'];

  var translations = {
    en: {
      // Page
      'page.title': 'GitHub Scanner',
      'page.header': 'GitHub Scanner',

      // Input labels
      'label.pat': 'Personal Access Token (PAT)',
      'label.org': 'Organization',
      'label.team': 'Team',

      // Placeholders
      'placeholder.pat': 'ghp_xxxx...',

      // PAT help
      'pat.help.title': 'PAT Help',
      'pat.help.tooltip': 'Your token needs the read:org scope to access team information and the repo scope to access private repositories.',
      'pat.help.details': 'Generate a token at GitHub > Settings > Developer settings > Personal access tokens. Required scopes: read:org for team access, repo for private repository access.',
      'pat.scope.readOrg': 'Required for team and organization access',
      'pat.scope.repo': 'Required for private repository access',

      // Buttons
      'button.scan': 'Scan',
      'button.copyMarkdown': 'Copy Markdown',
      'button.downloadCsv': 'Download CSV',

      // Table headers
      'table.name': 'Name',
      'table.description': 'Description',
      'table.language': 'Language',
      'table.updated': 'Updated',
      'table.created': 'Created',
      'table.visibility': 'Visibility',
      'table.archived': 'Archived',

      // Filters
      'filter.showArchived': 'Show Archived',
      'filter.visibility': 'Visibility',
      'filter.visibility.all': 'All',
      'filter.visibility.public': 'Public',
      'filter.visibility.private': 'Private',

      // Team
      'team.loadBtn': 'Load Teams',
      'team.loading': 'Loading teams...',
      'team.placeholder': 'Select teams...',
      'team.selectAll': 'Select All',
      'team.deselectAll': 'Deselect All',
      'team.selected': '{count} team(s) selected',

      // Filters
      'filter.showArchived': 'Show Archived',
      'filter.visibility': 'Visibility',
      'filter.visibility.all': 'All',
      'filter.visibility.public': 'Public',
      'filter.visibility.private': 'Private',
      'filter.permission': 'Permission',
      'filter.permission.all': 'All',
      'filter.permission.admin': 'Admin',
      'filter.permission.maintain': 'Maintain',
      'filter.permission.push': 'Write',
      'filter.permission.triage': 'Triage',
      'filter.permission.pull': 'Read',

      // Pagination
      'pagination.perPage': 'Per page',
      'pagination.page': 'Page {current} of {total}',
      'pagination.prev': 'Previous',
      'pagination.next': 'Next',

      // Status messages
      'status.loading': 'Loading repositories...',
      'status.empty': 'No repositories found',
      'status.resultCount': '{count} repositories found',
      'status.copiedToClipboard': 'Copied to clipboard',

      // Errors
      'error.generic': 'An error occurred. Please try again.',
      'error.rateLimit': 'GitHub API rate limit exceeded. Please wait and try again later.',
      'error.unauthorized': 'Unauthorized. Please check your Personal Access Token.',
      'error.notFound': 'Not found. Please verify the organization and team slug.',
      'error.noTeamSelected': 'Please select at least one team.',

      // Dark mode
      'darkMode.toggle': 'Dark Mode',

      // Language switcher
      'lang.switch': 'Language',
      'lang.en': 'English',
      'lang.ko': 'Korean'
    },

    ko: {
      // Page
      'page.title': 'GitHub Scanner',
      'page.header': 'GitHub Scanner',

      // Input labels
      'label.pat': '개인 액세스 토큰 (PAT)',
      'label.org': '조직',
      'label.team': '팀',

      // Placeholders
      'placeholder.pat': 'ghp_xxxx...',

      // PAT help
      'pat.help.title': 'PAT 도움말',
      'pat.help.tooltip': '토큰에는 팀 정보 접근을 위한 read:org 스코프와 비공개 저장소 접근을 위한 repo 스코프가 필요합니다.',
      'pat.help.details': 'GitHub > Settings > Developer settings > Personal access tokens에서 토큰을 생성하세요. 필요한 스코프: 팀 접근을 위한 read:org, 비공개 저장소 접근을 위한 repo.',
      'pat.scope.readOrg': '팀 및 조직 정보 접근에 필요',
      'pat.scope.repo': '비공개 저장소 접근에 필요',

      // Buttons
      'button.scan': '스캔',
      'button.copyMarkdown': '마크다운 복사',
      'button.downloadCsv': 'CSV 다운로드',

      // Table headers
      'table.name': '이름',
      'table.description': '설명',
      'table.language': '언어',
      'table.updated': '수정일',
      'table.created': '생성일',
      'table.visibility': '공개 범위',
      'table.archived': '보관 여부',

      // Team
      'team.loadBtn': '팀 불러오기',
      'team.loading': '팀 목록 로딩 중...',
      'team.placeholder': '팀을 선택하세요...',
      'team.selectAll': '전체 선택',
      'team.deselectAll': '전체 해제',
      'team.selected': '{count}개 팀 선택됨',

      // Filters
      'filter.showArchived': '보관된 항목 표시',
      'filter.visibility': '공개 범위',
      'filter.visibility.all': 'All',
      'filter.visibility.public': 'Public',
      'filter.visibility.private': 'Private',
      'filter.permission': 'Permission',
      'filter.permission.all': 'All',
      'filter.permission.admin': 'Admin',
      'filter.permission.maintain': 'Maintain',
      'filter.permission.push': 'Write',
      'filter.permission.triage': 'Triage',
      'filter.permission.pull': 'Read',

      // Pagination
      'pagination.perPage': '페이지당',
      'pagination.page': '{total} 중 {current} 페이지',
      'pagination.prev': '이전',
      'pagination.next': '다음',

      // Status messages
      'status.loading': '저장소 로딩 중...',
      'status.empty': '저장소를 찾을 수 없습니다',
      'status.resultCount': '{count}개의 저장소를 찾았습니다',
      'status.copiedToClipboard': '클립보드에 복사되었습니다',

      // Errors
      'error.generic': '오류가 발생했습니다. 다시 시도해 주세요.',
      'error.rateLimit': 'GitHub API 호출 제한을 초과했습니다. 잠시 후 다시 시도해 주세요.',
      'error.unauthorized': '인증에 실패했습니다. 개인 액세스 토큰을 확인해 주세요.',
      'error.notFound': '찾을 수 없습니다. 조직명과 팀을 확인해 주세요.',
      'error.noTeamSelected': '팀을 하나 이상 선택해 주세요.',

      // Dark mode
      'darkMode.toggle': '다크 모드',

      // Language switcher
      'lang.switch': '언어',
      'lang.en': '영어',
      'lang.ko': '한국어'
    }
  };

  var currentLang = DEFAULT_LANG;

  /**
   * Initialise language from localStorage or browser preference.
   */
  function init() {
    var stored = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage may be unavailable (private browsing, etc.)
    }

    if (stored && SUPPORTED_LANGS.indexOf(stored) !== -1) {
      currentLang = stored;
    } else {
      // Detect from browser
      var browserLang = (navigator.language || navigator.userLanguage || '').slice(0, 2).toLowerCase();
      if (SUPPORTED_LANGS.indexOf(browserLang) !== -1) {
        currentLang = browserLang;
      } else {
        currentLang = DEFAULT_LANG;
      }
    }
  }

  /**
   * Get the translated string for the given key in the current language.
   * Supports simple interpolation: I18n.t('status.resultCount', { count: 42 })
   *
   * @param {string} key  — dot-separated translation key
   * @param {Object} [params] — optional interpolation values
   * @returns {string} translated text, or the key itself if not found
   */
  function t(key, params) {
    var dict = translations[currentLang] || translations[DEFAULT_LANG];
    var text = dict[key];

    if (text === undefined) {
      // Fallback to default language
      text = (translations[DEFAULT_LANG] || {})[key];
    }

    if (text === undefined) {
      return key;
    }

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(function (name) {
        text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), params[name]);
      });
    }

    return text;
  }

  /**
   * Switch to the given language and persist the choice.
   *
   * @param {string} lang — language code ('en' or 'ko')
   */
  function setLang(lang) {
    if (SUPPORTED_LANGS.indexOf(lang) === -1) {
      return;
    }
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // Ignore storage errors
    }
  }

  /**
   * Return the current language code.
   *
   * @returns {string}
   */
  function getLang() {
    return currentLang;
  }

  /**
   * Format an ISO-8601 date string for display in the current locale.
   *
   * @param {string} dateString — e.g. "2025-03-15T08:30:00Z"
   * @returns {string} locale-formatted date string
   */
  function formatDate(dateString) {
    if (!dateString) {
      return '';
    }

    var date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }

    var locale = currentLang === 'ko' ? 'ko-KR' : 'en-US';

    try {
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      // Fallback for environments without Intl support
      return date.toLocaleDateString();
    }
  }

  // Run initialisation immediately
  init();

  // Public API
  global.I18n = {
    t: t,
    setLang: setLang,
    getLang: getLang,
    formatDate: formatDate
  };

})(window);
