export {
  applyEntityFilter, selectDateRangeAndReopen, selectDateRangeResetAndReopen
} from './12-filter-management.controller';

export function waitForSidebar() {
  cy.get('[data-testid="side-filter-apply"]')
    .filter(':visible')
    .first()
    .should('be.visible');
}

export function openSidebar() {
  cy.scrollDashboardToTop()
  cy.openSideFilter();
  waitForSidebar();
}

export function selectAndApply(selectTestId: string, option: string) {
  cy.get(`[data-testid="${selectTestId}"]`)
    .select(option);

  cy.get('[data-testid="side-filter-apply"]')
    .click();
  cy.scrollDashboardToTop()
}

function assertNetworkValue(text: string, option: string) {
  const normalizedText = text.trim().toLowerCase();
  const normalizedOption = option.trim().toLowerCase();

  if (normalizedOption === 'all') {
    expect(normalizedText).to.not.equal('');
  } else {
    expect(normalizedText).to.equal(normalizedOption);
  }
}

export function assertAnyResultCardMatchesNetwork(option: string) {
  cy.get('[data-testid="result-card"]').should('have.length.at.least', 1).then(($cards) => {
    const matchingCard = [...$cards].find((card) => {
      const networkLabel = [...card.querySelectorAll('span')].find((span) => (span.textContent || '').trim() === 'Network:');
      const networkValue = networkLabel?.parentElement?.querySelector('span.font-medium')?.textContent || '';
      const normalizedValue = networkValue.trim().toLowerCase();
      const normalizedOption = option.trim().toLowerCase();

      return normalizedOption === 'all' ? normalizedValue !== '' : normalizedValue === normalizedOption;
    });

    expect(matchingCard, `result card matching network ${option}`).to.exist;
    cy.wrap(matchingCard as HTMLElement).scrollIntoView().should('be.visible');
  });
}

export function openAnyMatchingReport(option: string) {
  cy.get('[data-testid="open-report"]').should('have.length.at.least', 1);

  const tryAt = (index: number): void => {
    cy.get('[data-testid="open-report"]').then(($reports) => {
      if (index >= $reports.length) {
        throw new Error(`No report matched network ${option}`);
      }

      cy.wrap($reports.eq(index))
        .scrollIntoView()
        .should('be.visible')
        .click();

      cy.get('[data-testid="dashboard-header-back"]').click();
      cy.scrollDashboardToTop()
    });
  };

  tryAt(0);
}
