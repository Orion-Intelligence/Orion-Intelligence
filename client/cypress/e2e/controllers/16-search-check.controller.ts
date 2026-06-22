export type AdvancedFilterData = {
  endpoint: string;
  filters: {
    category_test_id: string;
    request_key: string;
    values: string[];
  }[];
};

export interface SearchResultData {
  search_query: string;
  title: string;
  link_address: string;
  date: string | null;
  description: string | null;
  query_matches: string[];
  advanced_filter?: AdvancedFilterData;
}

export type DefacementSearchResultData = {
  search_query: string;
  base_url: string | string[];
  team: string;
  date: string;
  web_url: string | string[];
  query_matches: string[];
};

export const SEARCH_FIXTURES = {
  general_intelligence_data: {
    search_query: 'underground market - prepaid & cloned cards',
    title: 'underground market - prepaid & cloned cards, amazon gift, paypal',
    link_address: 'http://2222fxq4xfkvilzdihu5ybce7ztf66fr6c7ub3enabg5iya2f34ac5id.onion/paypal-accounts.php',
    date: null,
    description: 'copyright 2026 - underground marketwe',
    query_matches: ['underground market', 'prepaid', 'cloned cards'],
  },
  data_breach: {
    search_query: 'Wold Architects and Engineers',
    title: 'Wold Architects and Engineers',
    link_address: 'http://3ev4metjirohtdpshsqlkrqcmxq6zu3d7obrdhglpy5jpbr7whmlfgqd.onion/',
    date: 'Jan 24, 2026',
    description: 'A full-service planning, architecture & engineering firm',
    query_matches: ['Wold Architects', 'Engineers'],
  },
  defacement_by_team: {
    search_query: 'CarlyGriggs13',
    base_url: ['magiceden-ntf.com', 'eng-victory-hub.com', 'joindarkside.pro', 'fitcoin-events.com'],
    team: 'CarlyGriggs13',
    date: 'Jan 24, 2026',
    web_url: [
      'https://x.com/CarlyGriggs13/status/2015019171218927764',
      'https://x.com/CarlyGriggs13/status/2014897534108319933',
      'https://x.com/CarlyGriggs13/status/2014897336539844898',
      'https://x.com/CarlyGriggs13/status/2015050781804875946',
    ],
    query_matches: ['CarlyGriggs13'],
  },
  defacement_by_base_url: {
    search_query: 'joindarkside.pro',
    base_url: 'joindarkside.pro',
    team: 'CarlyGriggs13',
    date: 'Jan 24, 2026',
    web_url: 'https://x.com/CarlyGriggs13/status/2014897534108319933',
    query_matches: ['joindarkside.pro'],
  },
  social: {
    search_query: 'Email Validator | High Accuracy',
    title: 'Email Validator | High Accuracy & Real Time Validation',
    link_address: 'https://xreactor.org/threads/email-validator-high-accuracy-real-time-validation.30048/',
    date: 'Dec 19, 2024',
    description: null,
    query_matches: ['Email Validator', 'High Accuracy'],
  },
  exploit: {
    search_query: 'CVE-2025-57819 FreePBX',
    title: 'Exploit for SQL Injection in Sangoma Freepbx CVE-2025-57819 CVE-2025-61678',
    link_address: 'https://sploitus.com/exploit?id=A52A5B67-31DB-5B86-B528-C2F4F2A57FB3',
    date: 'Jun 19, 2026',
    description: 'Exploit for SQL Injection in Sangoma Freepbx CVE-2025-57819 CVE-2025-61678',
    query_matches: ['CVE-2025-57819', 'FreePBX'],
    advanced_filter: {
      endpoint: 'search/exploit',
      filters: [
        {
          category_test_id: 'cve-cwe',
          request_key: 'm_cve',
          values: ['CVE-2025-57819'],
        },
      ],
    },
  },
  feed: {
    search_query: 'Armenia probes alleged sale of 8 million gov',
    title: 'Armenia probes alleged sale of 8 million government records on hacker forum',
    link_address: 'https://therecord.media/armenia-probes-alleged-sale-government-records',
    date: 'Jan 12, 2026',
    description: 'Hackers are offering for sale what they claim is a large trove of Armenian government-related data',
    query_matches: ['Armenia', '8 million', 'gov'],
  },
};

const SIDEBAR_GROUP_TESTID: Record<string, string> = {
  'General Intelligence': 'sidebar-group-strategic',
  'Data Breach': 'sidebar-group-breach',
  Defacement: 'sidebar-group-defacement',
  Social: 'sidebar-group-social',
  Exploit: 'sidebar-group-exploit',
  Feed: 'sidebar-group-feed',
};

const SIDEBAR_SUBITEM_PREFIX: Record<string, string> = {
  'General Intelligence': 'strategic',
  'Data Breach': 'breach',
  Defacement: 'defacement',
  Social: 'social',
  Exploit: 'exploit',
  Feed: 'feed',
};

const DEFAULT_SECTION: Record<string, string> = {
  'General Intelligence': 'All',
  'Data Breach': 'All',
  Defacement: 'All',
  Social: 'All',
  Exploit: 'All',
  Feed: 'News',
};

function sectionRoute15(groupTitle: string, itemTitle = DEFAULT_SECTION[groupTitle] || 'All'): string {
  const prefix = SIDEBAR_SUBITEM_PREFIX[groupTitle];
  expect(prefix, `route prefix mapping for "${groupTitle}"`).to.exist;

  const normalizedItem = String(itemTitle || 'All').toLowerCase();
  const category = groupTitle === 'Feed' && normalizedItem === 'all' ? 'news' : normalizedItem;
  return `/dashboard/${prefix}/${category}`;
}

function openSearchRoute15(groupTitle: string, itemTitle?: string) {
  const route = sectionRoute15(groupTitle, itemTitle);
  cy.visit(`${route}?page=1`);
  cy.location('pathname').should('eq', route);
  waitForSearchReady15();
}

export function openSidebarGroup15(title: string) {
  const testId = SIDEBAR_GROUP_TESTID[title];
  expect(testId, `sidebar testid mapping for "${title}"`).to.exist;
  openSearchRoute15(title);
}

export function clickSidebarSubItem15(groupTitle: string, itemTitle: string) {
  openSearchRoute15(groupTitle, itemTitle);
}

export function waitForSearchReady15() {
  cy.get('app-loading-form').should('not.exist');

  cy.get('body').then(($body) => {
    if ($body.find('app-filters:visible, app-search-filters:visible').length) {
      cy.scrollTo('top', {ensureScrollable: false});
    }
  });
}

export function typeDashboardSearch15(value: string) {
  waitForSearchReady15();

  cy.get('input[data-testid="dashboard-general-input"][name="q"]')
    .first()
    .scrollIntoView()
    .should('be.visible')
    .should('be.enabled')
    .then(($input) => {
      const currentValue = String($input.val() ?? '').trim();
      if (currentValue.length > 0) {
        cy.wrap($input).clear();
      }
    });
  cy.startInterceptTracking();
  cy.get('input[data-testid="dashboard-general-input"][name="q"]')
    .first()
    .type(`${value}{enter}`);
  cy.waitForIntercepts();
  assertSearchQueryState15(value);
}

export function searchAndAssertMatchingResult(data: SearchResultData) {
  expect(data.query_matches, `static query evidence for "${data.search_query}"`).to.have.length.greaterThan(0);
  typeDashboardSearch15(data.search_query);
  assertFirstResultCard(data);
}

export function searchAndAssertMatchingDefacementResult(data: DefacementSearchResultData) {
  expect(data.query_matches, `static query evidence for "${data.search_query}"`).to.have.length.greaterThan(0);
  typeDashboardSearch15(data.search_query);
  assertFirstDefacementRow(data);
}

export function searchAndAssertMatchingResultWithAdvancedFilters(data: SearchResultData) {
  expect(data.advanced_filter, `advanced filter fixture for "${data.search_query}"`).to.exist;
  const advancedFilter = data.advanced_filter as AdvancedFilterData;

  clearAdvancedFilters15();
  applyAdvancedFilters15(advancedFilter);
  cy.intercept('POST', `**/api/${advancedFilter.endpoint}`).as('advancedFilteredSearch');
  searchAndAssertMatchingResult(data);
  cy.wait('@advancedFilteredSearch').then((interception) => {
    const body = interception.request.body || {};
    expect(body.q, 'advanced-filter search query').to.eq(data.search_query);
    assertAdvancedFilterRequest15(body.entity_filter || {}, advancedFilter);
  });
}

export function assertSearchQueryState15(value: string) {
  cy.get('input[data-testid="dashboard-general-input"][name="q"]')
    .first()
    .should('have.value', value);

  cy.location().should((location) => {
    if (location.pathname.includes('/dashboard/defacement/')) {
      return;
    }
    const params = new URLSearchParams(location.search);
    expect(params.get('q')).to.eq(value);
  });
}

function assertQueryEvidence15(text: string, terms: string[], label: string) {
  const normalizedText = text.toLowerCase();
  terms.forEach((term) => {
    expect(
      normalizedText,
      `${label} should include query evidence "${term}"`
    ).to.include(term.toLowerCase());
  });
}

function openAdvancedFiltersPanel15() {
  waitForSearchReady15();
  cy.get('input[data-testid="dashboard-general-input"][name="q"]')
    .first()
    .scrollIntoView()
    .click({ force: true });

  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="entity-filter-clear-selection"]:visible').length > 0) {
      return;
    }

    cy.get('[data-testid="dashboard-advance-toggle"]')
      .first()
      .then(($toggle) => {
        if (!$toggle.prop('checked')) {
          cy.wrap($toggle).closest('label').click({ force: true });
        }
      });

    cy.get('input[data-testid="dashboard-general-input"][name="q"]')
      .first()
      .click({ force: true });
  });

  cy.get('[data-testid="entity-filter-clear-selection"]', {timeout: 10000})
    .should('be.visible');
}

function clearAdvancedFilters15() {
  openAdvancedFiltersPanel15();
  cy.get('[data-testid="entity-filter-clear-selection"]')
    .scrollIntoView()
    .click({ force: true });
}

function applyAdvancedFilters15(advancedFilter: AdvancedFilterData) {
  advancedFilter.filters.forEach((filter) => {
    openAdvancedFiltersPanel15();
    cy.get(`[data-testid="entity-filter-category-${filter.category_test_id}"]`)
      .scrollIntoView()
      .click({ force: true });

    filter.values.forEach((value) => {
      cy.get('[data-testid="entity-filter-value-input"]')
        .scrollIntoView()
        .clear({ force: true })
        .type(value, { force: true });
      cy.get('[data-testid="entity-filter-add-value"]')
        .click({ force: true });
      cy.get('app-search-filters')
        .contains(value)
        .should('be.visible');
    });
  });
}

function assertAdvancedFilterRequest15(entityFilter: Record<string, unknown>, advancedFilter: AdvancedFilterData) {
  advancedFilter.filters.forEach((filter) => {
    const submittedValues = Array.isArray(entityFilter[filter.request_key])
      ? entityFilter[filter.request_key] as string[]
      : [];
    filter.values.forEach((value) => {
      expect(
        submittedValues.map((submittedValue) => submittedValue.toLowerCase()),
        `entity_filter.${filter.request_key}`
      ).to.include(value.toLowerCase());
    });
  });
}

export function assertFirstResultCard(data: SearchResultData) {
  const findMatchingCard = ($cards: JQuery<HTMLElement>) => Array.from($cards).find((card) => {
    const text = (card.textContent || '').trim();
    const hrefs = Array.from(card.querySelectorAll('a[href]'))
      .map((link) => link.getAttribute('href') || '')
      .filter(Boolean);
    const matchesLink = hrefs.some((href) => href.includes(data.link_address.trim())) || text.includes(data.link_address.trim());
    const matchesTitle = data.title ? text.includes(data.title.trim()) : true;
    const matchesDescription = data.description ? text.includes(data.description.trim().substring(0, 60)) : true;
    const matchesDate = data.date ? text.includes(data.date) : true;

    return matchesLink && matchesTitle && matchesDescription && matchesDate;
  });

  cy.get('[data-testid="result-card"], .ui-result-card', {timeout: 35000})
    .should('have.length.at.least', 1)
    .should(($cards) => {
      expect(findMatchingCard($cards), `result card matching ${data.link_address}`).to.exist;
    })
    .then(($cards) => {
      const matchingCard = findMatchingCard($cards);
      expect(matchingCard, `result card matching ${data.link_address}`).to.exist;
      assertQueryEvidence15(matchingCard?.textContent || '', data.query_matches, data.search_query);
      cy.wrap(matchingCard as HTMLElement)
        .scrollIntoView()
        .should('be.visible')
        .as('matchingResultCard');
    });
}

export function assertFirstDefacementRow(data: DefacementSearchResultData) {
  const allowedBaseUrls = Array.isArray(data.base_url) ? data.base_url : [data.base_url];
  const allowedWebUrls = Array.isArray(data.web_url) ? data.web_url : [data.web_url];
  const hasAllowedBaseUrl = (text: string) => allowedBaseUrls.some((baseUrl) => text.includes(baseUrl.trim()));
  const hasAllowedWebUrl = (text: string) => allowedWebUrls.some((webUrl) => text.includes(webUrl.trim()));

  cy.wait(1500);
  cy.get('tbody tr.cursor-pointer, [data-testid="defacement-group-card"]', {timeout: 75000})
    .then(($items) => {
      const matchingItem = Array.from($items).find((item) => {
        const itemText = item.textContent || '';
        const isGroupCard = item.matches('[data-testid="defacement-group-card"]');
        return itemText.includes(data.team.trim()) && (hasAllowedBaseUrl(itemText) || isGroupCard);
      });

      expect(matchingItem, `defacement result for ${allowedBaseUrls.join(' or ')}`).to.exist;
      cy.wrap(matchingItem as HTMLElement).scrollIntoView().should('be.visible').as('firstDefacementResult');
    });

  cy.get('@firstDefacementResult')
    .then(($item) => {
      const text = ($item.text() || '').trim();
      expect(text).to.include(data.date.trim());
      expect(text).to.include(data.team.trim());

      if (hasAllowedBaseUrl(text)) {
        assertQueryEvidence15(text, data.query_matches, data.search_query);
        return;
      }

      expect($item.is('[data-testid="defacement-group-card"]'), 'defacement group card fallback').to.equal(true);
      cy.wrap($item).click();
      cy.get('[data-testid="defacement-record-sidebar"]', {timeout: 10000})
        .should('be.visible')
        .invoke('text')
        .should((sidebarText) => {
          assertQueryEvidence15(sidebarText, data.query_matches, data.search_query);
          expect(
            hasAllowedBaseUrl(sidebarText),
            `expected sidebar base url to include one of: ${allowedBaseUrls.join(', ')}`
          ).to.equal(true);
          expect(
            hasAllowedWebUrl(sidebarText),
            `expected sidebar web url to include one of: ${allowedWebUrls.join(', ')}`
          ).to.equal(true);
        });
    });

  cy.get('@firstDefacementResult')
    .then(($item) => {
      if ($item.is('tr')) {
        cy.wrap($item)
          .find('td[data-label="Web URL"] a[href]')
          .invoke('attr', 'href')
          .then((href) => {
            expect(
              allowedWebUrls.includes(href || ''),
              `expected web url to be one of: ${allowedWebUrls.join(', ')}`
            ).to.equal(true);
          });
      }
    });
}
