import { acceptTakedownFromList, assertReportShowsAcceptedTakedown, initiateTakedownFromReport, openCompromisedMonitoringReport, openTakedownReviewList, registerTakedownIntercepts, takedownSelector, stubTakedownReportFlow } from './controllers/20-takedown-requests.controller';
import { loginTenant } from './controllers/10-tenant-management.controller';
import type { CaseAlertTenant } from './model/10-tenant-management.model';

describe('Orion Intelligence - Report Takedown UI Flow', () => {
  after(() => {
    cy.logout();
  });

  it('submits a takedown with an analyst note and reflects accepted status on the report', () => {
    cy.loginAsAdmin();
    stubTakedownReportFlow();

    openCompromisedMonitoringReport();
    initiateTakedownFromReport();
    openTakedownReviewList();
    acceptTakedownFromList();
    assertReportShowsAcceptedTakedown();
  });
});

describe('Report Takedown - Multi-Tenant Permissions', () => {
  let primaryTenant = {} as CaseAlertTenant;
  let subTenant = {} as CaseAlertTenant;

  before(() => {
    cy.env(['PRIMARY_TENANT_ACCOUNT', 'SUB_TENANT_ACCOUNT']).then(({PRIMARY_TENANT_ACCOUNT, SUB_TENANT_ACCOUNT}) => {
      primaryTenant = PRIMARY_TENANT_ACCOUNT as CaseAlertTenant;
      subTenant = SUB_TENANT_ACCOUNT as CaseAlertTenant;
      if (!primaryTenant?.slug || !subTenant?.slug) {
        throw new Error('Missing PRIMARY_TENANT_ACCOUNT or SUB_TENANT_ACCOUNT in cypress.config.ts');
      }
    });
  });

  after(() => {
    cy.logout();
  });
  it('lets a sub-tenant initiate a takedown on a compromised-monitoring report', () => {
    registerTakedownIntercepts();
    loginTenant(subTenant);
    openCompromisedMonitoringReport();
    initiateTakedownFromReport();
    cy.logout();
  });

  it('lets the primary tenant approve the sub-tenant takedown', () => {
    registerTakedownIntercepts('pending');
    loginTenant(primaryTenant);
    openTakedownReviewList();
    cy.get(takedownSelector('takedown-row')).first().within(() => {
      cy.get(takedownSelector('takedown-accept-button')).should('be.visible').and('not.be.disabled');
    });
    acceptTakedownFromList();
    cy.logout();
  });

  it('only lets admin view the accepted takedown, not modify it', () => {
    registerTakedownIntercepts('accepted');
    cy.loginAsAdmin();
    openTakedownReviewList();
    cy.get(takedownSelector('takedown-row')).first().within(() => {
      cy.contains('Takedown reported').should('be.visible');
    });
    cy.get(takedownSelector('takedown-row')).first().then(($row) => {
      const $acceptButton = $row.find(takedownSelector('takedown-accept-button'));
      if ($acceptButton.length) {
        cy.wrap($acceptButton).should('be.disabled');
      }
    });
  });
});
