import {clickSearch, fillVisibleInputByPlaceholder, makeFileInputInteractable} from './controllers/14-scans-management.controller';

describe('Dashboard Sections Test – Stealer Logs', () => {
  const testData = Cypress.env('TEST_DATA') || {};

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('Web Scans – Basic, Port, Repository & SEO', () => {
    cy.visit('/dashboard');
    cy.visit('/dashboard/scanner/basic-scan');
    fillVisibleInputByPlaceholder('Domain', 'https://ucp.edu.pk/');
    clickSearch();
    cy.contains('div', 'Security Posture').should('exist');
    cy.contains('h3', 'Findings').first().click();
    cy.visit('/dashboard/scanner/port-scan');
    fillVisibleInputByPlaceholder('Domain', 'https://ucp.edu.pk/');
    clickSearch();
    cy.contains('div', 'Security Posture').should('exist');
    cy.visit('/dashboard/scanner/repository-scan');
    fillVisibleInputByPlaceholder('Repository', 'https://github.com/juice-shop/juice-shop');
    clickSearch();
    cy.get('app-code-block').should('exist');
    cy.get('button[apptooltip="Download"]:visible').should('be.enabled').click();
    cy.get('button[apptooltip="Print"]:visible').should('be.enabled').click();
    cy.visit('/dashboard/scanner/seo-scan');
    fillVisibleInputByPlaceholder('Domain', 'https://ucp.edu.pk/');
    clickSearch();
    cy.visit('/dashboard/scanner/apk-scan');
    makeFileInputInteractable();
    cy.get('input#fileInput[type="file"]').selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.get('button[aria-label="Download report"]', {timeout: 60000}).should('be.visible').and('be.enabled').scrollIntoView().click();
    cy.get('button[aria-label="Scan another file"]', {timeout: 60000}).should('be.visible').and('be.enabled').scrollIntoView().click();
    makeFileInputInteractable();
    cy.get('input#fileInput[type="file"]').selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
  });

  it('Entity APIs → Email, Social, Wanted, National, Playstore, Software, File, Crypto', () => {
    cy.visit('/dashboard');
    cy.visit('/dashboard/api/email-breach');
    cy.get('input[name="q2"]:visible', {timeout: 20000}).clear().type(testData.scans_email_breach);
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/social-scanner');
    cy.get('input[placeholder="Username"]:visible', {timeout: 20000}).should('be.visible').clear().type(testData.scans_social_username);
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/wanted-list');
    cy.get('input[placeholder="Person Name / Alias"]:visible', {timeout: 20000}).should('be.visible').clear().type(testData.scans_wanted_name);
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/national-identity');
    cy.get('input[placeholder="CNIC / Mobile Number"]:visible', {timeout: 20000}).should('be.visible').clear().type('92301234567');
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/playstore-scanner');
    cy.get('input[placeholder="Package / Playstore URL"]:visible', {timeout: 20000}).should('be.visible').clear().type('https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree');
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/software-scanner');
    cy.get('input[placeholder="Software Name"]:visible', {timeout: 20000}).should('be.visible').clear().type('gta');
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/file-scanner');
    makeFileInputInteractable();
    cy.get('input#fileInput[type="file"]').selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      });
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.get('button[aria-label="Download report"]', {timeout: 60000}).should('be.visible').and('be.enabled').scrollIntoView().click();
    cy.get('button[aria-label="Scan another file"]', {timeout: 60000}).should('be.visible').and('be.enabled').scrollIntoView().click();
    makeFileInputInteractable();
    cy.get('input#fileInput[type="file"]').selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      });
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
    cy.visit('/dashboard/api/crypto-scanner');
    cy.get('input[placeholder="Wallet Address / Transaction Hash"]:visible', {timeout: 20000}).should('be.visible').clear().type('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    clickSearch();
    cy.contains('span', 'success', {timeout: 300000}).should('be.visible');
  });
});
