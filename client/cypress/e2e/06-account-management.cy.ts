describe('Orion Intelligence – Account Settings Basic Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsTest1();
    });
  });

  it('Change image, toggle theme, enable 2FA, logout', () => {
    cy.visit('/dashboard');

    cy.contains(/profile|account|settings/i)
      .scrollIntoView()
      .click({force: true});

    cy.get('app-sidebar-profile-settings').should('exist');

    cy.contains('.user-settings_section', 'User Profile')
      .within(() => {
        cy.get('input[type="file"]')
          .selectFile('cypress/fixtures/avatar.png', {force: true});
      });

    cy.contains('.user-settings_section', 'Theme')
      .within(() => {
        cy.get('input[type="checkbox"]').click({force: true});
        cy.get('input[type="checkbox"]').click({force: true});
      });

    cy.contains('.user-settings_section', '2 Factor Authentication')
      .within(() => {
        cy.get('input[type="checkbox"]').click({force: true});
      });

    cy.logout();

    cy.visit('/login');
    cy.get('input[name="username"]').should('exist').type('testing4');
    cy.get('input[name="password"]').should('exist').type('1qaz!QAZ', {log: false});
    cy.get('input.login-button').should('exist').click();

    cy.get('.twofa-center').should('be.visible');
    cy.get('img[alt="2FA QR"]').should('exist');
    cy.get('input[name="otpCode"]').should('exist');
    cy.contains('button', 'Verify OTP').should('be.disabled');

    cy.visit('/');

    cy.contains('span.reset-password', 'Reset password?')
      .should('be.visible')
      .click({force: true});

    cy.contains('.signup-container__title', 'Reset Password').should('exist');

    cy.get('input[name="companymail"]')
      .should('exist')
      .type('d@hotmail.com');

    cy.get('input[type="submit"][value="Get reset link"]')
      .should('not.be.disabled')
      .click();

    cy.openLastMailAndGetUrl().then(url => {
      cy.visit(url);
    });

    cy.openLastMailAndGetUrl().then(() => {
      cy.url().should('include', '/reset');

      cy.get('.signup-container__title', {timeout: 20000})
        .should('be.visible')
        .and('contain', 'Reset Password');

      cy.get('input[name="password"]').clear().type('1qaz!QAZ', {log: false}).blur();
      cy.get('input[name="confirmPassword"]').clear().type('1qaz!QAZ', {log: false}).blur();

      cy.get('input[type="submit"]').should('not.be.disabled').click();

      cy.contains(
        'div.w-100.d-block.mt-2.px-3.py-2.rounded-lg.bg-danger.bg-opacity-75.text-white.shadow-sm',
        'New password must be different from the old one.',
        {timeout: 20000}
      ).should('be.visible');

      cy.get('input[name="password"]').clear().type('Doorsoffreedom@00', {log: false}).blur();
      cy.get('input[name="confirmPassword"]').clear().type('Doorsoffreedom@00', {log: false}).blur();

      cy.get('input[type="submit"]').should('not.be.disabled').click();

      cy.url({timeout: 20000}).should('include', '/login');

      cy.get('input[name="username"]').clear().type('testing4');
      cy.get('input[name="password"]').clear().type('WRONG_PASSWORD', {log: false});
      cy.get('input.login-button').should('be.enabled').click();

      cy.contains(
        'div.d-inline-block.mt-2.px-3.py-2.rounded-lg.bg-danger.bg-opacity-75.text-white.shadow-sm.text-center',
        'Invalid user or password',
        {timeout: 20000}
      ).should('be.visible');

      cy.get('input[name="password"]').clear().type('Doorsoffreedom@00', {log: false});
      cy.get('input.login-button').should('be.enabled').click();

      cy.get('.twofa-center').should('be.visible');
    });

  });
});
