describe('Chatbot - General Intelligence Report Flow', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens first report and sends a chatbot message', () => {
    cy.get('[data-testid="sidebar-group-strategic"]').first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="open-report"]').filter(':visible').first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="chat-widget-open"]').filter(':visible').first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="chat-widget-input"]').filter(':visible').first().should('be.enabled').type('hey');
    cy.get('[data-testid="chat-widget-send"]').filter(':visible').first().should('be.enabled').click();
    cy.get('[data-testid="chat-widget-messages"]').filter(':visible').first().find('div').should('exist');
  });
});
