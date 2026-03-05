describe('Support - Help And Support Form Flow', () => {
  const testData = Cypress.env('TEST_DATA') || {};

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens help and support modal, fills form, and sends message', () => {
    cy.intercept('POST', '**/support', {
      statusCode: 200,
      body: {success: true}
    }).as('sendSupport');

    cy.get('[data-testid="profile-menu"]', {timeout: 15000}).filter(':visible').first().should('be.visible').click({scrollBehavior: false});
    cy.get('[data-testid="profile-help-support"]', {timeout: 10000}).filter(':visible').first().should('be.visible').click({scrollBehavior: false});
    cy.get('[data-testid="support-overlay"]', {timeout: 10000}).should('be.visible').and('not.have.class', 'opacity-0');
    cy.get('[data-testid="support-modal"]', {timeout: 10000}).should('be.visible');
    cy.get('[data-testid="support-modal-title"]', {timeout: 10000}).should('be.visible');
    cy.get('[data-testid="support-email-input"]').should('be.visible').clear().type(testData.support_email);
    cy.get('[data-testid="support-subject-input"]').should('be.visible').clear().type('Support request from Cypress');
    cy.get('[data-testid="support-message-input"]').should('be.visible').clear().type('Please review this test support message submission flow.');
    cy.get('[data-testid="support-send"]').should('be.visible').and('not.be.disabled').click();

    cy.wait('@sendSupport');
  });
});
