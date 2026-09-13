describe('Orion Intelligence - Social CTI Coverage (real backend)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('loads the social intel landing and triggers the backend profile + graph reads', () => {
    cy.intercept('GET', '**/api/social/data*').as('socialData');
    cy.intercept('GET', '**/api/graph/session/tabs*').as('graphTabs');
    cy.intercept('POST', '**/api/social/graph/data').as('graphData');

    cy.visit('/dashboard/social-intel');
    cy.get('[data-testid="social-graph-root"]', { timeout: 120000 }).should('be.visible');
    cy.wait('@socialData', { timeout: 120000 });
    cy.get('[data-testid="social-list-view"], [data-testid="social-list-empty"]', { timeout: 120000 }).should('exist');
    cy.docsScreenshot('social-intel-listing');

    cy.get('body').then(($body) => {
      const search = $body.find('[data-testid="social-platform-search"]:visible').first();
      if (search.length) {
        cy.wrap(search).clear().type('twitter');
      }
    });

    cy.get('body').then(($body) => {
      const graphToggle = $body.find('[data-testid="social-result-source-graph"]:visible').first();
      if (graphToggle.length) {
        cy.wrap(graphToggle).click({ force: true });
        cy.get('[data-testid="social-user-graph-root"]', { timeout: 120000 }).should('exist');
        cy.get('body').then(($graph) => {
          const find = $graph.find('[data-testid="social-user-graph-find-input"]:visible').first();
          if (find.length) {
            cy.wrap(find).type('user');
          }
        });
        cy.docsScreenshot('social-intel-graph');
      }
    });
  });

  it('deep-links a social profile overview and renders its tabs', () => {
    cy.intercept('GET', '**/api/social/data*').as('socialData');

    cy.visit('/dashboard/social-intel?profile=superman0011&platform=Twitter');
    cy.get('[data-testid="social-graph-root"]', { timeout: 120000 }).should('be.visible');
    cy.wait('@socialData', { timeout: 120000 });

    cy.get('body').then(($body) => {
      const tabs = $body.find('app-social-profile-tabs-section:visible').first();
      if (tabs.length) {
        cy.wrap(tabs).should('be.visible');
        cy.get('[data-testid="social-header-back"]').should('be.visible').click({ force: true });
      }
    });
    cy.get('[data-testid="social-list-view"], [data-testid="social-list-empty"]', { timeout: 120000 }).should('exist');
  });
});
