import {SearchResultData} from '../15-search-check.cy';

export const SEARCH_FIXTURES = {
  general_intelligence_data: {
    search_query: 'underground market - prepaid & cloned cards',
    link_address: 'http://2222fxq4xfkvilzdihu5ybce7ztf66fr6c7ub3enabg5iya2f34ac5id.onion/contact.php',
    date: 'Jan 24, 2026',
    description: 'copyright 2026 - underground marketwe',
  },
  data_breach: {
    search_query: 'Risiko 2023: Uforutsigbare tider krever høyere',
    link_address: 'https://nsm.no/aktuelt/risiko-2023-uforutsigbare-tider-krever-hoyere-beredskap',
    date: 'Jan 24, 2026',
    description: 'Norske virksomheter må forberede seg bedre og ha høyere beredskap',
  },
  defacement_by_team: {
    search_query: 'CarlyGriggs13',
    base_url: ['eng-victory-hub.com', 'joindarkside.pro', 'fitcoin-events.com'],
    team: 'CarlyGriggs13',
    date: 'Jan 24, 2026',
    web_url: [
      'https://x.com/CarlyGriggs13/status/2014897534108319933',
      'https://x.com/CarlyGriggs13/status/2014897336539844898',
      'https://x.com/CarlyGriggs13/status/2015050781804875946',
    ],
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

export function openSidebarGroup15(title: string) {
  const testId = SIDEBAR_GROUP_TESTID[title];
  expect(testId, `sidebar testid mapping for "${title}"`).to.exist;

  cy.get(`[data-testid="${testId}"]`)
    .scrollIntoView()
    .should('be.visible')
    .click();

  cy.get(`[data-testid="${testId}"]`)
    .parent()
    .find('> ul')
    .should(($ul) => {
      expect(
        getComputedStyle($ul[0] as HTMLElement).pointerEvents
      ).not.to.equal('none');
    });
}

export function clickSidebarSubItem15(groupTitle: string, itemTitle: string) {
  const prefix = SIDEBAR_SUBITEM_PREFIX[groupTitle];
  const testId = SIDEBAR_GROUP_TESTID[groupTitle];
  expect(prefix, `subitem prefix mapping for "${groupTitle}"`).to.exist;

  cy.get(`[data-testid="${testId}"]`)
    .parent()
    .find('> ul')
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
    })
    .type(`${value}{enter}`);
}

export function assertFirstResultCard(data: SearchResultData) {
  cy.wait(1000)
  cy.get('[data-testid="result-card"], .ui-result-card', {timeout: 35000})
    .should('have.length.at.least', 1)
    .then(($cards) => {
      const matchingCard = Array.from($cards).find((card) => {
        const text = (card.textContent || '').trim();
        const hrefs = Array.from(card.querySelectorAll('a[href]'))
          .map((link) => link.getAttribute('href') || '')
          .filter(Boolean);
        const matchesLink = hrefs.some((href) => href.includes(data.link_address.trim())) || text.includes(data.link_address.trim());
        const matchesDescription = data.description ? text.includes(data.description.trim().substring(0, 60)) : true;
        const matchesDate = data.date ? text.includes(data.date) : true;

        return matchesLink && matchesDescription && matchesDate;
      });
      expect(matchingCard, `result card matching ${data.link_address}`).to.exist;
      cy.wrap(matchingCard as HTMLElement)
        .scrollIntoView()
        .should('be.visible')
        .as('matchingResultCard');
    });
}

export function assertFirstDefacementRow(data: {search_query: string; base_url: string | string[]; team: string; date: string; web_url: string | string[]}) {
  const allowedBaseUrls = Array.isArray(data.base_url) ? data.base_url : [data.base_url];
  const allowedWebUrls = Array.isArray(data.web_url) ? data.web_url : [data.web_url];

  cy.get('tbody tr.cursor-pointer', {timeout: 35000})
    .then(($rows) => {
      const matchingRow = Array.from($rows).find((row) => {
        const cells = row.querySelectorAll('td');
        const rowText = Array.from(cells).map((cell) => cell.textContent?.trim() || '').join(' ');
        return allowedBaseUrls.some((baseUrl) => rowText.includes(baseUrl.trim())) || rowText.includes(data.team.trim());
      });

      expect(matchingRow, `defacement row for ${allowedBaseUrls.join(' or ')}`).to.exist;
      cy.wrap(matchingRow as HTMLTableRowElement).scrollIntoView().should('be.visible').as('firstRow');
    });

  cy.get('@firstRow')
    .find('td[data-label="Base URL"]')
    .invoke('text')
    .then((text) => {
      expect(
        allowedBaseUrls.some((baseUrl) => text.trim().includes(baseUrl.trim())),
        `expected base url to include one of: ${allowedBaseUrls.join(', ')}`
      ).to.equal(true);
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
    .invoke('attr', 'href')
    .then((href) => {
      expect(
        allowedWebUrls.includes(href || ''),
        `expected web url to be one of: ${allowedWebUrls.join(', ')}`
      ).to.equal(true);
    });
}
