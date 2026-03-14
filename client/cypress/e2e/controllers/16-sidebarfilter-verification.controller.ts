export {applyEntityFilter, selectDateRangeAndReopen, selectDateRangeResetAndReopen} from './12-filter-management.controller';

export function waitForSidebar() {
  cy.get('.ui-filter-sidebar-panel.right-0', {timeout: 20000})
    .should('be.visible')
    .should('have.css', 'right', '0px');
}

export function openSidebar() {
  cy.get('body').then(($body) => {
    const isOpen =
      $body.find('.ui-filter-sidebar-panel.right-0').length > 0 &&
      $body.find('.ui-filter-sidebar-panel.right-0').is(':visible');

    if (!isOpen) {
      cy.get('[data-testid="side-filter-open"]', {timeout: 60000})
        .click();
    }
  });

  waitForSidebar();
}

export function selectAndApply(selectTestId: string, option: string) {
  waitForSidebar();

  cy.get('.ui-filter-sidebar-panel.right-0')
    .scrollTo('top', {ensureScrollable: false});

  cy.get(`[data-testid="${selectTestId}"]`, {timeout: 60000})
    .scrollIntoView({offset: {top: -120, left: 0}})
    .should('be.visible')
    .should('not.be.disabled')
    .select(option);

  cy.get('.ui-filter-sidebar-panel.right-0')
    .scrollTo('bottom', {ensureScrollable: false});

  cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
    .scrollIntoView({offset: {top: -140, left: 0}})
    .should('be.visible')
    .should('not.be.disabled')
    .click({force: true});
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
  cy.get('[data-testid="result-card"]', {timeout: 60000}).should('have.length.at.least', 1).then(($cards) => {
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
  cy.get('[data-testid="open-report"]', {timeout: 60000}).should('have.length.at.least', 1);

  const tryAt = (index: number): void => {
    cy.get('[data-testid="open-report"]', {timeout: 60000}).then(($reports) => {
      if (index >= $reports.length) {
        throw new Error(`No report matched network ${option}`);
      }

      cy.wrap($reports.eq(index))
        .scrollIntoView()
        .should('be.visible')
        .click();

      cy.contains('p', 'Network', {timeout: 30000})
        .should('be.visible')
        .parent()
        .find('span', {timeout: 30000})
        .should('be.visible')
        .invoke('text')
        .then((text: string) => {
          const normalizedText = text.trim().toLowerCase();
          const normalizedOption = option.trim().toLowerCase();
          const matches = normalizedOption === 'all' ? normalizedText !== '' : normalizedText === normalizedOption;

          if (matches) {
            assertNetworkValue(text, option);
            return;
          }

          cy.go('back');
          cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000}).should('be.visible');
          tryAt(index + 1);
        });
    });
  };

  tryAt(0);
}
