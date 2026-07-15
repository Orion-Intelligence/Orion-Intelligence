import { acceptTakedownFromList, assertReportShowsAcceptedTakedown, initiateTakedownFromReport, openCompromisedMonitoringReport, openTakedownReviewList, stubTakedownReportFlow } from './controllers/20-takedown-requests.controller';

describe('Orion Intelligence - Report Takedown UI Flow', () => {
  after(() => {
    cy.logout();
  });

  it('initiates takedown from a compromised monitoring report and reflects accepted status on the report', () => {
    cy.loginAsAdmin();
    stubTakedownReportFlow();

    openCompromisedMonitoringReport();
    initiateTakedownFromReport();
    openTakedownReviewList();
    acceptTakedownFromList();
    assertReportShowsAcceptedTakedown();
  });
});
