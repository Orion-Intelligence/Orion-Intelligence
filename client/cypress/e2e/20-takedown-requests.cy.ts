import { acceptTakedownFromList, assertReportShowsAcceptedTakedown, initiateTakedownFromReport, openCompromisedMonitoringReport, openTakedownReviewList, stubTakedownReportFlow } from './controllers/20-takedown-requests.controller';

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
