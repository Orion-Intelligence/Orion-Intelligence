const TEN_MIN = 600000;

import {
  clickSearch,
  fillPrimaryScanInput,
  fillSecondaryScanInput,
  makeFileInputInteractable
} from './controllers/14-scans-management.controller';

describe('Scans Management - Web Scans Flow', () => {
  beforeEach(() => {
    cy.loginAsAdminLive();
  });

  after(() => {
    cy.logout();
  });

  it('runs Basic, Port, Repository, SEO, and APK scans on live website', () => {
    cy.visit('https://try.orionintelligence.org/dashboard/scanner/basic-scan?page=1');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();

    cy.get('[data-testid="scan-security-posture"]', { timeout: TEN_MIN }).should('exist');
    cy.get('[data-testid="scan-findings-title"]', { timeout: TEN_MIN }).first().click();

    cy.visit('https://try.orionintelligence.org/dashboard/scanner/port-scan?page=1');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();

    cy.get('[data-testid="scan-security-posture"]', { timeout: TEN_MIN }).should('exist');

    cy.visit('https://try.orionintelligence.org/dashboard/scanner/repository-scan?page=1');
    fillPrimaryScanInput('https://github.com/juice-shop/juice-shop');
    clickSearch();

    cy.get('[data-testid="scan-download-report"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.enabled')
      .click();

    cy.get('[data-testid="scan-print-report"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.enabled')
      .click();

    cy.visit('https://try.orionintelligence.org/dashboard/scanner/seo-scan?page=1');
    fillPrimaryScanInput('https://ucp.edu.pk/');
    clickSearch();



    cy.visit('https://try.orionintelligence.org/dashboard/scanner/apk-scan?page=1');
    makeFileInputInteractable();

    cy.get('[data-testid="scan-file-input"]', { timeout: TEN_MIN })
      .first()
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.visible');

    cy.get('[data-testid="scan-download-report"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.visible')
      .and('be.enabled')
      .scrollIntoView()
      .click();

    cy.get('[data-testid="scan-another-file"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.visible')
      .and('be.enabled')
      .scrollIntoView()
      .click();

    makeFileInputInteractable();

    cy.get('[data-testid="scan-file-input"]', { timeout: TEN_MIN })
      .first()
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk');

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.visible');
  });
});

describe('Scans Management - Entity API Flow', () => {
  let testData: any = {};

  before(() => {
    cy.env(['TEST_DATA']).then(({ TEST_DATA }) => {
      testData = TEST_DATA || {};
    });
  });

  beforeEach(() => {
    cy.loginAsAdminLive();
  });

  after(() => {
    cy.logout();
  });

  it('runs all API scans on live website', () => {
    /*cy.visit('https://try.orionintelligence.org/dashboard/api/email-breach?page=1');
    fillSecondaryScanInput(testData.scans_email_breach);
    clickSearch();

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .filter(':visible')
      .first()
      .should('be.visible');*/

    cy.visit('https://try.orionintelligence.org/dashboard/api/social-scanner?page=1');
    fillPrimaryScanInput(testData.scans_social_username);
    clickSearch();

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');

    cy.visit('https://try.orionintelligence.org/dashboard/api/wanted-list?page=1');
    fillPrimaryScanInput(testData.scans_wanted_name);
    clickSearch();

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');

    cy.visit('https://try.orionintelligence.org/dashboard/api/national-identity?page=1');
    fillPrimaryScanInput('92301234567');
    clickSearch();

    /*cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');*/

    cy.visit('https://try.orionintelligence.org/dashboard/api/playstore-scanner?page=1');
    fillPrimaryScanInput('https://play.google.com/store/apps/details?id=com.jrzheng.supervpnfree');
    clickSearch();

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');

    cy.visit('https://try.orionintelligence.org/dashboard/api/software-scanner?page=1');
    fillPrimaryScanInput('gta');
    clickSearch();

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');

    cy.visit('https://try.orionintelligence.org/dashboard/api/file-scanner?page=1');
    makeFileInputInteractable();

    cy.get('[data-testid="scan-file-input"]', { timeout: TEN_MIN })
      .first()
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      });

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');

    cy.get('[data-testid="scan-download-report"]', { timeout: TEN_MIN })
      .should('be.visible')
      .and('be.enabled')
      .click();

    cy.get('[data-testid="scan-another-file"]', { timeout: TEN_MIN })
      .should('be.visible')
      .and('be.enabled')
      .click();

    makeFileInputInteractable();

    cy.get('[data-testid="scan-file-input"]', { timeout: TEN_MIN })
      .first()
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      });

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');

    cy.visit('https://try.orionintelligence.org/dashboard/api/crypto-scanner?page=1');
    fillPrimaryScanInput('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    clickSearch();

    cy.get('[data-testid="scan-success-badge"]', { timeout: TEN_MIN })
      .should('be.visible');
  });
});
