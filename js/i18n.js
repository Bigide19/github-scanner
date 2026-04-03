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
      'label.pat': 'Token (PAT)',
      'label.org': 'Organization',
      'label.team': 'Team',

      // Placeholders
      'placeholder.pat': 'ghp_xxxx...',

      // PAT help
      'pat.help.title': 'PAT Help',
      'pat.help.tooltip': 'Needs read:org and repo scopes.',
      'pat.help.details': 'GitHub > Settings > Developer settings > Personal access tokens. Scopes: read:org, repo.',
      'pat.scope.readOrg': 'Team & org access',
      'pat.scope.repo': 'Private repo access',
      'pat.security.title': 'Is my token safe?',
      'pat.security.noBackend': 'Runs in your browser only — token is sent to GitHub API and nowhere else.',
      'pat.security.sessionOnly': 'Stored in sessionStorage — cleared when you close the tab.',
      'pat.security.openSource': 'Source code is public — verify it yourself.',
      'pat.security.fineGrained': 'Use a fine-grained PAT with read-only, org-scoped access.',

      // User scan
      'label.username': 'Username (comma-separated)',
      'status.scanProgress': 'Repos {current}/{total}',
      'status.scanTeamProgress': 'Teams {current}/{total}',
      'status.userDirect': 'Direct',
      'status.cancelled': 'Cancelled',

      // Buttons
      'button.scan': 'Scan',
      'button.scanUser': 'Scan User',
      'button.cancel': 'Cancel',
      'button.copyMarkdown': 'Markdown',
      'button.downloadCsv': 'CSV',

      // Table headers
      'table.name': 'Name',
      'table.description': 'Description',
      'table.language': 'Language',
      'table.updated': 'Updated',
      'table.created': 'Created',
      'table.teams': 'Teams',
      'table.visibility': 'Visibility',
      'table.archived': 'Archived',

      // Filters
      'filter.showArchived': 'Archived',
      'filter.visibility': 'Visibility',
      'filter.visibility.all': 'All',
      'filter.visibility.public': 'Public',
      'filter.visibility.private': 'Private',

      // Team
      'team.loadBtn': 'Load',
      'team.loading': 'Loading...',
      'team.placeholder': 'Select...',
      'team.selectAll': 'All',
      'team.deselectAll': 'None',
      'team.selected': '{count} selected',
      'team.inherited': 'Inherited from parent team',
      'team.inheritedFrom': 'Inherited from {parent}',

      // Filters
      'filter.showArchived': 'Archived',
      'filter.includeInherited': 'Inherited',
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
      'pagination.perPage': 'Rows',
      'pagination.page': '{current} / {total}',
      'pagination.prev': 'Prev',
      'pagination.next': 'Next',

      // Status messages
      'status.loading': 'Loading...',
      'status.loadingTeams': 'Loading repos...',
      'status.empty': 'No repos found',
      'status.resultCount': '{count} repos',
      'status.copiedToClipboard': 'Copied!',
      'status.tokenScope': 'Only repos accessible to your token are shown.',

      // Errors
      'error.generic': 'Something went wrong. Try again.',
      'error.rateLimit': 'Rate limit hit. Try again later.',
      'error.unauthorized': 'Bad token. Check your PAT.',
      'error.notFound': 'Not found. Check org and team.',
      'error.noTeamSelected': 'Select a team first.',
      'error.noSelection': 'Select a team or enter a username.',

      // Dark mode
      'darkMode.toggle': 'Dark',

      // Language switcher
      'lang.switch': 'Lang',
      'lang.en': 'English',
      'lang.ko': 'Korean'
    },

    ko: {
      // Page
      'page.title': 'GitHub Scanner',
      'page.header': 'GitHub Scanner',

      // Input labels
      'label.pat': '토큰 (PAT)',
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
      'pat.security.title': '내 토큰은 안전한가요?',
      'pat.security.noBackend': '이 앱은 브라우저에서만 실행됩니다 — 백엔드 서버가 없으며, 토큰은 GitHub API 외에 어디로도 전송되지 않습니다.',
      'pat.security.sessionOnly': '토큰은 sessionStorage에 저장되며, 탭을 닫으면 자동으로 삭제됩니다.',
      'pat.security.openSource': '소스 코드가 공개되어 있으므로 직접 확인할 수 있습니다.',
      'pat.security.fineGrained': 'Fine-grained PAT을 사용하여 read-only 권한으로, 해당 조직에만 범위를 제한하는 것을 권장합니다.',

      // User scan
      'label.username': '사용자명 (쉼표로 구분)',
      'status.scanProgress': '레포 {current}/{total}',
      'status.scanTeamProgress': '팀 {current}/{total}',
      'status.userDirect': '직접',
      'status.cancelled': '취소됨',

      // Buttons
      'button.scan': '스캔',
      'button.scanUser': '사용자 스캔',
      'button.cancel': '취소',
      'button.copyMarkdown': '마크다운',
      'button.downloadCsv': 'CSV',

      // Table headers
      'table.name': '이름',
      'table.description': '설명',
      'table.language': '언어',
      'table.updated': 'updatedAt',
      'table.created': '생성일',
      'table.teams': '소속',
      'table.visibility': '공개 범위',
      'table.archived': '보관 여부',

      // Team
      'team.loadBtn': '불러오기',
      'team.loading': '로딩 중...',
      'team.placeholder': '선택...',
      'team.selectAll': '전체',
      'team.deselectAll': '해제',
      'team.selected': '{count}개 선택',
      'team.inherited': '상위 팀에서 상속됨',
      'team.inheritedFrom': '{parent}에서 상속됨',

      // Filters
      'filter.showArchived': '보관됨',
      'filter.includeInherited': '상속 포함',
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
      'pagination.perPage': '행',
      'pagination.page': '{current} / {total}',
      'pagination.prev': '이전',
      'pagination.next': '다음',

      // Status messages
      'status.loading': '로딩 중...',
      'status.loadingTeams': '레포 로딩 중...',
      'status.empty': '결과 없음',
      'status.resultCount': '{count}개 레포',
      'status.copiedToClipboard': '복사됨!',
      'status.tokenScope': '토큰이 접근 가능한 레포만 표시됩니다.',

      // Errors
      'error.generic': '오류 발생. 다시 시도하세요.',
      'error.rateLimit': 'API 제한 초과. 잠시 후 재시도.',
      'error.unauthorized': '토큰 오류. PAT를 확인하세요.',
      'error.notFound': '찾을 수 없음. 조직/팀 확인.',
      'error.noTeamSelected': '팀을 선택하세요.',
      'error.noSelection': '팀 또는 사용자명을 입력하세요.',

      // Dark mode
      'darkMode.toggle': '다크',

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
