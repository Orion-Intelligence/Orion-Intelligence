export const DIRECTORY_NETWORK_OPTION = {label: 'Onion', value: 'onion'};
export const DIRECTORY_INDEX_OPTION = {label: 'Leak', value: 'leak'};
export const DIRECTORY_CONTENT_OPTION = {label: 'Forums', value: 'forums'};

export function waitForDirectoryRequest() {
  cy.wait('@getDirectory', {timeout: 30000}).then((interception) => {
    expect(interception.response?.statusCode).to.eq(200);
  });
}

export function assertDirectoryContentVisible() {
  cy.get('app-directory', {timeout: 30000}).should('be.visible');
  cy.get('body').then(($body) => {
    const hasTable = $body.find('app-directory-list table tbody tr').length > 0;
    const hasEmptyState = $body.text().includes('No links found!');

    expect(hasTable || hasEmptyState).to.eq(true);
  });
}

export function openDirectoryFilter() {
  cy.get('app-directory #top', {timeout: 20000}).should('exist').scrollIntoView({duration: 300, offset: {top: -20, left: 0}});
  cy.contains('button', 'Filter', {timeout: 20000}).should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="side-filter-close"]', {timeout: 20000}).filter(':visible').first().should('be.visible');
}

export function resetDirectoryFilters() {
  openDirectoryFilter();
  cy.get('[data-testid="side-filter-reset"]', {timeout: 20000}).scrollIntoView().click();
  waitForDirectoryRequest();
  cy.location('search').should('not.include', 'network=');
  cy.location('search').should('not.include', 'index=');
  cy.location('search').should('not.include', 'content_type=');
  cy.location('search').should('not.include', 'daterange=');
  assertDirectoryContentVisible();
}

export function applyDirectoryDropdown(testId: string, option: { label: string; value: string; }, queryKey: string) {
  openDirectoryFilter();
  cy.get(`[data-testid="side-filter-select-${testId}"]`, {timeout: 20000}).scrollIntoView().select(option.label);
  cy.get('[data-testid="side-filter-apply"]', {timeout: 20000}).scrollIntoView().click();
  waitForDirectoryRequest();
  cy.location('search').should('include', `${queryKey}=${option.value}`);
  assertDirectoryContentVisible();
}

export function applyDateRange(monthsBack: number) {
  openDirectoryFilter();
  cy.get('[data-testid="side-filter-date-toggle"]', {timeout: 20000}).scrollIntoView().click();

  for (let i = 0; i < monthsBack; i += 1) {
    cy.get('[data-testid="side-filter-date-prev-month"]', {timeout: 20000}).scrollIntoView().click();
  }

  cy.get('[data-testid="side-filter-date-day-1"]', {timeout: 20000}).filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-date-day-25"]', {timeout: 20000}).filter(':visible').first().scrollIntoView().click();
  cy.get('[data-testid="side-filter-apply"]', {timeout: 20000}).scrollIntoView().click();
  waitForDirectoryRequest();
  cy.location('search').should('include', 'daterange=');
}
