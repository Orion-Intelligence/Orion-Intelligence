import {clickSearch, fillPrimaryScanInput, fillSecondaryScanInput, makeFileInputInteractable} from './controllers/14-scans-management.controller';

describe('Scans Management - Web Scans Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs Basic, Vulnerability, Repository, and SEO scans', () => {
    cy.visit('/dashboard/scanner/network-scan');
    cy.get('[data-testid="network-intel-tab-host-recon"]').should('be.visible');
    cy.get('[data-testid="network-intel-search-input"]').clear().type('ucp.edu.pk{enter}');

    cy.visit('/dashboard/scanner/network-scan');
    cy.get('[data-testid="network-intel-tab-vulnerability-scan"]').should('be.visible').click();
    cy.get('[data-testid="network-intel-search-input"]').clear().type('ucp.edu.pk{enter}');

    cy.visit('/dashboard/scanner/repository-scan');
    fillPrimaryScanInput('https://github.com/juice-shop/juice-shop');
    clickSearch();
    cy.get('[data-testid="scan-download-report"]').filter(':visible').first().should('be.enabled').click();
    cy.get('[data-testid="scan-print-report"]').filter(':visible').first().should('be.enabled').click();

    cy.visit('/dashboard/scanner/seo-scan');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();

  });
});

describe('Scans Management - Entity API Flow', () => {
  let testData: any = {};

  before(() => {
    cy.env(['TEST_DATA']).then(({TEST_DATA}) => {
      testData = TEST_DATA || {};
    });
  });

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs Email, Social, Wanted, National Identity, Playstore, Software, File, Text Analysis, and Crypto scans', () => {
    cy.visit('/dashboard');

    cy.visit('/dashboard/api/email-breach');
    fillSecondaryScanInput(testData.scans_email_breach);
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/social-scanner');
    fillPrimaryScanInput(testData.scans_social_username);
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/wanted-list');
    fillPrimaryScanInput(testData.scans_wanted_name);
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/national-identity');
    fillPrimaryScanInput('92301234567');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/playstore-scanner');
    fillPrimaryScanInput('https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/software-scanner');
    fillPrimaryScanInput('gta');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/file-scanner');
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile({
      contents: 'cypress/fixtures/resume-sample.pdf',
      fileName: 'resume-sample.pdf',
      mimeType: 'application/pdf'
    });
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');
    cy.get('[data-testid="scan-download-report"]').filter(':visible').first().should('be.visible').and('be.enabled').scrollIntoView().click();
    cy.get('[data-testid="scan-another-file"]').filter(':visible').first().should('be.visible').and('be.enabled').scrollIntoView().click();
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile({
      contents: 'cypress/fixtures/resume-sample.pdf',
      fileName: 'resume-sample.pdf',
      mimeType: 'application/pdf'
    });
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/text-analysis');
    cy.get('[data-testid="text-analysis-input"]')
      .filter(':visible')
      .first()
      .should('be.visible')
      .type('Congratulations! Verify your details at https://secure-login-update.example.com/verify');
    cy.get('[data-testid="text-analysis-submit"]').filter(':visible').first().should('be.enabled').click();
    cy.get('[data-testid="text-analysis-table"]').should('be.visible');
    cy.get('[data-testid="text-analysis-primary-detection"]').should('contain.text', 'Spam and phishing detected');

    cy.visit('/dashboard/api/crypto-scanner');
    fillPrimaryScanInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]').filter(':visible').first().should('be.visible');
  });
});
