describe('Orion Intelligence – Account Settings Basic Flow', () => {
  const testUsers = Cypress.env('TEST_USERS') || {};
  const defaultUserKey = Cypress.env('DEFAULT_TEST_USER_KEY');
  const defaultUser = testUsers[defaultUserKey] || {};
  const resetEmail = Cypress.env('RESET_PASSWORD_EMAIL') || defaultUser.email;
  const newPassword = Cypress.env('NEW_PASSWORD');

  if (!defaultUser?.username || !defaultUser?.password || !resetEmail || !newPassword) {
    throw new Error('Missing required account/password env values in cypress.config.ts');
  }

  const assertLoggedIn = () => {
    cy.location('pathname', { timeout: 20000 }).should('not.include', '/login');
  };

  const openAccountSettings = () => {
    cy.visit('/dashboard');
    assertLoggedIn();

    cy.contains(/profile|account|settings/i, { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('h1.ui-page-title', { timeout: 20000 }).should('be.visible');
  };

  beforeEach(() => {
    cy.session(
      'admin-session',
      () => {
        cy.loginAsTest1();
      },
      {
        validate() {
          cy.visit('/dashboard', { failOnStatusCode: false });
          assertLoggedIn();
        },
      }
    );
  });

  it('Change avatar, toggle theme, enable 2FA, login check + reset password flow', () => {
    openAccountSettings();

    cy.get('h1.ui-page-title', { timeout: 20000 })
      .invoke('text')
      .then((t) => {
        expect(t.trim()).to.match(/Admin Profile|User Profile Form/);
      });

    cy.get('app-user-image-picker', { timeout: 20000 })
      .should('exist')
      .within(() => {
        cy.get('input[type="file"]')
          .selectFile('cypress/fixtures/avatar.png', { force: true });
      });

    cy.contains('label', /^Theme$/, { timeout: 20000 })
      .closest('div.cursor-pointer')
      .click({ force: true })
      .wait(200)
      .click({ force: true });

    cy.contains('label', /^2 Factor Authentication$/, { timeout: 20000 })
      .closest('div.cursor-pointer')
      .click({ force: true });

    cy.logout();

    cy.visit('/login');
    cy.get('input[name="username"]').clear().type(defaultUser.username);
    cy.get('input[name="password"]').clear()
      .type(defaultUser.password, { log: false });

    cy.get('[data-cy="login-button"], input.login-button')
      .first()
      .click();

    cy.get('[data-cy="twofa-center"], .twofa-center').should('be.visible');
    cy.get('img[alt="2FA QR"]').should('exist');
    cy.get('input[name="otpCode"]').should('exist');
    cy.get('[data-cy="twofa_title"], .twofa_title')
      .should('contain.text', 'Enter 2FA code');

    cy.visit('/');
    cy.clearAllEmails();

    cy.contains('[data-cy="reset-password"], span.reset-password', 'Reset password?')
      .click({ force: true });

    cy.get('input[name="companymail"]')
      .clear()
      .type(resetEmail);

    cy.get('input[type="submit"][value="Get reset link"]')
      .click();

    cy.get('body', { timeout: 20000 }).then(($body) => {

      if ($body.text().includes('Password Reset Email Sent')) {

        cy.contains('Password Reset Email Sent').should('be.visible');
        return;

      } else {
        cy.openLastMailAndGetUrl().then((url) => {
          expect(url).to.be.a('string').and.not.be.empty;
          cy.visit(url);
        });

        cy.url().should('include', '/reset');

        cy.get('.signup-container__title')
          .should('contain', 'Reset Password');

        cy.get('input[name="password"]')
          .clear()
          .type(defaultUser.password, { log: false })
          .blur();

        cy.get('input[name="confirmPassword"]')
          .clear()
          .type(defaultUser.password, { log: false })
          .blur();

        cy.get('input[type="submit"]').click();

        cy.contains(
          'New password must be different from the old one.'
        ).should('be.visible');

        cy.get('input[name="password"]').clear().type(newPassword, { log: false }).blur();
        cy.get('input[name="confirmPassword"]').clear().type(newPassword, { log: false }).blur();

        cy.get('input[type="submit"]').click();

        cy.url().should('include', '/login');

        cy.get('input[name="username"]').clear().type(defaultUser.username);
        cy.get('input[name="password"]').clear().type(newPassword, { log: false });

        cy.get('[data-cy="login-button"], input.login-button')
          .first()
          .click();
      }
    });
  });
});
