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

  it('discovers selectors and clears stale results when the domain changes', () => {
    cy.intercept('POST', '**/api/dkim/check', {
      body: { status: 'done', result: { status: 'success', selectors: ['default', 'mail'] } }
    }).as('discover');
    visitDkimLookup();
    cy.get('#dkim-domain').should('have.css', 'cursor', 'text').type('example.com{enter}');
    cy.wait('@discover').its('request.body.text').should('deep.equal', { domain: 'example.com', selector: '' });
    cy.contains('.dkim-chips button', 'mail').click().should('have.attr', 'aria-pressed', 'true');
    cy.get('#dkim-selector').should('have.value', 'mail');
    cy.get('#dkim-domain').clear().type('another.example');
    cy.get('.dkim-chips').should('not.exist');
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
    cy.contains('No Received headers found').should('be.visible');
    cy.contains('.dkim-auth-grid section', 'SPF Check').should('contain.text', 'Not available');
    cy.intercept('POST', '**/api/dkim/check', { body: { status: 'done', result: { error_message: 'Unable to parse message' } } }).as('rawError');
    cy.contains('button', 'Run Diagnostics').click();
    cy.wait('@rawError');
    cy.get('[role="alert"]').should('contain.text', 'Unable to parse message');
    cy.get('.dkim-auth-grid').should('not.exist');
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
