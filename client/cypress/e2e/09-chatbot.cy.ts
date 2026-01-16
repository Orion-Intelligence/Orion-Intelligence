describe('General Intelligence – Open Report & Chatbot', () => {
  before(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Open first report and send message in chatbot', () => {
    cy.visit('/dashboard');


    cy.contains('div.sidebar__item-dropdown', 'General Intelligence')
      .click({ force: true });


    cy.get('div.dashboard__search-button-inner')
      .first()
      .click({ force: true });


    cy.get('button.chat-support__toggle')
      .click({ force: true });

    cy.get('input.chat-support__input-field')
      .type('hey', { force: true });


    cy.get('button.chat-support__send-btn')
      .click({ force: true });


    cy.get('div.chat-support__messages')
      .within(() => {
        cy.get('.chat-support__msg--bot, .chat-support__error-box')
          .should('exist');
      });
  });
});
