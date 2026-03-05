const testUsers = Cypress.env('TEST_USERS') || {};
const defaultUserKey = 'testing4';
const defaultUser = testUsers[defaultUserKey] || {};
const resetEmail = Cypress.env('RESET_PASSWORD_EMAIL') || 'd@hotmail.com';
const newPassword = Cypress.env('NEW_PASSWORD');

if (!defaultUser?.username || !defaultUser?.password || !resetEmail || !newPassword) {
    throw new Error('Missing required account/password env values in cypress.config.ts');
}

describe('Orion Intelligence - Account Settings and Password Reset Flow', () => {
    before(() => {
        cy.loginAsTest1();
    });

    after(() => {
        cy.logout();
    });

    it('updates avatar/theme/2FA and validates reset password journey', () => {
        cy.get('[data-testid="sidebar-group-profile"]', {timeout: 20000}).should('be.visible').click({scrollBehavior: false});
        cy.get('[data-testid="sidebar-subitem-profile-account"]', {timeout: 20000}).should('be.visible').click({scrollBehavior: false});
        cy.location('pathname', {timeout: 20000}).should('include', '/dashboard/profile/account');
        cy.get('[data-testid="account-settings-form"]', {timeout: 20000}).should('be.visible');
        cy.get('[data-testid="account-settings-title"]', {timeout: 20000}).should('be.visible');

        cy.get('[data-testid="account-settings-title"]', {timeout: 20000}).invoke('text').then((t) => {
            expect(t.trim()).to.match(/Admin Profile|User Profile Form/);
        });

        cy.get('app-user-image-picker', {timeout: 20000}).should('exist');

        cy.fixture('avatar.png', 'base64').then((content) => {
            cy.get('app-user-image-picker input[type="file"]', {timeout: 20000}).first().should('exist').invoke('removeAttr', 'hidden').invoke('css', 'display', 'block').invoke('css', 'visibility', 'visible').invoke('css', 'position', 'fixed').invoke('css', 'left', '0').invoke('css', 'top', '0').invoke('css', 'width', '1px').invoke('css', 'height', '1px').invoke('css', 'opacity', '1').selectFile({
                contents: Cypress.Blob.base64StringToBlob(content, 'image/png'),
                fileName: 'avatar.png',
                mimeType: 'image/png',
                lastModified: Date.now(),
            });
        });

        cy.get('[data-testid="account-settings-theme-toggle"]', {timeout: 20000}).click().wait(200).click();
        cy.get('[data-testid="account-settings-twofa-toggle"]', {timeout: 20000}).click();
        cy.logout();

        cy.visit('/login');
        cy.get('[data-testid="login-user"]').clear().type(defaultUser.username);
        cy.get('[data-testid="login-pass"]').clear().type(defaultUser.password, {log: false});
        cy.get('[data-testid="login-button"]').click();
        cy.get('[data-cy="twofa-center"], .twofa-center').should('be.visible');
        cy.get('img[alt="2FA QR"]').should('exist');
        cy.get('input[name="otpCode"]').should('exist');
        cy.get('[data-cy="twofa_title"], .twofa_title').should('contain.text', 'Enter 2FA code');

        cy.visit('/');
        cy.clearAllEmails();
        cy.contains('[data-cy="reset-password"], span.reset-password', 'Reset password?').click();
        cy.get('[data-testid="reset-companymail"]').clear().type(resetEmail);
        cy.get('[data-testid="reset-submit"]').click();

        cy.get('body', {timeout: 20000}).then(($body) => {
            if ($body.text().includes('Password Reset Email Sent')) {
                cy.contains('Password Reset Email Sent').should('be.visible');
                return;
            }

            cy.openLastMailAndGetUrl().then((url) => {
                expect(url).to.be.a('string').and.not.be.empty;
                cy.visit(url);
            });
            cy.url().should('include', '/reset');
            cy.get('.signup-container__title').should('contain', 'Reset Password');
            cy.get('input[name="password"]').clear().type(defaultUser.password, {log: false}).blur();
            cy.get('input[name="confirmPassword"]').clear().type(defaultUser.password, {log: false}).blur();
            cy.get('[data-testid="reset-submit"]').click();
            cy.contains('New password must be different from the old one.').should('be.visible');
            cy.get('input[name="password"]').clear().type(newPassword, {log: false}).blur();
            cy.get('input[name="confirmPassword"]').clear().type(newPassword, {log: false}).blur();
            cy.get('[data-testid="reset-submit"]').click();
            cy.url().should('include', '/login');
            cy.get('[data-testid="login-user"]').clear().type(defaultUser.username);
            cy.get('[data-testid="login-pass"]').clear().type(newPassword, {log: false});
            cy.get('[data-testid="login-button"]').click();
        });
    });
});
