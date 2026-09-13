describe('Orion Intelligence - AI Workspace Coverage (real backend reads)', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('loads the AI workspace, reads chat sessions and switches views', () => {
    cy.intercept('GET', '**/api/nexus/chats').as('nexusChats');

    cy.visit('/dashboard/ai');
    cy.get('[data-testid="ai-workspace-root"]', { timeout: 120000 }).should('be.visible');
    cy.wait('@nexusChats', { timeout: 120000 });

    cy.get('[data-testid="ai-window-view-split"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="ai-window-view-directory"]').should('be.visible').click({ force: true });
    cy.docsScreenshot('ai-workspace-directory');

    cy.get('body').then(($body) => {
      const importBtn = $body.find('[data-testid="ai-import-directory-button"]:visible').first();
      if (importBtn.length) {
        cy.wrap(importBtn).click({ force: true });
        cy.get('[data-testid="ai-directory-repo-url"], [data-testid="ai-directory-tab-files"]', { timeout: 60000 }).should('exist');
      }
    });

    cy.get('[data-testid="ai-window-view-chat"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="chat-widget-input"]', { timeout: 60000 }).should('exist');
    cy.docsScreenshot('ai-workspace-chat');
  });
});
