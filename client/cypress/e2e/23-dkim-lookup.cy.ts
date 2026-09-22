import {
  setupDkimStubs,
  visitDkimLookup,
  assertDkimValidation
} from './controllers/23-dkim-lookup.controller';

describe('Orion Intelligence - DKIM Lookup', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('validates a DKIM selector against a mocked backend', () => {
    setupDkimStubs();
    visitDkimLookup();
    assertDkimValidation();
  });

  it('discovers all selectors for a domain and renders a card per selector', () => {
    cy.intercept('POST', '**/api/dkim/check', (req) => {
      const selector = (req.body && req.body.text && req.body.text.selector) || '';
      if (!selector) {
        req.reply({ body: { status: 'done', result: {
          status: 'success',
          selectors: ['default', 'google'],
          dmarc: { published: true, raw_record: 'v=DMARC1; p=reject', policy: 'reject' },
          spf: { published: true, raw_record: 'v=spf1 ~all' },
          related: [{ test: 'DMARC Record Published', status: 'ok', response: 'DMARC Record found' }]
        } } });
      }
      else {
        req.reply({ body: { status: 'done', result: {
          status: 'success', domain: 'example.com', selector, found: true, is_valid: true,
          dns_query: `${selector}._domainkey.example.com`,
          checks: [{ test: 'DKIM Record Published', status: 'ok', response: 'DKIM Record found' }],
          raw_record: 'v=DKIM1; k=rsa; p=MIIBExample'
        } } });
      }
    }).as('dkim');

    visitDkimLookup();
    cy.get('[data-testid="scan-primary-input"]').type('example.com');
    cy.get('[data-testid="scan-search-button"]').should('not.be.disabled').click();
    cy.wait('@dkim').its('request.body.text').should('deep.equal', { domain: 'example.com', selector: '' });

    cy.contains('Domain Security', { timeout: 15000 }).should('be.visible');
    cy.contains('default._domainkey').should('be.visible');
    cy.contains('google._domainkey').should('be.visible');
    cy.contains('DKIM Record found').should('be.visible');
  });

  it('handles partial raw results, duplicate submissions, and errors', () => {
    visitDkimLookup();
    cy.contains('button', 'Raw Email Forensics').click();
    cy.contains('button', 'Run Diagnostics').should('be.disabled');
    cy.intercept('POST', '**/api/dkim/check', {
      delay: 500,
      body: { status: 'done', result: { data: { dkim: { status: 'Not Found' }, hops: [] } } }
    }).as('rawCheck');
    cy.get('#dkim-raw').type('From: sender@example.com\nSubject: Test', { parseSpecialCharSequences: false });
    cy.contains('button', 'Run Diagnostics').click();
    cy.contains('button', 'Analyzing…').should('be.disabled');
    cy.wait('@rawCheck');
    cy.contains('Authentication Results').should('be.visible');
    cy.contains('No Received headers found').scrollIntoView().should('be.visible');
    cy.contains('.dkim-auth-grid section', 'SPF Check').should('contain.text', 'Not available');
    cy.intercept('POST', '**/api/dkim/check', { body: { status: 'done', result: { error_message: 'Unable to parse message' } } }).as('rawError');
    cy.contains('button', 'Run Diagnostics').click();
    cy.wait('@rawError');
    cy.get('[role="alert"]').should('contain.text', 'Unable to parse message');
    cy.get('.dkim-auth-grid').should('not.exist');
  });

  it('runs full raw email forensics and traces the delivery hops', () => {
    cy.intercept('POST', '**/api/dkim/check', { body: { status: 'done', result: { data: {
      dkim: { status: 'pass', domain: 'pseb.org.pk', selector: 'bsxv34g4' },
      spf: { status: 'pass', origin_ip: '54.240.8.51', domain: 'amazonses.com' },
      dmarc: { status: 'pass', domain: 'pseb.org.pk', record: 'p=QUARANTINE' },
      hops: [
        { hop: 2, details: 'by mx.google.com with SMTP; Sun, 13 Sep 2026' },
        { hop: 1, details: 'from a8-51.smtp-out.amazonses.com [54.240.8.51] by mx.google.com' }
      ]
    } } } }).as('rawFull');

    visitDkimLookup();
    cy.contains('button', 'Raw Email Forensics').click();
    cy.get('#dkim-raw').type('From: newsletters@pseb.org.pk\nDKIM-Signature: d=pseb.org.pk; s=bsxv34g4\nReceived: from x', { parseSpecialCharSequences: false });
    cy.contains('button', 'Run Diagnostics').click();
    cy.wait('@rawFull').its('request.body.text.raw_email').should('contain', 'DKIM-Signature');

    cy.contains('Authentication Results').should('be.visible');
    cy.contains('.dkim-auth-grid section', 'DKIM Signature').should('contain.text', 'pass').and('contain.text', 'pseb.org.pk');
    cy.contains('.dkim-auth-grid section', 'SPF Check').should('contain.text', '54.240.8.51');
    cy.contains('.dkim-auth-grid section', 'DMARC Policy').should('contain.text', 'p=QUARANTINE');
    cy.contains('Network Hops').scrollIntoView().should('be.visible');
    cy.get('.dkim-hops li').should('have.length', 2);
  });

  it('keeps both forms within the viewport on mobile in both themes', () => {
    visitDkimLookup();
    cy.viewport(390, 844);
    for (const theme of ['dark-theme', 'light-theme']) {
      cy.get('body').invoke('removeClass', 'dark-theme light-theme').invoke('addClass', theme);
      for (const mode of ['Domain Lookup', 'Raw Email Forensics']) {
        cy.contains('button', mode).click();
        cy.get('.dkim-card:visible').first().then(($card) => {
          const bounds = $card[0].getBoundingClientRect();
          expect(bounds.left).to.be.at.least(0);
          expect(bounds.right).to.be.at.most(390);
          expect($card[0].scrollWidth).to.be.at.most($card[0].clientWidth);
        });
      }
    }
  });

});
