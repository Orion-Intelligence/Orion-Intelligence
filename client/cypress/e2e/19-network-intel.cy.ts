describe('Network Intel - End-to-End Flow', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs host recon, ip scan, vulnerability scan, and exports reports from all three sections', () => {
    cy.visit('/dashboard/netint');
    cy.contains('button', /^Host Recon$/, { timeout: 30000 }).should('be.visible');

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:network-intel-test').as('networkIntelExport');
    });

    cy.contains('button', /^Host Recon$/).click();
    cy.get('form input[type="text"]', { timeout: 30000 }).filter(':visible').first().scrollIntoView().should('be.enabled').clear().type('example.com{enter}');

    cy.contains('span.font-mono', '93.184.216.34', { timeout: 45000 })
      .should('be.visible')
      .click();

    cy.get('app-network-intel-dns-section app-ip-detail', { timeout: 45000 })
      .should('be.visible')
      .and('contain.text', 'Google LLC');

    cy.contains('span.font-mono', '93.184.216.34', { timeout: 30000 })
      .should('be.visible')
      .click();

    cy.get('app-network-intel-dns-section app-ip-detail', { timeout: 15000 }).should('not.exist');

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.contains('button', /^Deep Scan$/).click();
    cy.get('form input[type="text"]', { timeout: 30000 }).filter(':visible').first().scrollIntoView().should('be.enabled').clear().type('8.8.8.8{enter}');

    cy.contains('app-network-intel-shodan-section span.font-mono', '8.8.8.8', { timeout: 45000 }).should('be.visible');
    cy.contains('app-network-intel-shodan-section', 'Google LLC', { timeout: 45000 }).should('be.visible');

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.contains('button', /^Vulnerability Scan$/).click();
    cy.get('form input[type="text"]', { timeout: 30000 }).filter(':visible').first().scrollIntoView().should('be.enabled').clear().type('bbc.com{enter}');

    cy.contains('app-network-intel-vulnerability-section', 'bbc.com', { timeout: 45000 }).should('be.visible');
    cy.contains('app-network-intel-vulnerability-section', 'URL Vulnerability', { timeout: 45000 }).should('be.visible');

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('@networkIntelExport', { timeout: 15000 }).should('have.callCount', 3);
  });
});
