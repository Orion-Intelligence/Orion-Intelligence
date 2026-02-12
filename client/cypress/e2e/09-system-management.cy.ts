describe('Admin Flow – System Settings → Update Company Name → Logout', () => {

  const openSystemSettings = () => {
    cy.contains('div.sidebar__subitem-content', 'System Settings')
      .should('be.visible')
      .click({ force: true });

    cy.url().should('include', 'system-settings');
  };

  it('Logs in as admin, updates company name, saves and logs out', () => {


    cy.loginAsAdmin();

    
    openSystemSettings();


    cy.contains('button', 'Edit')
      .should('be.visible')
      .click({ force: true });


    cy.get('input.user-settings_info-value')
      .should('be.visible')
      .clear()
      .type('Dark Intelligence');

    cy.contains('button', 'Save')
      .should('be.visible')
      .click({ force: true });

    cy.logout();
  });

});
