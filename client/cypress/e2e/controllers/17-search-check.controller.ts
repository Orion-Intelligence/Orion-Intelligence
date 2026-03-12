import {SearchResultData} from '../17-search-check.cy';

export const SEARCH_FIXTURES = {
  general_intelligence_data: {
    search_query: 'underground market - prepaid & cloned cards',
    link_address: 'http://2222fxq4xfkvilzdihu5ybce7ztf66fr6c7ub3enabg5iya2f34ac5id.onion/contact.php',
    date: 'Jan 25, 2026',
    description: 'copyright 2026 - underground marketwe',
  },
  data_breach: {
    search_query: 'Risiko 2023: Uforutsigbare tider krever høyere',
    link_address: 'https://nsm.no/aktuelt/risiko-2023-uforutsigbare-tider-krever-hoyere-beredskap',
    date: 'Jan 25, 2026',
    description: 'Norske virksomheter må forberede seg bedre og ha høyere beredskap',
  },
  defacement_by_team: {
    search_query: 'CarlyGriggs13',
    base_url: 'joindarkside.pro',
    team: 'CarlyGriggs13',
    date: 'Jan 24, 2026',
    web_url: 'https://x.com/CarlyGriggs13/status/2014897534108319933',
  },
  defacement_by_base_url: {
    search_query: 'joindarkside.pro',
    base_url: 'joindarkside.pro',
    team: 'CarlyGriggs13',
    date: 'Jan 24, 2026',
    web_url: 'https://x.com/CarlyGriggs13/status/2014897534108319933',
  },
  social: {
    search_query: 'Email Validator | High Accuracy',
    link_address: 'https://xreactor.org/threads/email-validator-high-accuracy-real-time-validation.30048/',
    date: 'Dec 19, 2024',
    description: null,
  },
  exploit: {
    search_query: 'CVE-2025-0422',
    link_address: 'https://raw.githubusercontent.com/trickest/cve/main/2025/CVE-2025-0422.md',
    date: 'Jan 1, 2025',
    description: '#### ReferenceNo PoCs from references.',
  },
  feed: {
    search_query: 'Armenia probes alleged sale of 8 million gov',
    link_address: 'https://therecord.media/armenia-probes-alleged-sale-government-records',
    date: 'Jan 12, 2026',
    description: 'Hackers are offering for sale what they claim is a large trove of Armenian government-related data',
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

export function openSidebarGroup17(title: string) {
  const testId = SIDEBAR_GROUP_TESTID[title];
  expect(testId, `sidebar testid mapping for "${title}"`).to.exist;

  cy.get(`[data-testid="${testId}"]`, {timeout: 30000})
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.get(`[data-testid="${testId}"]`, {timeout: 30000})
    .closest('li')
    .find('> ul', {timeout: 30000})
    .should(($ul) => {
      expect(
        getComputedStyle($ul[0] as HTMLElement).pointerEvents
      ).not.to.equal('none');
    });
}

export function clickSidebarSubItem17(groupTitle: string, itemTitle: string) {
  const prefix = SIDEBAR_SUBITEM_PREFIX[groupTitle];
  const testId = SIDEBAR_GROUP_TESTID[groupTitle];
  expect(prefix, `subitem prefix mapping for "${groupTitle}"`).to.exist;

  cy.get(`[data-testid="${testId}"]`, {timeout: 30000})
    .closest('li')
    .find('> ul', {timeout: 30000})
    .should(($ul) => {
      expect(
        getComputedStyle($ul[0] as HTMLElement).pointerEvents
      ).not.to.equal('none');
    })
    .find(`[data-testid^="sidebar-subitem-${prefix}-"]`)
    .contains('div', new RegExp(`^\\s*${itemTitle}\\s*$`))
    .scrollIntoView()
    .click();
}

export function waitForSearchReady17() {
  cy.get('app-loading-form', {timeout: 30000}).should('not.exist');

  cy.get('body').then(($body) => {
    if ($body.find('app-filters:visible, app-search-filters:visible').length) {
      cy.scrollTo('top', {ensureScrollable: false});
    }
  });
}

export function typeDashboardSearch17(value: string) {
  waitForSearchReady17();

  cy.get('input[data-cy="dashboard-general-input"][name="q"]', {timeout: 30000})
    .first()
    .scrollIntoView()
    .should('be.visible')
    .should('be.enabled')
    .then(($input) => {
      const currentValue = String($input.val() ?? '').trim();
      if (currentValue.length > 0) {
        cy.wrap($input).clear();
      }
    })
    .type(`${value}{enter}`);
}

export function assertFirstResultCard(data: SearchResultData) {
  cy.get('[data-testid="result-card"], .ui-result-card', {timeout: 35000})
    .first()
    .scrollIntoView()
    .should('be.visible');

  cy.get('[data-testid="result-card"], .ui-result-card', {timeout: 35000})
    .first()
    .invoke('html')
    .then((html) => {
      if (html.includes('href=')) {
        cy.get('[data-testid="result-card"], .ui-result-card')
          .first()
          .find('a[href]')
          .first()
          .should('have.attr', 'href', data.link_address);
      } else {
        cy.get('[data-testid="result-card"], .ui-result-card')
          .first()
          .invoke('text')
          .then((text) => {
            expect(text).to.include(data.link_address.trim());
          });
      }
    });

  if (data.description) {
    cy.get('[data-testid="result-card"], .ui-result-card', {timeout: 35000})
      .first()
      .invoke('text')
      .then((text) => {
        expect(text.trim()).to.include(data.description!.trim().substring(0, 60));
      });
  }

  if (data.date) {
    cy.get('[data-testid="result-card"], .ui-result-card', {timeout: 35000})
      .first()
      .invoke('text')
      .then((text) => {
        expect(text).to.include(data.date);
      });
  }
}

export function assertFirstDefacementRow(data: {search_query: string; base_url: string; team: string; date: string; web_url: string}) {
  cy.get('tbody tr.cursor-pointer', {timeout: 35000})
    .first()
    .scrollIntoView()
    .should('be.visible')
    .as('firstRow');

  cy.get('@firstRow')
    .find('td[data-label="Base URL"]')
    .invoke('text')
    .then((text) => {
      expect(text.trim()).to.include(data.base_url.trim());
    });

  cy.get('@firstRow')
    .find('td[data-label="Team"]')
    .invoke('text')
    .then((text) => {
      expect(text.trim()).to.equal(data.team.trim());
    });

  cy.get('@firstRow')
    .find('td[data-label="Leak Date"]')
    .invoke('text')
    .then((text) => {
      expect(text.trim()).to.include(data.date.trim());
    });

  cy.get('@firstRow')
    .find('td[data-label="Web URL"] a[href]')
    .should('have.attr', 'href', data.web_url);
}
