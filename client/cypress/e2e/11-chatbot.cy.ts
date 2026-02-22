describe('General Intelligence – Open Report & Chatbot', () => {
  before(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Open first report and send message in chatbot', () => {
    cy.visit('/dashboard');


    cy.contains('app-dashboard-sidebar-items div', 'General Intelligence')
      .click({ force: true });


    cy.get('div[apptooltip="Open Report"]')
      .first()
      .click({ force: true });


    cy.get('div.fixed.bottom-6.right-6 button')
      .click({ force: true });

    cy.get('form input[name="message"]')
      .type('hey', { force: true });


    cy.get('button.ui-chat-send-btn')
      .click({ force: true });


    cy.get('div.flex-1.space-y-3')
      .within(() => {
        cy.get('div')
          .should('exist');
      });
    cy.logout();
  });
});
