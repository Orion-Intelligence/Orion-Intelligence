describe('Network Intel - End-to-End Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  const stubNetworkIntelApis = () => {
    cy.intercept('POST', '**/api/netintel/resolve_ip', {
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          domain: 'example.com',
          ips: ['93.184.216.34'],
        },
      },
    }).as('resolveIp');

    cy.intercept('POST', '**/api/netintel/ipscanner', (req) => {
      const ip = req.body?.ip;

      if (ip === '8.8.8.8') {
        req.reply({
          statusCode: 200,
          body: {
            status: 'done',
            result: {
              status: 'done',
              ip: '8.8.8.8',
              country: 'United States',
              organization: 'Google',
              hosting_type: 'public-dns',
              open_ports: [53],
              ports: [
                {
                  port: 53,
                  protocol: 'udp',
                  service: 'dns',
                  state: 'open',
                  confidence: 0.95,
                  risk_flags: [],
                },
              ],
            },
          },
        });
        return;
      }

      req.reply({
        statusCode: 200,
        body: {
          status: 'done',
          result: {
            status: 'done',
            ip: ip || '93.184.216.34',
            country: 'United States',
            organization: 'Example Org',
            hosting_type: 'hosting',
            open_ports: [80, 443],
            ports: [
              {
                port: 80,
                protocol: 'tcp',
                service: 'http',
                state: 'open',
                confidence: 0.9,
                risk_flags: [],
              },
              {
                port: 443,
                protocol: 'tcp',
                service: 'https',
                state: 'open',
                confidence: 0.95,
                risk_flags: ['modern_tls'],
              },
            ],
          },
        },
      });
    }).as('ipScanner');

    cy.intercept('POST', '**/api/netintel/url_vulnerability_scan', {
      statusCode: 200,
      body: {
        status: 'done',
        result: {
          status: 'done',
          url: 'https://bbc.com',
          host: 'bbc.com',
          elapsed_seconds: 2,
          summary: {
            total: 1,
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
            info: 0,
          },
          findings: [
            {
              title: 'Missing Content-Security-Policy',
              severity: 'high',
              category: 'headers',
            },
          ],
        },
      },
    }).as('vulnerabilityScan');
  };

  it('runs host recon, ip scan, vulnerability scan, and exports reports from all three sections', () => {
    stubNetworkIntelApis();
    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-host-recon"]', { timeout: 30000 }).should('be.visible');

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:network-intel-test').as('networkIntelExport');
    });

    cy.get('[data-testid="network-intel-tab-host-recon"]').click();
    cy.get('[data-testid="network-intel-search-input"]', { timeout: 30000 }).clear().type('example.com{enter}');
    cy.wait('@resolveIp');
    cy.get('[data-testid="network-intel-dns-row-93.184.216.34"]', { timeout: 45000 }).should('be.visible').click();
    cy.get('[data-testid="network-intel-dns-detail-93.184.216.34"]', { timeout: 45000 }).should('be.visible');
    cy.get('[data-testid="network-intel-dns-row-93.184.216.34"]', { timeout: 30000 }).should('be.visible').click();
    cy.get('[data-testid="network-intel-dns-detail-93.184.216.34"]', { timeout: 15000 }).should('not.exist');

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('[data-testid="network-intel-tab-ip-scan"]').click();
    cy.get('[data-testid="network-intel-search-input"]', { timeout: 30000 }).clear().type('8.8.8.8{enter}');
    cy.wait('@ipScanner');
    cy.get('[data-testid="network-intel-ip-result"]', { timeout: 45000 }).should('be.visible');

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('[data-testid="network-intel-tab-vulnerability-scan"]').click();
    cy.get('[data-testid="network-intel-search-input"]', { timeout: 30000 }).clear().type('bbc.com{enter}');
    cy.wait('@vulnerabilityScan');
    cy.get('[data-testid="network-intel-vulnerability-result"]', { timeout: 45000 }).should('be.visible');

    cy.get('[data-testid="network-intel-download-report"]', { timeout: 15000 })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('@networkIntelExport', { timeout: 15000 }).should('have.callCount', 3);
  });

  it('covers the Geo IoT modal end to end with stable selectors only', () => {
    stubNetworkIntelApis();
    cy.intercept('POST', '**/api/netintel/iot_detect', (req) => {
      expect(req.body).to.deep.equal({
        coordinates: '31.48000, 74.17000',
        radius_km: 35,
        max_ips: 250,
      });

      req.reply({
        status: 'done',
        result: {
          status: 'done',
          domain: '31.48000, 74.17000',
          ips: ['1.1.1.1'],
          count: 1,
        },
      });
    }).as('geoIotScan');

    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-host-recon"]', { timeout: 30000 }).should('be.visible');

    cy.get('[data-testid="network-intel-open-geo"]', { timeout: 30000 }).click();
    cy.get('[data-testid="network-intel-geo-modal"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="network-intel-geo-close"]').click();
    cy.get('[data-testid="network-intel-geo-modal"]', { timeout: 15000 }).should('not.exist');

    cy.get('[data-testid="network-intel-open-geo"]', { timeout: 30000 }).click();
    cy.get('[data-testid="network-intel-geo-modal"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="network-intel-geo-cancel"]').click();
    cy.get('[data-testid="network-intel-geo-modal"]', { timeout: 15000 }).should('not.exist');

    cy.get('[data-testid="network-intel-open-geo"]', { timeout: 30000 }).click();
    cy.get('[data-testid="network-intel-geo-modal"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="network-intel-geo-mode-map"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-map"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-zoom-label"]').should('contain.text', '1x');
    cy.get('[data-testid="network-intel-geo-zoom-out"]').should('be.disabled');
    cy.get('[data-testid="network-intel-geo-zoom-in"]').click();
    cy.get('[data-testid="network-intel-geo-zoom-label"]').should('contain.text', '1.5x');
    cy.get('[data-testid="network-intel-geo-zoom-out"]').should('not.be.disabled').click();
    cy.get('[data-testid="network-intel-geo-zoom-label"]').should('contain.text', '1x');

    cy.get('[data-testid="network-intel-geo-mode-manual"]').click();
    cy.get('[data-testid="network-intel-geo-coordinates-input"]')
      .should('be.visible')
      .clear()
      .type('31.48000, 74.17000');

    cy.get('[data-testid="network-intel-geo-radius-input"]')
      .invoke('val', '30')
      .trigger('input')
      .trigger('change');
    cy.get('[data-testid="network-intel-geo-radius-increment"]').click();
    cy.get('[data-testid="network-intel-geo-radius-input"]').should('have.value', '35');

    cy.get('[data-testid="network-intel-geo-max-ips-input"]')
      .invoke('val', '300')
      .trigger('input')
      .trigger('change');
    cy.get('[data-testid="network-intel-geo-max-ips-decrement"]').click();
    cy.get('[data-testid="network-intel-geo-max-ips-input"]').should('have.value', '250');

    cy.get('[data-testid="network-intel-geo-mode-map"]').click();
    cy.get('[data-testid="network-intel-geo-selected-point"]', { timeout: 15000 }).should('be.visible');

    cy.get('[data-testid="network-intel-geo-start"]').click();
    cy.wait('@geoIotScan');
    cy.get('[data-testid="network-intel-geo-modal"]', { timeout: 15000 }).should('not.exist');
    cy.get('[data-testid="network-intel-search-input"]').should('have.value', '31.48000, 74.17000');
    cy.get('[data-testid="network-intel-dns-row-1.1.1.1"]', { timeout: 15000 }).should('be.visible');
  });
});
