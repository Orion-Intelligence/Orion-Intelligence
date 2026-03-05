const ENTITY_FILTERS: [string, string][] = [
  ['Phone Numbers', '+923001234567'],
  ['Emails', 'test@example.com'],
  ['Domains', 'example.com'],
  ['Country', 'Pakistan'],
  ['URLs', 'https://example.com'],
  ['CVE & CWE', 'CVE-2024-1111'],
  ['IP Addresses', '8.8.8.8'],
  ['YARA Rules', 'rule malicious_test'],
  ['Encoded URLs', 'aHR0cHM6Ly9leGFtcGxlLmNvbQ=='],
  ['File Paths', '/var/log/syslog'],
  ['Credit Cards', '4111111111111111'],
];

const SORT_OPTIONS = ['Newest first', 'Oldest first'];
const SEARCH_BY_OPTIONS = [
  'Match Semantic',
  'Match any term (OR)',
  'Match indivisual terms (AND)',
  'Match full query (AND)',
];
const SAFE_SEARCH_OPTIONS = ['Yes', 'No'];
const NETWORK_OPTIONS = ['All', 'Onion'];
const CONTENT_TYPES = ['All', 'Breach', 'Credential', 'Ransomware'];

describe('General Intelligence – Full Filters + Tools + Auto-Apply Flow', () => {

  it('Apply ALL filters, auto-apply network, safe search, date, content type', () => {
    function applyEntityFilter(name: string, value: string) {
      cy.contains('app-search-filters div', name, {timeout: 20000})
        .should('exist')
        .scrollIntoView()
        .click();

      cy.get('app-search-filters input[placeholder="Enter entity"]', {timeout: 20000})
        .scrollIntoView()
        .clear()
        .type(value);

      cy.get('app-search-filters input[placeholder="Enter entity"] + span', {timeout: 20000})
        .should('be.visible')
        .scrollIntoView().click();
    }

    cy.logoutIfLoggedIn();
    cy.loginAsAdmin();
    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence', {timeout: 30000})

      .should('be.visible')
      .scrollIntoView().click();

    cy.get('[data-cy="dashboard-general-input"]', {timeout: 30000})
      .should('be.visible')
      .scrollIntoView().click();

    cy.contains('span', 'Advance', {timeout: 30000})
      .parent()
      .find('input[type="checkbox"]')
      .should('exist')
      .scrollIntoView().check();

    cy.get('app-search-filters', {timeout: 20000}).should('be.visible');

    ENTITY_FILTERS.forEach(([name, value]) => applyEntityFilter(name, value));

    cy.contains('app-search-filters button', 'Clear Selection', {timeout: 20000})
      .scrollIntoView()
      .click();

    cy.get('body').click(0, 0);

    cy.contains('button', 'Tools', {timeout: 20000})
      .scrollIntoView()
      .click();
    cy.contains('button', 'sort by', {timeout: 20000}).scrollIntoView().should('exist');

    SORT_OPTIONS.forEach((option) => {
      cy.contains('button', 'sort by', {timeout: 20000})
        .scrollIntoView()
        .click();

      cy.get('.ui-result-dropdown-panel', {timeout: 20000}).should('exist');
      cy.contains('.ui-result-dropdown-panel button', option, {timeout: 20000})
        .scrollIntoView()
        .click();

      cy.get('[data-cy="dashboard-general-input"]', {timeout: 20000}).type('{enter}');
    });

    SEARCH_BY_OPTIONS.forEach((option) => {
      cy.contains('button', 'search by', {timeout: 20000})
        .scrollIntoView()
        .click();

      cy.get('.ui-result-dropdown-panel', {timeout: 20000}).should('exist');
      cy.contains('.ui-result-dropdown-panel button', option, {timeout: 20000})
        .scrollIntoView()
        .click();

      cy.get('[data-cy="dashboard-general-input"]', {timeout: 20000})
        .should('be.visible')
        .clear()
        .type('test query{enter}');
    });

    cy.openSideFilter();

    SAFE_SEARCH_OPTIONS.forEach((option) => {
      cy.contains('app-filters label', 'Safe Search', {timeout: 30000})
        .parent()
        .find('select')
        .scrollIntoView().select(option);

      cy.contains('button', 'Apply', {matchCase: false}).scrollIntoView().click();
      cy.openSideFilter();
    });

    cy.contains('app-filters button', 'Select date range', {timeout: 30000})
      .should('be.visible')
      .scrollIntoView().click();

    cy.contains('button', '1', {timeout: 20000}).scrollIntoView().click();
    cy.contains('button', '25', {timeout: 20000}).scrollIntoView().click();

    cy.contains('button', 'Apply', {matchCase: false}).scrollIntoView().click();

    cy.openSideFilter();

    CONTENT_TYPES.forEach((option) => {
      cy.contains('app-filters label', 'Content Type', {timeout: 30000})
        .parent()
        .find('select')
        .scrollIntoView().select(option);

      cy.contains('button', 'Apply', {matchCase: false}).scrollIntoView().click();
      cy.openSideFilter();
    });

    cy.closeSideFilter();

    cy.get('form button[type="submit"]', {timeout: 20000})
      .first()
      .should('be.visible')
      .scrollIntoView().click();
    cy.logoutIfLoggedIn();
  });

  describe('Data Breach – Full Filters + Auto-Apply Flow', () => {

    it('Apply ALL filters, network, safe search, date, content type in Data Breach tab', () => {
      function selectDateRange() {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      }

      cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Data Breach')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]').should('be.visible');

      cy.contains('span', 'Advance')
        .parent()
        .find('input[type="checkbox"]')
        .should('exist')
        .scrollIntoView().check();

      cy.openSideFilter();

      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });

      SAFE_SEARCH_OPTIONS.forEach(option => {
        cy.contains('app-filters label', 'Safe Search')
          .parent()
          .find('select')
          .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });

      selectDateRange();

      cy.contains('button', 'Reset').scrollIntoView().click();

      CONTENT_TYPES.forEach(option => {
        cy.contains('app-filters label', 'Content Type')
          .parent()
          .find('select')
          .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();
        cy.openSideFilter();
      });

      cy.closeSideFilter();

      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logoutIfLoggedIn();

    });

  });

  describe('Defacement – Full Filters Flow', () => {

    it('Apply all filters in Defacement with auto-apply', () => {
      function selectDateRange() {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.contains('button', 'Reset').scrollIntoView().click();

        cy.openSideFilter();
      }

      cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Defacement')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]')
        .should('be.visible');

      cy.openSideFilter();

      selectDateRange();

      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.openSideFilter();
      });

      cy.closeSideFilter();

      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logoutIfLoggedIn();

    });

  });

  describe('Social – Full Filters Flow', () => {

    it('Apply all filters in Social with auto-apply', () => {
      function selectDateRange() {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.contains('button', 'Reset').scrollIntoView().click();

        cy.openSideFilter();
      }

      cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Social')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]')
        .should('be.visible');

      cy.openSideFilter();

      selectDateRange();

      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.openSideFilter();
      });

      CONTENT_TYPES.forEach(option => {
        cy.contains('app-filters label', 'Content Type')
          .parent()
          .find('select')
          .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.openSideFilter();
      });

      cy.closeSideFilter();

      cy.get('form button[type="submit"]').first().scrollIntoView().click();
      cy.logoutIfLoggedIn();

    });

  });

  describe('Exploit – Full Filters Flow', () => {

    it('Apply all filters in Exploit with auto-apply', () => {
      function selectDateRange() {
        cy.contains('button', 'Select date range').scrollIntoView().click();

        cy.contains('button', '1').scrollIntoView().click();

        cy.contains('button', '25').scrollIntoView().click();

        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.contains('button', 'Reset').scrollIntoView().click();

        cy.openSideFilter();
      }

      cy.logoutIfLoggedIn();
      cy.loginAsAdmin();

      cy.visit('/dashboard');

      cy.contains('app-dashboard-sidebar-items div', 'Exploit')

        .scrollIntoView().click();

      cy.get('[data-cy="dashboard-general-input"]')
        .should('be.visible');

      cy.openSideFilter();

      selectDateRange();

      CONTENT_TYPES.forEach(option => {
        cy.contains('app-filters label', 'Content Type')
          .parent()
          .find('select')
          .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.openSideFilter();
      });

      NETWORK_OPTIONS.forEach(option => {
      cy.contains('app-filters label', 'Network Type')
        .parent()
        .find('select')
        .scrollIntoView().select(option);
        cy.contains('button', 'Apply').scrollIntoView().click();

        cy.openSideFilter();
      });

      cy.closeSideFilter();

      cy.get('form button[type="submit"]').first().scrollIntoView().click();
    });

  });
});
