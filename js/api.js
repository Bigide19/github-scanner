/**
 * GitHub API module for fetching team repositories.
 * Vanilla JS — load via <script src="js/api.js"></script>
 */
(function (global) {
  "use strict";

  var BASE_URL = "https://api.github.com";

  /**
   * Build standard headers for GitHub API requests.
   */
  function buildHeaders(token) {
    return {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github.v3+json",
    };
  }

  /**
   * Inspect a failed response and throw a descriptive error.
   */
  async function handleError(response) {
    if (response.status === 401) {
      throw new Error("Unauthorized \u2014 check your PAT");
    }
    if (response.status === 404) {
      throw new Error("Not found \u2014 check organization and team slug");
    }
    if (response.status === 403) {
      var rateLimitRemaining = response.headers.get("x-ratelimit-remaining");
      if (rateLimitRemaining !== null && Number(rateLimitRemaining) === 0) {
        throw new Error("Rate limited \u2014 try again later");
      }
    }
    throw new Error("GitHub API error: " + response.status);
  }

  /**
   * Map a raw GitHub repository object to a clean shape.
   */
  /**
   * Derive the highest permission level from the permissions object.
   */
  function derivePermission(perms) {
    if (!perms) return 'pull';
    if (perms.admin) return 'admin';
    if (perms.maintain) return 'maintain';
    if (perms.push) return 'push';
    if (perms.triage) return 'triage';
    return 'pull';
  }

  function mapRepo(raw) {
    return {
      name: raw.name,
      description: raw.description,
      language: raw.language,
      updatedAt: raw.updated_at,
      createdAt: raw.created_at,
      url: raw.html_url,
      visibility: raw.visibility,
      archived: raw.archived,
      stars: raw.stargazers_count,
      permission: derivePermission(raw.permissions),
    };
  }

  /**
   * Fetch all repositories belonging to a team, handling pagination
   * automatically.
   *
   * @param {string} token  - GitHub Personal Access Token
   * @param {string} org    - GitHub organization login
   * @param {string} teamSlug - Team slug (URL-friendly name)
   * @returns {Promise<Array>} Array of mapped repo objects
   */
  async function fetchTeamRepos(token, org, teamSlug) {
    var allRepos = [];
    var page = 1;
    var perPage = 100;

    while (true) {
      var url =
        BASE_URL +
        "/orgs/" +
        encodeURIComponent(org) +
        "/teams/" +
        encodeURIComponent(teamSlug) +
        "/repos?per_page=" +
        perPage +
        "&page=" +
        page;

      var response = await fetch(url, { headers: buildHeaders(token) });

      if (!response.ok) {
        await handleError(response);
      }

      var repos = await response.json();
      for (var i = 0; i < repos.length; i++) {
        allRepos.push(mapRepo(repos[i]));
      }

      if (repos.length < perPage) {
        break;
      }

      page++;
    }

    return allRepos;
  }

  /**
   * Quick check whether a token is valid.
   *
   * @param {string} token - GitHub Personal Access Token
   * @returns {Promise<boolean>} true if the token is valid, false otherwise
   */
  async function validateToken(token) {
    try {
      var response = await fetch(BASE_URL + "/user", {
        headers: buildHeaders(token),
      });
      return response.status === 200;
    } catch (e) {
      return false;
    }
  }

  /**
   * Fetch all teams in an organization (with pagination).
   *
   * @param {string} token - GitHub PAT
   * @param {string} org   - GitHub organization login
   * @returns {Promise<Array>} Array of { slug, name, description }
   */
  async function fetchOrgTeams(token, org) {
    var allTeams = [];
    var page = 1;
    var perPage = 100;

    while (true) {
      var url =
        BASE_URL +
        "/orgs/" +
        encodeURIComponent(org) +
        "/teams?per_page=" +
        perPage +
        "&page=" +
        page;

      var response = await fetch(url, { headers: buildHeaders(token) });

      if (!response.ok) {
        await handleError(response);
      }

      var teams = await response.json();
      for (var i = 0; i < teams.length; i++) {
        allTeams.push({
          slug: teams[i].slug,
          name: teams[i].name,
          description: teams[i].description,
        });
      }

      if (teams.length < perPage) {
        break;
      }
      page++;
    }

    return allTeams;
  }

  global.GitHubAPI = {
    fetchTeamRepos: fetchTeamRepos,
    fetchOrgTeams: fetchOrgTeams,
    validateToken: validateToken,
  };
})(window);
