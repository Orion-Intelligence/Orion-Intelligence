describe('Admin Flow – System Settings → Update Company Name → Logout', () => {

  const openSystemSettings = () => {
    cy.contains('app-dashboard-sidebar-items div', 'System Settings')
      .should('be.visible')
      .click();

    cy.url().should('include', 'system-settings');
  };

  it('Logs in as admin, updates company name, saves and logs out', () => {


    cy.loginAsAdmin();

    
    openSystemSettings();


    cy.get('button[aria-label="Edit settings"]')
      .should('be.visible')
      .click();


    cy.contains('label', 'App Name')
      .parent()
      .find('input')
      .should('be.visible')
      .clear()
      .type('Dark Intelligence');

    cy.get('button[aria-label="Save settings"]')
      .should('be.visible')
      .click();

    cy.logout();
  });

});


after(() => {
  cy.logoutIfLoggedIn();
});
