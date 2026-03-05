describe('General Intelligence – Open Report & Chatbot', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logoutIfLoggedIn();
  });

  it('Open first report and send message in chatbot', () => {
    cy.visit('/dashboard');

    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .click();

    cy.get('div[apptooltip="Open Report"]')
      .first()
      .click();

    cy.get('div.fixed.bottom-6.right-6 button')
      .click();

    cy.get('form input[name="message"]')
      .type('hey');

    cy.get('button.ui-chat-send-btn')
      .click();

    cy.get('div.flex-1.space-y-3')
      .within(() => {
        cy.get('div')
          .should('exist');
      });
    cy.logout();
  });
});
