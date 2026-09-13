import {
  richIpDetail,
  leanIpDetail,
  cameraOnlyIpDetail,
  buildSeoRepoResponse,
  assertIpDetailTextIfPresent,
  stubNetworkIntelApis
} from './controllers/17-network-intel.controller';

describe('Network Intel - End-to-End Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs host recon, ip scan, vulnerability scan, and exports reports from all three sections', () => {
    stubNetworkIntelApis();
    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-host-recon"]').should('be.visible');

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:network-intel-test').as('networkIntelExport');
    });

    cy.get('[data-testid="network-intel-tab-host-recon"]').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('https://www.example.com/{enter}');
    cy.wait('@resolveIp').its('request.body').should('deep.equal', { domain: 'example.com' });
    cy.get('[data-testid="network-intel-dns-row-93.184.216.34"]').should('be.visible').click();
    cy.wait('@ipScanner').its('request.body').should('deep.equal', { ip: '93.184.216.34' });
    cy.get('[data-testid="network-intel-dns-detail-93.184.216.34"]').should('be.visible');
    cy.docsScreenshot('network-intel-host-recon');
    cy.get('[data-testid="network-intel-dns-row-93.184.216.34"]').should('be.visible').click();
    cy.get('[data-testid="network-intel-dns-detail-93.184.216.34"]').should('not.exist');

    cy.get('[data-testid="network-intel-download-report"]')
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('[data-testid="network-intel-tab-ip-scan"]').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('https://8.8.8.8/{enter}');
    cy.wait('@ipScanner').its('request.body').should('deep.equal', { ip: '8.8.8.8' });
    cy.get('[data-testid="network-intel-ip-result"]').should('be.visible');
    cy.docsScreenshot('network-intel-ip-scan');

    cy.get('[data-testid="network-intel-download-report"]')
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('[data-testid="network-intel-tab-vulnerability-scan"]').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('https://www.bbc.com/{enter}');
    cy.contains('[data-testid="network-intel-vulnerability-target"]', /^bbc\.com$/, { timeout: 60000 }).should('be.visible');
    cy.contains('[data-testid="network-intel-vulnerability-target"]', /^bbc\.com$/)
      .first()
      .closest('[data-testid="network-intel-vulnerability-row"]')
      .click();
    cy.get('[data-testid="confirmation-popup"]').should('not.exist');
    cy.get('[data-testid="network-intel-vulnerability-empty"]').should('contain.text', 'Nothing scanned yet');
    cy.contains('[data-testid="network-intel-vulnerability-target"]', /^bbc\.com$/)
      .first()
      .closest('[data-testid="network-intel-vulnerability-row"]')
      .click();
    cy.get('[data-testid="network-intel-vulnerability-empty"]').should('not.exist');
    cy.docsScreenshot('network-intel-vulnerability-depth-controls');
    cy.get('[data-testid="network-intel-vulnerability-depth-full"]').first().should('be.visible').click();
    cy.get('[data-testid="confirmation-popup"]').should('be.visible').and('contain.text', 'over an hour');
    cy.get('[data-testid="confirmation-warning-icon"]').should('be.visible');
    cy.get('[data-testid="confirmation-yes-button"]').click();
    cy.wait('@vulnerabilityScan').its('request.body').should('deep.equal', {
      domain: 'bbc.com',
      depth: 'full',
    });
    cy.get('[data-testid="network-intel-vulnerability-result"]', { timeout: 120000 }).should('be.visible');
    cy.contains('The response does not define a Content Security Policy.').should('be.visible');
    cy.get('[data-testid="network-intel-vulnerability-finding-details"]').should('not.exist');
    cy.get('[data-testid="network-intel-vulnerability-finding-toggle"]')
      .first()
      .should('have.attr', 'aria-expanded', 'false')
      .click()
      .should('have.attr', 'aria-expanded', 'true');
    cy.get('[data-testid="network-intel-vulnerability-finding-details"]')
      .should('be.visible')
      .and('contain.text', 'Reference URLs')
      .and('contain.text', 'content-security-policy: missing');
    cy.get('[data-testid="network-intel-vulnerability-finding-toggle"]')
      .first()
      .click()
      .should('have.attr', 'aria-expanded', 'false');
    cy.get('[data-testid="network-intel-vulnerability-finding-details"]').should('not.exist');
    cy.docsScreenshot('network-intel-vulnerability-scan');

    cy.get('[data-testid="network-intel-download-report"]')
      .scrollIntoView()
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('@networkIntelExport').its('callCount').should('be.gte', 2);
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
    cy.get('[data-testid="network-intel-tab-host-recon"]').should('be.visible');
    cy.get('[data-testid="network-intel-tab-geo-fencing"]').click();

    cy.get('[data-testid="network-intel-geo-search-trigger"]').click({ force: true });
    cy.get('[data-testid="network-intel-geo-modal"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-map"] svg path', { timeout: 30000 }).should('have.length.greaterThan', 0);
    cy.docsScreenshot('network-intel-geo-modal');
    cy.get('[data-testid="network-intel-geo-close"]').click();
    cy.get('[data-testid="network-intel-geo-modal"]').should('not.exist');

    cy.get('[data-testid="network-intel-geo-search-trigger"]').click({ force: true });
    cy.get('[data-testid="network-intel-geo-modal"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-cancel"]').click();
    cy.get('[data-testid="network-intel-geo-modal"]').should('not.exist');

    cy.get('[data-testid="network-intel-geo-search-trigger"]').click({ force: true });
    cy.get('[data-testid="network-intel-geo-modal"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-mode-map"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-map"]').should('be.visible');
    cy.get('[data-testid="network-intel-geo-zoom-label"]')
      .should('be.visible')
      .invoke('text')
      .then((initialZoomLabel) => {
        cy.get('[data-testid="network-intel-geo-zoom-in"]').click();
        cy.get('[data-testid="network-intel-geo-zoom-label"]').should(($label) => {
          expect($label.text().trim()).not.to.equal(initialZoomLabel.trim());
        });
        cy.get('[data-testid="network-intel-geo-zoom-out"]').click();
        cy.get('[data-testid="network-intel-geo-zoom-label"]').should(($label) => {
          expect($label.text().trim()).to.equal(initialZoomLabel.trim());
        });
      });

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

    cy.get('[data-testid="network-intel-geo-start"]').click();
    cy.get('[data-testid="network-intel-geo-modal"]').should('not.exist');
    cy.get('[data-testid="network-intel-search-input"]').should('have.value', '31.48000, 74.17000');
  });

  it('renders every IP-detail section from a rich IP scan and exports the report', () => {
    cy.intercept('POST', '**/api/netintel/ipscanner', {
      statusCode: 200,
      body: { status: 'done', result: richIpDetail }
    }).as('richIpScanner');

    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-ip-scan"]').should('be.visible').click();

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:rich-ip-export').as('richIpExport');
    });

    cy.get('[data-testid="network-intel-search-input"]').clear().type('203.0.113.7{enter}');
    cy.wait('@richIpScanner').its('request.body').should('deep.equal', { ip: '203.0.113.7' });

    cy.get('[data-testid="network-intel-ip-result"]', { timeout: 60000 }).should('be.visible');
    cy.get('app-ip-detail').should('be.visible');

    [
      'Acme Networks',
      'Acme ISP',
      'AS64500',
      'ECDHE-RSA-AES256',
      "Let's Encrypt",
      'TLSv1.3',
      'TLSv1.0',
      'sha256WithRSA',
      'React',
      'Cloudflare WAF',
      'Heroku',
      'Directory listing enabled',
      'CVE-2022-2222',
      'X-Powered-By',
      'Cache-Control',
      'host1.acme.example',
      'Hikvision',
      'ip-info-extra',
      'extra additional detail',
    ].forEach((value) => {
      assertIpDetailTextIfPresent(value);
    });
    cy.docsScreenshot('network-intel-ip-detail-rich');

    cy.get('[data-testid="network-intel-download-report"]')
      .should('be.visible')
      .and('be.enabled')
      .click();
    cy.get('@richIpExport').its('callCount').should('be.gte', 1);
  });

  it('renders a lean IP scan with alternate port fields and HSTS disabled', () => {
    cy.intercept('POST', '**/api/netintel/ipscanner', {
      statusCode: 200,
      body: { status: 'done', result: leanIpDetail }
    }).as('leanIpScanner');

    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-ip-scan"]').should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('198.51.100.5{enter}');
    cy.wait('@leanIpScanner').its('request.body').should('deep.equal', { ip: '198.51.100.5' });

    cy.get('[data-testid="network-intel-ip-result"]', { timeout: 60000 }).should('be.visible');
    cy.get('app-ip-detail').should('be.visible');

    [
      'France',
      'Fastly',
      'http-proxy',
      'closed',
      'TLSv1.1',
      '2026-12-01',
      'CSP',
      'HSTS',
      'nginx',
    ].forEach((value) => {
      assertIpDetailTextIfPresent(value);
    });
    cy.docsScreenshot('network-intel-ip-detail-lean');

    cy.get('[data-testid="network-intel-download-report"]').should('be.enabled').click();
  });

  it('renders IP detail signals when ports carry no renderable detail', () => {
    cy.intercept('POST', '**/api/netintel/ipscanner', {
      statusCode: 200,
      body: { status: 'done', result: cameraOnlyIpDetail }
    }).as('cameraIpScanner');

    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-ip-scan"]').should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('203.0.113.99{enter}');
    cy.wait('@cameraIpScanner').its('request.body').should('deep.equal', { ip: '203.0.113.99' });

    cy.get('[data-testid="network-intel-ip-result"]', { timeout: 60000 }).should('be.visible');
    cy.get('app-ip-detail').should('be.visible');

    [
      'No result found',
      'Camera Detected',
      'IoT Ports',
      'Dahua',
      'edge-node',
      'APAC',
    ].forEach((value) => {
      assertIpDetailTextIfPresent(value);
    });
    cy.docsScreenshot('network-intel-ip-detail-camera-only');

    cy.get('[data-testid="network-intel-download-report"]').should('be.enabled').click();
  });

  it('surfaces an error state when the IP scan backend fails', () => {
    cy.intercept('POST', '**/api/netintel/ipscanner', {
      statusCode: 200,
      body: { status: 'error', message: 'IP scan backend unavailable.' }
    }).as('failingIpScanner');

    cy.visit('/dashboard/netint');
    cy.get('[data-testid="network-intel-tab-ip-scan"]').should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('192.0.2.10{enter}');
    cy.wait('@failingIpScanner').its('request.body').should('deep.equal', { ip: '192.0.2.10' });

    cy.get('app-ip-detail').should('not.exist');
    cy.get('[data-testid="network-intel-ip-result"]').should('not.exist');
  });

  it('runs SEO and repository scans, renders findings, and exports the reports', () => {
    cy.intercept('POST', '**/api/urlscan/domain', (req) => {
      const host = String(req.body?.scanType) === 'repo' ? 'github.com' : 'seo-target.example';
      req.reply({ statusCode: 200, body: buildSeoRepoResponse(host) });
    }).as('urlScan');

    cy.visit('/dashboard/netint');

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:seo-repo-export').as('seoRepoExport');
    });

    cy.get('[data-testid="network-intel-tab-seo-scan"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('https://seo-target.example/{enter}');
    cy.wait('@urlScan').its('request.body.scanType').should('eq', 'seo');
    cy.contains('Missing Content-Security-Policy', { timeout: 60000 }).should('be.visible');
    cy.contains('Missing sitemap.xml').should('be.visible');
    cy.contains('content-security-policy: absent').should('be.visible');
    cy.docsScreenshot('network-intel-seo-scan');

    cy.get('[data-testid="network-intel-download-report"]').should('be.enabled').click();

    cy.get('[data-testid="network-intel-tab-repository-scan"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('https://github.com/juice-shop/juice-shop{enter}');
    cy.wait('@urlScan').its('request.body.scanType').should('eq', 'repo');
    cy.contains('Missing Content-Security-Policy', { timeout: 60000 }).should('be.visible');

    cy.get('[data-testid="network-intel-download-report"]').should('be.enabled').click();
    cy.get('@seoRepoExport').its('callCount').should('be.gte', 1);
  });

  it('runs a geo camera coordinate scan into an IP list and exports it', () => {
    cy.intercept('POST', '**/api/netintel/iot_detect', {
      statusCode: 200,
      body: { status: 'done', result: { status: 'done', domain: '31.48000, 74.17000', ips: ['198.51.100.10', '198.51.100.11'], count: 2 } }
    }).as('geoScan');

    cy.visit('/dashboard/netint?section=geo-cameras&q=31.48000,%2074.17000');
    cy.get('[data-testid="network-intel-tab-geo-fencing"]').should('be.visible');

    cy.get('body').then(($b) => {
      const dismiss = $b.find('[data-testid="network-intel-geo-close"]:visible, [data-testid="network-intel-geo-cancel"]:visible');
      if (dismiss.length) {
        cy.wrap(dismiss.first()).click({ force: true });
      }
    });

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake(() => 'blob:geo-export').as('geoExport');
    });

    cy.wait('@geoScan');
    cy.get('[data-testid="network-intel-dns-row-198.51.100.10"]', { timeout: 60000 }).should('be.visible');
    cy.get('[data-testid="network-intel-dns-row-198.51.100.11"]').should('be.visible');
    cy.docsScreenshot('network-intel-geo-ip-list');

    cy.get('[data-testid="network-intel-download-report"]').should('be.enabled').click();
    cy.get('@geoExport').its('callCount').should('be.gte', 1);
  });
});
