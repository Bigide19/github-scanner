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
          parent: teams[i].parent ? { slug: teams[i].parent.slug, name: teams[i].parent.name } : null,
        });
      }

      if (teams.length < perPage) {
        break;
      }
      page++;
    }

    return allTeams;
  }

  /**
   * Fetch teams directly assigned to a repository.
   *
   * @param {string} token
   * @param {string} org
   * @param {string} repoName
   * @returns {Promise<Array>} Array of { slug, name, permission }
   */
  async function fetchRepoTeams(token, org, repoName) {
    var allTeams = [];
    var page = 1;
    var perPage = 100;
    while (true) {
      var url = BASE_URL + "/repos/" + encodeURIComponent(org) + "/" + encodeURIComponent(repoName) + "/teams?per_page=" + perPage + "&page=" + page;
      var response = await fetch(url, { headers: buildHeaders(token) });
      if (!response.ok) await handleError(response);
      var teams = await response.json();
      for (var i = 0; i < teams.length; i++) {
        allTeams.push({
          slug: teams[i].slug,
          name: teams[i].name,
          permission: teams[i].permission
        });
      }
      if (teams.length < perPage) break;
      page++;
    }
    return allTeams;
  }

  /**
   * Fetch all repositories in an organization (paginated).
   */
  async function fetchOrgRepos(token, org) {
    var allRepos = [];
    var page = 1;
    var perPage = 100;
    while (true) {
      var url = BASE_URL + "/orgs/" + encodeURIComponent(org) + "/repos?per_page=" + perPage + "&page=" + page + "&type=all";
      var response = await fetch(url, { headers: buildHeaders(token) });
      if (!response.ok) await handleError(response);
      var repos = await response.json();
      for (var i = 0; i < repos.length; i++) {
        allRepos.push(mapRepo(repos[i]));
      }
      if (repos.length < perPage) break;
      page++;
    }
    return allRepos;
  }

  /**
   * Fetch direct collaborators for a repository.
   * Returns only users with direct (personal) access, not through teams.
   */
  async function fetchRepoDirectCollaborators(token, org, repoName) {
    var allCollabs = [];
    var page = 1;
    var perPage = 100;
    while (true) {
      var url = BASE_URL + "/repos/" + encodeURIComponent(org) + "/" + encodeURIComponent(repoName) + "/collaborators?affiliation=direct&per_page=" + perPage + "&page=" + page;
      var response = await fetch(url, { headers: buildHeaders(token) });
      if (!response.ok) await handleError(response);
      var collabs = await response.json();
      for (var i = 0; i < collabs.length; i++) {
        allCollabs.push({
          login: collabs[i].login,
          permission: derivePermission(collabs[i].permissions)
        });
      }
      if (collabs.length < perPage) break;
      page++;
    }
    return allCollabs;
  }

  /**
   * Execute a GitHub GraphQL query.
   */
  async function graphqlQuery(token, query, variables) {
    var response = await fetch(BASE_URL + '/graphql', {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify({ query: query, variables: variables || {} })
    });
    if (!response.ok) await handleError(response);
    var result = await response.json();
    if (result.errors && result.errors.length > 0) {
      throw new Error(result.errors[0].message);
    }
    return result.data;
  }

  var GQL_PERM_MAP = {
    'ADMIN': 'admin', 'MAINTAIN': 'maintain', 'WRITE': 'push',
    'TRIAGE': 'triage', 'READ': 'pull'
  };

  /**
   * Fetch org repos with direct collaborators via GraphQL.
   * Returns repos where the given user has direct access.
   *
   * @param {string} token
   * @param {string} org
   * @param {string} username
   * @param {Function} onProgress - called with (fetched, total)
   * @param {Function} shouldAbort - return true to stop
   * @returns {Promise<Array>}
   */
  async function fetchUserDirectRepos(token, org, username, onProgress, shouldAbort) {
    var QUERY = 'query($org: String!, $cursor: String) {\n'
      + '  organization(login: $org) {\n'
      + '    repositories(first: 100, after: $cursor) {\n'
      + '      totalCount\n'
      + '      pageInfo { hasNextPage endCursor }\n'
      + '      nodes {\n'
      + '        name\n'
      + '        description\n'
      + '        primaryLanguage { name }\n'
      + '        updatedAt\n'
      + '        createdAt\n'
      + '        url\n'
      + '        visibility\n'
      + '        isArchived\n'
      + '        stargazerCount\n'
      + '        collaborators(affiliation: DIRECT, first: 100) {\n'
      + '          edges { permission node { login } }\n'
      + '        }\n'
      + '      }\n'
      + '    }\n'
      + '  }\n'
      + '}';

    var results = [];
    var cursor = null;
    var fetched = 0;

    while (true) {
      if (shouldAbort && shouldAbort()) break;
      var data = await graphqlQuery(token, QUERY, { org: org, cursor: cursor });
      var repos = data.organization.repositories;
      var total = repos.totalCount;

      for (var i = 0; i < repos.nodes.length; i++) {
        var node = repos.nodes[i];
        if (!node.collaborators) continue;
        var edges = node.collaborators.edges;
        for (var j = 0; j < edges.length; j++) {
          if (edges[j].node.login.toLowerCase() === username.toLowerCase()) {
            results.push({
              name: node.name,
              description: node.description,
              language: node.primaryLanguage ? node.primaryLanguage.name : null,
              updatedAt: node.updatedAt,
              createdAt: node.createdAt,
              url: node.url,
              visibility: (node.visibility || '').toLowerCase(),
              archived: node.isArchived,
              stars: node.stargazerCount,
              permission: GQL_PERM_MAP[edges[j].permission] || 'pull'
            });
            break;
          }
        }
      }

      fetched += repos.nodes.length;
      if (onProgress) onProgress(fetched, total);
      if (!repos.pageInfo.hasNextPage) break;
      cursor = repos.pageInfo.endCursor;
    }

    return results;
  }

  global.GitHubAPI = {
    fetchTeamRepos: fetchTeamRepos,
    fetchOrgTeams: fetchOrgTeams,
    fetchRepoTeams: fetchRepoTeams,
    fetchOrgRepos: fetchOrgRepos,
    fetchRepoDirectCollaborators: fetchRepoDirectCollaborators,
    fetchUserDirectRepos: fetchUserDirectRepos,
    validateToken: validateToken,
  };
})(window);
