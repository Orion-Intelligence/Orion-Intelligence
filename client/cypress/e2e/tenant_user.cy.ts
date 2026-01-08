describe('Tenant Signup → Admin Verify → Activate + Enterprise License', () => {

  const signupUser = {
    username: 'test_for_tenants',
    email: 'testing1@orionintelligence.org',
    password: '1qaz!QAZ'
  };

  const openTenantsPage = () => {
    cy.contains('div.sidebar__subitem-content', 'Tenant')
      .should('be.visible')
      .click({ force: true });

    cy.url().should('include', '/dashboard/profile/tenant');
  };

  it('Signs up a new tenant user and submits request', () => {
    cy.visit('http://localhost:4200/login');

    cy.contains('span.signup-link', 'Sign Up')
      .should('be.visible')
      .click({ force: true });

    cy.get('form.login-form').should('exist').and('be.visible');

    cy.get('input[name="username"]')
      .clear()
      .type(signupUser.username);

    cy.get('input[name="companymail"]')
      .clear()
      .type(signupUser.email);

    cy.get('input[name="password"]')
      .clear()
      .type(signupUser.password);

    cy.contains('input[type="submit"]', 'Sign Up')
      .should('be.visible')
      .click({ force: true });

    cy.get('.welcome-page__card')
      .should('be.visible');

    cy.contains('button', 'Go to login')
      .should('be.visible')
      .click({ force: true });

    cy.logout(); // your existing custom command
  });

  it('Logs in as admin and verifies + activates tenant with Enterprise license', () => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });

    cy.visit('/dashboard/profile/homepage');
    openTenantsPage();

    cy.get('tr').contains('Not Verified')
      .closest('tr')
      .within(() => {
        cy.get('button#edit-tenant')
          .should('exist')
          .click({ force: true });
      });

    // Toggle "Not Verified"
    cy.contains('button.pill-toggle', 'Not Verified')
      .should('exist')
      .click({ force: true });

    // Change Status → Active
    cy.get('button.dropdown-toggle')
      .contains('Disable')
      .click({ force: true });

    cy.get('a.dropdown-item')
      .contains('Active')
      .click({ force: true });

    // Enable Enterprise license
    cy.contains('.license-card .license-label', 'Enterprise')
      .parent()
      .find('input.license-checkbox')
      .click({ force: true });

    // Save changes
    cy.contains('button', 'Save changes')
      .should('be.visible')
      .click({ force: true });

    cy.contains('Active').should('exist');
  });

});
