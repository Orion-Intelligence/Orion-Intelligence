import { openFeederAsAdmin, openFeederRule } from './controllers/16-feeder-management.controller';

describe('Orion Intelligence - Feeder View & List Coverage (real backend)', () => {
  after(() => {
    cy.logout();
  });

  it('reads feeder scripts/values across rule types and expands previews', () => {
    cy.intercept('GET', '**/api/profile/feeder/scripts**').as('feederScripts');

    openFeederAsAdmin();

    const rules = ['news', 'exploit', 'generic', 'leak'];
    rules.forEach((rule) => {
      openFeederRule(rule);

      ['feeder-tab-script', 'feeder-tab-values'].forEach((tab) => {
        cy.get('body').then(($body) => {
          const tabEl = $body.find(`[data-testid="${tab}"]:visible`).first();
          if (!tabEl.length) {
            return;
          }
          cy.wrap(tabEl).click({ force: true });
          cy.wait('@feederScripts', { timeout: 60000 });
          cy.get('[data-testid="feeder-reload-button"]', { timeout: 60000 }).should('be.visible');

          cy.get('body').then(($panel) => {
            const viewBtn = $panel.find(
              '[data-testid^="feeder-script-view-button-"]:visible, [data-testid^="feeder-value-view-button-"]:visible'
            ).first();
            if (viewBtn.length) {
              cy.wrap(viewBtn).scrollIntoView().click({ force: true });
            }
          });
        });
      });
    });

    cy.get('body').then(($body) => {
      const search = $body.find('[data-testid="feeder-search-input"]:visible').first();
      if (search.length) {
        cy.wrap(search).clear().type('http');
      }
    });
    cy.get('[data-testid="feeder-reload-button"]').filter(':visible').first().should('be.visible').click({ force: true });
    cy.wait('@feederScripts', { timeout: 60000 });
    cy.docsScreenshot('feeder-view-list');
  });

  it('opens the script owner dialog and reads the feeder user list', () => {
    cy.intercept('GET', '**/api/profile/feeder/users**').as('feederUsers');

    openFeederAsAdmin();
    openFeederRule('news');

    cy.get('body').then(($body) => {
      const scriptTab = $body.find('[data-testid="feeder-tab-script"]:visible').first();
      if (!scriptTab.length) {
        return;
      }
      cy.wrap(scriptTab).click({ force: true });
      cy.get('[data-testid="feeder-reload-button"]', { timeout: 60000 }).should('be.visible');
      cy.get('body').then(($panel) => {
        const ownerBtn = $panel.find('[data-testid^="feeder-script-owner-button-"]:visible').first();
        if (!ownerBtn.length) {
          return;
        }
        cy.wrap(ownerBtn).scrollIntoView().click({ force: true });
        cy.get('[data-testid="feeder-owner-dialog"]', { timeout: 60000 }).should('be.visible');
        cy.wait('@feederUsers', { timeout: 60000 });
        cy.get('[data-testid="feeder-owner-cancel"]').should('be.visible').click({ force: true });
      });
    });
  });
});
