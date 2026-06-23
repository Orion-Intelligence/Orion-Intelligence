type SearchEndpoint16 = 'strategic' | 'breach' | 'defacement' | 'social' | 'exploit';

export interface ExpectedSearchResult16 {
  title?: string;
  linkAddress?: string | string[];
  date?: string | null;
  responseDate?: string | null;
  description?: string | null;
  baseUrl?: string | string[];
  team?: string;
  webUrl?: string | string[];
  queryMatches: string[];
}

export interface DirectSearchCase16 {
  section: string;
  route: string;
  endpoint: SearchEndpoint16;
  searchQuery: string;
  expected: ExpectedSearchResult16;
}

export interface SidebarFilterCase16 extends DirectSearchCase16 {
  selectTestId: string;
  option: string;
  requestField: string;
  requestValue: string;
  responseFields?: string[];
  responseValue?: string;
}

export interface AdvancedEmailFilterCase16 {
  section: string;
  route: string;
  endpoint: SearchEndpoint16;
  email: string;
  expected: ExpectedSearchResult16;
}

const API_BASE_16 = '**/api/search';
const SEARCH_INPUT_16 = 'input[data-testid="dashboard-general-input"][name="q"]';

export const DIRECT_SEARCH_CASES: DirectSearchCase16[] = [
  {
    section: 'General Intelligence',
    route: '/dashboard/strategic/all',
    endpoint: 'strategic',
    searchQuery: 'underground market - prepaid & cloned cards',
    expected: {
      title: 'underground market - prepaid & cloned cards, amazon gift, paypal',
      linkAddress: 'http://2222fxq4xfkvilzdihu5ybce7ztf66fr6c7ub3enabg5iya2f34ac5id.onion/paypal-accounts.php',
      date: null,
      responseDate: null,
      description: 'copyright 2026 - underground marketwe',
      queryMatches: ['underground market', 'prepaid', 'cloned cards'],
    },
  },
  {
    section: 'Data Breach',
    route: '/dashboard/breach/all',
    endpoint: 'breach',
    searchQuery: 'Wold Architects and Engineers',
    expected: {
      title: 'Wold Architects and Engineers',
      linkAddress: 'http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/',
      date: 'Jan 24, 2026',
      responseDate: '2026-01-24',
      description: 'A full-service planning, architecture & engineering firm',
      queryMatches: ['Wold Architects', 'Engineers'],
    },
  },
  {
    section: 'Defacement',
    route: '/dashboard/defacement/all',
    endpoint: 'defacement',
    searchQuery: 'joindarkside.pro',
    expected: {
      baseUrl: 'https://tweetfeed.live/',
      team: 'CarlyGriggs13',
      date: 'Jan 24, 2026',
      responseDate: '2026-01-24',
      webUrl: ['joindarkside.pro', 'https://joindarkside.pro'],
      queryMatches: ['joindarkside.pro'],
    },
  },
  {
    section: 'Social',
    route: '/dashboard/social/all',
    endpoint: 'social',
    searchQuery: 'UNLIMITED PHONE NUMBERS FOR FREE',
    expected: {
      title: 'HOW TO CREATE UNLIMITED PHONE NUMBERS FOR FREE EXCLUSIVE LEAK 2026',
      linkAddress: 'https://xreactor.org/threads/how-to-create-unlimited-phone-numbers-for-free-exclusive-leak-2026.33161/',
      date: 'Jun 12, 2025',
      responseDate: '2025-06-12',
      description: null,
      queryMatches: ['UNLIMITED PHONE NUMBERS', 'FREE'],
    },
  },
  {
    section: 'Exploit',
    route: '/dashboard/exploit/all',
    endpoint: 'exploit',
    searchQuery: 'CVE-2025-57819 FreePBX',
    expected: {
      title: 'Exploit for SQL Injection in Sangoma Freepbx CVE-2025-57819 CVE-2025-61678',
      linkAddress: 'https://sploitus.com/exploit?id=A52A5B67-31DB-5B86-B528-C2F4F2A57FB3',
      date: 'Jun 19, 2026',
      responseDate: '2026-06-19',
      description: 'Exploit for SQL Injection in Sangoma Freepbx CVE-2025-57819 CVE-2025-61678',
      queryMatches: ['CVE-2025-57819', 'FreePBX'],
    },
  },
  {
    section: 'Feed',
    route: '/dashboard/feed/news',
    endpoint: 'breach',
    searchQuery: 'Armenia probes alleged sale of 8 million gov',
    expected: {
      title: 'Armenia probes alleged sale of 8 million government records on hacker forum',
      linkAddress: 'https://therecord.media/armenia-probes-alleged-sale-government-records',
      date: 'Jan 12, 2026',
      responseDate: '2026-01-12',
      description: 'Hackers are offering for sale what they claim is a large trove of Armenian government-related data',
      queryMatches: ['Armenia', '8 million', 'gov'],
    },
  },
];

export const SIDEBAR_FILTER_CASES: SidebarFilterCase16[] = [
  {
    ...DIRECT_SEARCH_CASES[0],
    selectTestId: 'side-filter-select-network',
    option: 'Onion',
    requestField: 'network',
    requestValue: 'onion',
    responseFields: ['m_network'],
    responseValue: 'onion',
  },
  {
    ...DIRECT_SEARCH_CASES[1],
    selectTestId: 'side-filter-select-network',
    option: 'Onion',
    requestField: 'network',
    requestValue: 'onion',
    responseFields: ['m_network'],
    responseValue: 'onion',
  },
  {
    ...DIRECT_SEARCH_CASES[2],
    selectTestId: 'side-filter-select-network',
    option: 'Clearnet',
    requestField: 'network',
    requestValue: 'clearnet',
  },
  {
    ...DIRECT_SEARCH_CASES[3],
    selectTestId: 'side-filter-select-network',
    option: 'Clearnet',
    requestField: 'network',
    requestValue: 'clearnet',
    responseFields: ['m_network'],
    responseValue: 'clearnet',
  },
  {
    section: 'Exploit',
    route: '/dashboard/exploit/all',
    endpoint: 'exploit',
    searchQuery: 'CVE-2017-0120 Uniscribe',
    expected: {
      title: 'CVE-2017-0128',
      linkAddress: 'https://raw.githubusercontent.com/trickest/cve/main/2017/CVE-2017-0128.md',
      date: 'Jun 20, 2026',
      responseDate: '2026-06-20',
      description: 'Uniscribe Information Disclosure Vulnerability',
      queryMatches: ['CVE-2017-0120', 'Uniscribe'],
    },
    selectTestId: 'side-filter-select-m_cve',
    option: 'CVE-2017-0120',
    requestField: 'm_cve',
    requestValue: 'cve-2017-0120',
    responseFields: ['m_cve'],
    responseValue: 'cve-2017-0120',
  },
  {
    ...DIRECT_SEARCH_CASES[5],
    selectTestId: 'side-filter-select-network',
    option: 'Clearnet',
    requestField: 'network',
    requestValue: 'clearnet',
    responseFields: ['m_network'],
    responseValue: 'clearnet',
  },
];

export const ADVANCED_EMAIL_FILTER_CASE: AdvancedEmailFilterCase16 = {
  section: 'Exploit',
  route: '/dashboard/exploit/all',
  endpoint: 'exploit',
  email: 'attacker@example.com',
  expected: {
    title: 'Authenticated SMTP users may spoof other identities due to ambiguous \\u201cFrom\\u201d header interpretation',
    linkAddress: 'https://www.kb.cert.org/vuls/id/517845',
    date: 'Oct 28, 2025',
    responseDate: '2025-10-28',
    description: null,
    queryMatches: ['attacker@example.com'],
  },
};

function resetSearchStorage16(win: Window) {
  win.localStorage.setItem('entityfilterCategories', '{}');
  win.localStorage.setItem('entityFilterCondition', 'true');
  win.localStorage.setItem('matchType', 'or');
  win.localStorage.setItem('advance_setting_toggle', 'true');
}

function waitForSearchReady16() {
  cy.get('app-loading-form').should('not.exist');
  cy.get('.ui-shimmer', { timeout: 60000 }).should('not.exist');
  cy.get(SEARCH_INPUT_16).first().should('be.visible').and('be.enabled');
}

function visitSearchSection16(route: string) {
  cy.visit(`${route}?page=1`, {
    onBeforeLoad: resetSearchStorage16,
  });
  cy.location('pathname').should('eq', route);
  waitForSearchReady16();
}

function searchAlias16(endpoint: SearchEndpoint16, alias: string) {
  cy.intercept('POST', `${API_BASE_16}/${endpoint}`).as(alias);
}

function typeDashboardSearch16(value: string) {
  cy.scrollDashboardToTop();
  waitForSearchReady16();
  cy.get(SEARCH_INPUT_16).first()
    .type(`{selectall}{backspace}${value}`, { force: true });
  submitDashboardSearch16();
}

function submitDashboardSearch16() {
  cy.scrollDashboardToTop();
  cy.get('body').then(($body) => {
    const submitButton = $body.find('[data-testid="dashboard-search-submit"]:visible').first();
    if (submitButton.length > 0) {
      cy.wrap(submitButton).scrollIntoView().should('be.visible').click({ force: true });
      return;
    }
    cy.get(SEARCH_INPUT_16).first().type('{enter}', { force: true });
  });
}

function normalize16(value: unknown): string {
  return displayText16(value)
    .replace(/\\u201c/g, '"')
    .replace(/\\u201d/g, '"')
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function displayText16(value: unknown): string {
  return String(value ?? '')
    .replace(/\\u201c/g, '“')
    .replace(/\\u201d/g, '”');
}

function normalizeUrl16(value: unknown): string {
  return normalize16(value).replace(/\/$/, '');
}

function values16(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(item => values16(item));
  }
  return [String(value ?? '').trim()].filter(Boolean);
}

function fieldValues16(item: any, fields: string[]): string[] {
  return fields
    .flatMap(field => values16(item?.[field]))
    .filter(Boolean);
}

function resultItems16(body: any): any[] {
  if (Array.isArray(body?.Result)) {
    return body.Result;
  }
  if (Array.isArray(body?.result)) {
    return body.result;
  }
  if (Array.isArray(body?.data?.Result)) {
    return body.data.Result;
  }
  if (Array.isArray(body?.hits?.hits)) {
    return body.hits.hits.map((hit: any) => hit?._source || hit);
  }
  return [];
}

function expectedList16(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function hasExpectedText16(item: any, fields: string[], expected: string): boolean {
  const normalizedExpected = normalize16(expected);
  return fieldValues16(item, fields).some(value => normalize16(value) === normalizedExpected);
}

function hasExpectedUrl16(item: any, fields: string[], expected: string): boolean {
  const normalizedExpected = normalizeUrl16(expected);
  return fieldValues16(item, fields).some(value => normalizeUrl16(value) === normalizedExpected);
}

function resultMatchesExpected16(item: any, expected: ExpectedSearchResult16): boolean {
  const titleMatches = expected.title
    ? hasExpectedText16(item, ['title', 'm_title', 'm_name', 'name'], expected.title)
    : true;
  const linkMatches = expectedList16(expected.linkAddress).length
    ? expectedList16(expected.linkAddress).some(link => hasExpectedUrl16(item, ['link_address', 'm_url', 'm_url_www', 'url', 'm_origin_url', 'm_message_sharable_link', 'm_channel_url'], link))
    : true;
  const baseUrlMatches = expectedList16(expected.baseUrl).length
    ? expectedList16(expected.baseUrl).some(baseUrl => hasExpectedText16(item, ['base_url', 'm_base_url', 'm_url', 'url'], baseUrl))
    : true;
  const webUrlMatches = expectedList16(expected.webUrl).length
    ? expectedList16(expected.webUrl).some(webUrl => hasExpectedUrl16(item, ['web_url', 'm_url', 'url', 'm_origin_url'], webUrl))
    : true;
  const teamMatches = expected.team
    ? hasExpectedText16(item, ['team', 'm_team', 'm_author', 'm_name'], expected.team)
    : true;
  const dateMatches = expected.responseDate
    ? fieldValues16(item, ['date', 'm_date', 'm_creation_date', 'created_at']).some(date => normalize16(date).includes(normalize16(expected.responseDate)))
    : true;

  return titleMatches && linkMatches && baseUrlMatches && webUrlMatches && teamMatches && dateMatches;
}

function findExpectedResult16(body: any, expected: ExpectedSearchResult16): any {
  const items = resultItems16(body);
  expect(items.length, 'Search API returned result count').to.be.greaterThan(0);

  const match = items.find(item => resultMatchesExpected16(item, expected));
  expect(match, `static expected result "${expected.title || expected.baseUrl || expected.linkAddress}"`).to.exist;
  return match;
}

function assertQueryEvidence16(item: any, expected: ExpectedSearchResult16) {
  const haystack = normalize16(JSON.stringify(item));
  expected.queryMatches.forEach(queryMatch => {
    expect(haystack, `query evidence "${queryMatch}"`).to.include(normalize16(queryMatch));
  });
}

function assertResponseResult16(interception: any, expected: ExpectedSearchResult16): any {
  const result = findExpectedResult16(interception.response?.body, expected);
  assertQueryEvidence16(result, expected);
  return result;
}

function assertFilteredResponse16(interception: any, filterCase: SidebarFilterCase16) {
  const result = assertResponseResult16(interception, filterCase.expected);

  if (!filterCase.responseFields || !filterCase.responseValue) {
    return;
  }

  const values = fieldValues16(result, filterCase.responseFields).map(value => normalize16(value));
  expect(values, filterCase.responseFields.join(',')).to.include(normalize16(filterCase.responseValue));
}

function requestValue16(body: any, field: string): string {
  const value = body?.[field];
  if (Array.isArray(value)) {
    return normalize16(value[0]);
  }
  return normalize16(value);
}

function assertSearchRequest16(interception: any, searchCase: DirectSearchCase16) {
  expect(normalize16(interception.request.body?.q), `${searchCase.section} request q`).to.eq(normalize16(searchCase.searchQuery));
}

function assertSidebarRequest16(interception: any, filterCase: SidebarFilterCase16) {
  expect(normalize16(interception.request.body?.q), `${filterCase.section} filter request q`).to.eq(normalize16(filterCase.searchQuery));
  expect(requestValue16(interception.request.body, filterCase.requestField), `${filterCase.section} request ${filterCase.requestField}`).to.eq(filterCase.requestValue);
}

function waitForMatchingSearch16(alias: string, matches: (interception: any) => boolean, label: string, attempts = 5): Cypress.Chainable<any> {
  return cy.wait(`@${alias}`).then((interception) => {
    if (matches(interception)) {
      return interception;
    }
    if (attempts <= 1) {
      throw new Error(`Expected matching ${label} request was not captured.`);
    }
    return waitForMatchingSearch16(alias, matches, label, attempts - 1);
  });
}

function matchesQueryRequest16(searchCase: DirectSearchCase16) {
  return (interception: any) => normalize16(interception.request.body?.q) === normalize16(searchCase.searchQuery);
}

function matchesSidebarRequest16(filterCase: SidebarFilterCase16) {
  return (interception: any) => normalize16(interception.request.body?.q) === normalize16(filterCase.searchQuery)
    && requestValue16(interception.request.body, filterCase.requestField) === filterCase.requestValue;
}

function matchesEmailFilterRequest16(filterCase: AdvancedEmailFilterCase16) {
  return (interception: any) => (interception.request.body?.entity_filter?.m_email || []).includes(filterCase.email);
}

function assertRenderedSearchResult16(expected: ExpectedSearchResult16) {
  if (expected.baseUrl || expected.team) {
    if (expected.team) {
      cy.get('body').should('contain.text', expected.team);
    }
    expected.queryMatches.forEach(queryMatch => {
      cy.get('body').should('contain.text', queryMatch);
    });
    return;
  }

  cy.get('[data-testid="result-card"]', { timeout: 20000 }).should('have.length.at.least', 1);
  cy.contains('[data-testid="result-card"]', displayText16(expected.title), { matchCase: false })
    .scrollIntoView()
    .should('be.visible')
    .within(() => {
      expectedList16(expected.linkAddress).forEach(link => {
        cy.contains(link).should('exist');
      });
      if (expected.date) {
        cy.contains(expected.date).should('exist');
      }
    });
}

function openSidebar16() {
  cy.scrollDashboardToTop();
  cy.openSideFilter();
  cy.get('[data-testid="side-filter-apply"]').filter(':visible')
    .first()
    .should('be.visible');
}

function selectSidebarFilterOption16(selectTestId: string, option: string) {
  cy.get(`[data-testid="${selectTestId}"]`).filter(':visible')
    .first()
    .scrollIntoView()
    .should('be.visible')
    .then(($select) => {
      if ($select.is('select')) {
        cy.wrap($select).select(option);
        return;
      }

      const menuId = $select.attr('aria-controls');
      expect(menuId, `${selectTestId} menu id`).to.exist;
      cy.wrap($select).click({ force: true });
      cy.get(`#${menuId}`).parent()
        .find('input')
        .then(($input) => {
          if ($input.length > 0) {
            cy.wrap($input.first()).clear({ force: true }).type(option, { force: true });
          }
        });
      cy.contains(`#${menuId} [role="option"]`, option, { timeout: 15000 }).click({ force: true });
    });
}

function ensureAdvancedFiltersOpen16() {
  cy.get(SEARCH_INPUT_16).first().click({ force: true });
  cy.get('[data-testid="dashboard-advance-toggle"]').should('exist')
    .then(($toggle) => {
      if (!($toggle[0] as HTMLInputElement).checked) {
        cy.wrap($toggle).closest('label').click({ force: true });
      }
    });
  cy.get(SEARCH_INPUT_16).first().click({ force: true });
  cy.get('app-search-filters').should('be.visible');
}

function applyEntityFilter16(category: string, value: string) {
  const categoryKey = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  cy.get(`[data-testid="entity-filter-category-${categoryKey}"]`).should('exist')
    .scrollIntoView()
    .click({ force: true });
  cy.get('[data-testid="entity-filter-value-input"]').scrollIntoView()
    .clear({ force: true })
    .type(value, { force: true });
  cy.get('[data-testid="entity-filter-add-value"]').should('be.visible')
    .scrollIntoView()
    .click({ force: true });
  cy.contains('app-search-filters', value).should('be.visible');
}

function clearEntityFilters16() {
  ensureAdvancedFiltersOpen16();
  cy.get('[data-testid="entity-filter-clear-selection"]').scrollIntoView()
    .click({ force: true });
}

export function assertDirectSearchResult16(searchCase: DirectSearchCase16) {
  const alias = `${searchCase.endpoint}DirectSearch16`;

  visitSearchSection16(searchCase.route);
  searchAlias16(searchCase.endpoint, alias);
  typeDashboardSearch16(searchCase.searchQuery);

  waitForMatchingSearch16(alias, matchesQueryRequest16(searchCase), `${searchCase.section} direct search`).then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    assertSearchRequest16(interception, searchCase);
    assertResponseResult16(interception, searchCase.expected);
  });
  assertRenderedSearchResult16(searchCase.expected);
}

export function assertSidebarFilterResult16(filterCase: SidebarFilterCase16) {
  const directAlias = `${filterCase.endpoint}BeforeSidebar16`;
  const filterAlias = `${filterCase.endpoint}SidebarSearch16`;

  visitSearchSection16(filterCase.route);
  searchAlias16(filterCase.endpoint, directAlias);
  typeDashboardSearch16(filterCase.searchQuery);
  waitForMatchingSearch16(directAlias, matchesQueryRequest16(filterCase), `${filterCase.section} pre-filter search`).then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    assertResponseResult16(interception, filterCase.expected);
  });

  openSidebar16();
  selectSidebarFilterOption16(filterCase.selectTestId, filterCase.option);
  searchAlias16(filterCase.endpoint, filterAlias);
  cy.get('[data-testid="side-filter-apply"]').filter(':visible')
    .first()
    .click({ force: true });

  waitForMatchingSearch16(filterAlias, matchesSidebarRequest16(filterCase), `${filterCase.section} sidebar filter`).then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    assertSidebarRequest16(interception, filterCase);
    assertFilteredResponse16(interception, filterCase);
  });
  assertRenderedSearchResult16(filterCase.expected);
}

export function assertAdvancedEmailFilterResult16(filterCase: AdvancedEmailFilterCase16) {
  const alias = `${filterCase.endpoint}AdvancedEmailSearch16`;

  visitSearchSection16(filterCase.route);
  clearEntityFilters16();
  applyEntityFilter16('Emails', filterCase.email);
  searchAlias16(filterCase.endpoint, alias);
  submitDashboardSearch16();

  waitForMatchingSearch16(alias, matchesEmailFilterRequest16(filterCase), `${filterCase.section} email filter`).then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
    expect(interception.request.body?.entity_filter?.m_email || []).to.include(filterCase.email);
    assertResponseResult16(interception, filterCase.expected);
  });
  assertRenderedSearchResult16(filterCase.expected);
}
