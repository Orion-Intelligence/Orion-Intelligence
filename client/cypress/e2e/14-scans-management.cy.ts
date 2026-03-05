import {clickSearch, fillPrimaryScanInput, fillSecondaryScanInput, makeFileInputInteractable} from './controllers/14-scans-management.controller';

describe('Scans Management - Web Scans Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs Basic, Port, Repository, SEO, and APK scans', () => {
    cy.visit('/dashboard/scanner/basic-scan');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();
    cy.get('[data-testid="scan-security-posture"]').should('exist');
    cy.get('[data-testid="scan-findings-title"]').first().click();

    cy.visit('/dashboard/scanner/port-scan');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();
    cy.get('[data-testid="scan-security-posture"]').should('exist');

    cy.visit('/dashboard/scanner/repository-scan');
    fillPrimaryScanInput('https://github.com/juice-shop/juice-shop');
    clickSearch();
    cy.get('[data-testid="scan-download-report"]').filter(':visible').first().should('be.enabled').click();
    cy.get('[data-testid="scan-print-report"]').filter(':visible').first().should('be.enabled').click();

    cy.visit('/dashboard/scanner/seo-scan');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();

    cy.visit('/dashboard/scanner/apk-scan');
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');
    cy.get('[data-testid="scan-download-report"]', {timeout: 60000}).filter(':visible').first().should('be.visible').and('be.enabled').scrollIntoView().click();
    cy.get('[data-testid="scan-another-file"]', {timeout: 60000}).filter(':visible').first().should('be.visible').and('be.enabled').scrollIntoView().click();
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');
  });
});

describe('Scans Management - Entity API Flow', () => {
  const testData = Cypress.env('TEST_DATA') || {};

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('runs Email, Social, Wanted, National Identity, Playstore, Software, File, and Crypto scans', () => {
    cy.visit('/dashboard');

    cy.visit('/dashboard/api/email-breach');
    fillSecondaryScanInput(testData.scans_email_breach);
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/social-scanner');
    fillPrimaryScanInput(testData.scans_social_username);
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/wanted-list');
    fillPrimaryScanInput(testData.scans_wanted_name);
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/national-identity');
    fillPrimaryScanInput('92301234567');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/playstore-scanner');
    fillPrimaryScanInput('https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/software-scanner');
    fillPrimaryScanInput('gta');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/file-scanner');
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile({
      contents: 'cypress/fixtures/resume-sample.pdf',
      fileName: 'resume-sample.pdf',
      mimeType: 'application/pdf'
    });
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');
    cy.get('[data-testid="scan-download-report"]', {timeout: 60000}).filter(':visible').first().should('be.visible').and('be.enabled').scrollIntoView().click();
    cy.get('[data-testid="scan-another-file"]', {timeout: 60000}).filter(':visible').first().should('be.visible').and('be.enabled').scrollIntoView().click();
    makeFileInputInteractable();
    cy.get('[data-testid="scan-file-input"]').first().selectFile({
      contents: 'cypress/fixtures/resume-sample.pdf',
      fileName: 'resume-sample.pdf',
      mimeType: 'application/pdf'
    });
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');

    cy.visit('/dashboard/api/crypto-scanner');
    fillPrimaryScanInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    clickSearch();
    cy.get('[data-testid="scan-success-badge"]', {timeout: 300000}).filter(':visible').first().should('be.visible');
  });
});
