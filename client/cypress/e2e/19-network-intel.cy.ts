describe('Network Intel - End-to-End Flow', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs host recon, deep scan, geo cameras, and triggers one export', () => {
    cy.visit('/dashboard/netint');
    cy.contains('button', /^Host Recon$/, { timeout: 30000 }).should('be.visible');

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

    cy.contains('button', /^Deep Scan$/).click();
    cy.get('form input[type="text"]', { timeout: 30000 }).filter(':visible').first().scrollIntoView().should('be.enabled').clear().type('8.8.8.8{enter}');

    cy.contains('app-network-intel-shodan-section span.font-mono', '8.8.8.8', { timeout: 45000 }).should('be.visible');
    cy.contains('app-network-intel-shodan-section', 'Google LLC', { timeout: 45000 }).should('be.visible');

    cy.contains('button', /^Geo Cameras$/).click();
    cy.contains('button', /^Coordinates$/).click();

    cy.get('.ui-graph-popup-panel', { timeout: 30000 })
      .filter(':visible')
      .first()
      .within(() => {
        cy.contains('button', 'Manual', { timeout: 10000 }).click();
        cy.get('input[placeholder="31.48, 74.17"]', { timeout: 10000 }).should('be.visible').clear().type('24.8607, 67.0011');
        cy.contains('button', /^Start Scan$/).click();
      });

    cy.get('app-network-intel-geo-section app-geo-feed', { timeout: 45000 })
      .should('be.visible')
      .and('contain.text', '203.0.113.10');

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:network-intel-test').as('networkIntelExport');
    });

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('@networkIntelExport', { timeout: 15000 }).should('have.been.calledOnce');
  });
});
