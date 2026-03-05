describe('Chatbot - General Intelligence Report Flow', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens first report and sends a chatbot message', () => {
    cy.get('[data-testid="sidebar-group-strategic"]', {timeout: 30000}).first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="open-report"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="chat-widget-open"]', {timeout: 30000}).filter(':visible').first().scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="chat-widget-input"]', {timeout: 30000}).filter(':visible').first().should('be.enabled').type('hey');
    cy.get('[data-testid="chat-widget-send"]', {timeout: 30000}).filter(':visible').first().should('be.enabled').click();
    cy.get('[data-testid="chat-widget-messages"]', {timeout: 30000}).filter(':visible').first().find('div').should('exist');
  });
});
