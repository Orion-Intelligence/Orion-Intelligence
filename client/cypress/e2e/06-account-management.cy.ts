const defaultUserKey = 'testing4';
let defaultUser: any = {};
let resetEmail = 'd@hotmail.com';
let newPassword: string | undefined;

describe('Orion Intelligence - Account Settings and Password Reset Flow', () => {
    before(() => {
        cy.env(['TEST_USERS', 'RESET_PASSWORD_EMAIL', 'NEW_PASSWORD']).then(({TEST_USERS, RESET_PASSWORD_EMAIL, NEW_PASSWORD}) => {
            const testUsers = TEST_USERS || {};
            defaultUser = testUsers[defaultUserKey] || {};
            resetEmail = RESET_PASSWORD_EMAIL || 'd@hotmail.com';
            newPassword = NEW_PASSWORD;
            if (!defaultUser?.username || !defaultUser?.password || !resetEmail || !newPassword) {
                throw new Error('Missing required account/password env values in cypress.config.ts');
            }
        });
        cy.loginAsTest1();
    });

    after(() => {
        cy.visit("/");
    });

    it('updates avatar/theme/2FA and validates reset password journey', () => {
        const resolvedNewPassword = newPassword ?? '';
        cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').click({scrollBehavior: false});
        cy.get('[data-testid="sidebar-subitem-profile-account"]').should('be.visible').click({scrollBehavior: false});
        cy.location('pathname').should('include', '/dashboard/profile/account');
        cy.get('[data-testid="account-settings-form"]').should('be.visible');
        cy.get('[data-testid="account-settings-title"]').should('be.visible');

        cy.get('[data-testid="account-settings-title"]').invoke('text').then((t) => {
            expect(t.trim()).to.match(/Admin Profile|User Profile Form/);
        });

        cy.get('app-user-image-picker').should('exist');

        cy.fixture('avatar.png', 'base64').then((content) => {
            cy.get('app-user-image-picker input[type="file"]').first().should('exist').invoke('removeAttr', 'hidden').invoke('css', 'display', 'block').invoke('css', 'visibility', 'visible').invoke('css', 'position', 'fixed').invoke('css', 'left', '0').invoke('css', 'top', '0').invoke('css', 'width', '1px').invoke('css', 'height', '1px').invoke('css', 'opacity', '1').selectFile({
                contents: Cypress.Blob.base64StringToBlob(content, 'image/png'),
                fileName: 'avatar.png',
                mimeType: 'image/png',
                lastModified: Date.now(),
            });
        });

        cy.get('[data-testid="account-settings-theme-toggle"]').click().wait(200).click();
        cy.get('[data-testid="account-settings-twofa-toggle"]').click();
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

        cy.get('body').then(($body) => {
            if ($body.text().includes('Password Reset Email Sent')) {
                cy.contains('Password Reset Email Sent').should('be.visible');
            }

            cy.openLastMailAndGetUrl().then((url) => {
                expect(url).to.be.a('string').and.not.be.empty;
                cy.visit(url);
            });
            cy.url().should('include', '/reset');
            cy.get('[data-testid="reset-password"]').clear().type(defaultUser.password, {log: false}).blur();
            cy.get('[data-testid="reset-confirm-password"]').clear().type(defaultUser.password, {log: false}).blur();
            cy.get('[data-testid="reset-submit"]').click();
            cy.contains('New password must be different from the old one.').should('be.visible');
            cy.get('[data-testid="reset-password"]').clear().type(resolvedNewPassword, {log: false}).blur();
            cy.get('[data-testid="reset-confirm-password"]').clear().type(resolvedNewPassword, {log: false}).blur();
            cy.get('[data-testid="reset-submit"]').click();
            cy.url().should('include', '/login');
            cy.get('[data-testid="login-user"]').clear().type(defaultUser.username);
            cy.get('[data-testid="login-pass"]').clear().type(resolvedNewPassword, {log: false});
            cy.get('[data-testid="login-button"]').click();
        });
    });
});
