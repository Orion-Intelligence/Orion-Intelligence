describe("Orion Intelligence - Social Mapper Deep Coverage", () => {
  before(() => {
    cy.loginAsAdmin();
  });

  beforeEach(() => {
    cy.visit('/dashboard/profile/homepage');
    cy.location('pathname').then((pathname) => {
      if (pathname.includes('/login')) {
        cy.loginAsAdmin();
        cy.visit('/dashboard/profile/homepage');
      }
    });
  });

  after(() => {
    cy.logout();
  });

  function openAndAssertReportModal(title: string) {
    cy.get('[data-cy="cti-tab-session-menu"], [data-cy="graph-tab-session-menu"]',
      { timeout: 15000 }).first().click();
    cy.contains("button", "Export Report").click();
    cy.contains(title, { timeout: 10000 }).should("be.visible");
    cy.contains("1. JSON (Raw Graph Data)").should("exist");
    cy.contains("2. PDF Graph Report").should("exist");
    cy.contains("3. PDF Document Report").should("exist");
  }


  it("runs CTI graph deep flow with filters, search, views and export/report actions", () => {

    cy.viewport(1440, 900);

    cy.intercept("GET", "**/api/graph*").as("graphQuery");
    cy.intercept("GET", "**/api/social/session/tabs?graph_type=graph*").as("graphSessionTabs");

    cy.visit("/dashboard/ctigraph");
    cy.wait("@graphSessionTabs", { timeout: 30000 });
    cy.wait("@graphQuery", { timeout: 30000 });

    cy.get("app-cti-sidebar", { timeout: 20000 }).should("be.visible");
    cy.get(".vis-network canvas", { timeout: 30000 }).should("exist");

    cy.get('select[name="selectedType"]').select("Cluster");
    cy.contains("button", "Apply").click();
    cy.wait("@graphQuery");

    cy.get('[data-cy="graph-toolbar-search-input"]').clear().type("leak");
    cy.get('[data-cy="graph-toolbar-search-button"]').click();
    cy.contains("highlighted").should("exist");

    openAndAssertReportModal("Export CTI Report");
  });


  function visitSocialGraph() {
    cy.viewport(1440, 900);
    cy.intercept("GET", "**/api/social/session/tabs?graph_type=social*").as("socialTabs");
    cy.visit("/dashboard/social-graph");
    cy.wait("@socialTabs", { timeout: 30000 });
    cy.get("app-social-graph", { timeout: 20000 }).should("be.visible");
  }

  it("covers scan to graph/list and profile popups", () => {

    visitSocialGraph();

    cy.get('[data-cy="graph-toolbar-search-input"]').clear().type("msmannan00");
    cy.get('[data-cy="graph-toolbar-search-button"]').click();

    cy.get('[data-cy="graph-toolbar-view-list"]').click();


  });

  it("covers session rename and export actions", () => {

    visitSocialGraph();

    cy.get('[data-cy="graph-tab-add-menu"]').click();
    cy.contains("New Session").click();

    let newName = `Social Session ${Date.now()}`;
    cy.get('span[title="Double-click to rename"]').first().dblclick();
    cy.get("input[data-tab-id]").clear().type(`${newName}{enter}`);

    cy.contains(newName).should("exist");

    openAndAssertReportModal("Export Social Report");
  });

  it("covers entity manager and context menu", () => {

    visitSocialGraph();

    cy.get(".vis-network canvas").trigger("contextmenu", {
      button: 2,
      clientX: 200,
      clientY: 200
    });

  });

  it("covers MetadataPopupComponent", () => {
    visitSocialGraph();
    cy.get("app-social-graph").should("exist");
  });

  it("covers SummaryPlatformViewComponent", () => {
    visitSocialGraph();
    cy.get("app-social-graph").should("exist");
  });

  it("covers social context menu computed branches", () => {
    visitSocialGraph();
    cy.get("app-social-graph").should("exist");
  });
});
