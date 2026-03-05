describe('Help & Support', () => {
  const testData = Cypress.env('TEST_DATA') || {};

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens support popup, fills form, and sends message', () => {
    cy.intercept('POST', '**/support', {
      statusCode: 200,
      body: {success: true}
    }).as('sendSupport');
    cy.visit('/dashboard');
    cy.scrollTo('top', {ensureScrollable: false});
    cy.get('[data-cy="profile-menu"], app-profile img[alt="Logout"]', {timeout: 15000}).filter(':visible').first().should('be.visible').click({scrollBehavior: false});
    cy.get('app-profile ul:visible', {timeout: 10000}).should('be.visible').as('profileDropdown');
    cy.get('@profileDropdown').contains('li', 'Help & Support', {timeout: 10000}).should('be.visible').click({scrollBehavior: false});
    cy.get('app-support .ui-graph-popup-overlay', {timeout: 10000}).should('be.visible').and('not.have.class', 'opacity-0');

    cy.get('app-support .ui-popup-shell', {timeout: 10000}).should('be.visible').within(() => {
        cy.contains('h2', 'Contact Support', {timeout: 10000}).should('be.visible');
        cy.get('input[name="email"]').should('be.visible').clear().type(testData.support_email);
        cy.get('input[placeholder="Write your subject"]').should('be.visible').clear().type('Support request from Cypress');
        cy.get('textarea[placeholder="Write your message..."]').should('be.visible').clear().type('Please review this test support message submission flow.');
        cy.get('button.ui-popup-btn-primary').should('be.visible').and('not.be.disabled').click();
      });
    cy.wait('@sendSupport');
  });
});
