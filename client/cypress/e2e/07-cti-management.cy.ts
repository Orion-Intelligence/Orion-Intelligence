describe('Orion Intelligence - CTI Graph Full Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('runs CTI graph scan flows and export/report actions', () => {
    cy.viewport(1440, 900);

    cy.intercept('GET', '**/api/graph*').as('graphQuery');
    cy.intercept('GET', '**/api/social/session/tabs?graph_type=graph*').as('graphSessionTabs');

    cy.visit('/dashboard/ctigraph');

    cy.wait('@graphSessionTabs', { timeout: 30000 });
    cy.wait('@graphQuery', { timeout: 30000 });

    cy.get('body', { timeout: 20000 }).should('not.contain', 'Loading graph styles...');
    cy.get('app-cti-sidebar', { timeout: 20000 }).should('be.visible');
    cy.get('.vis-network canvas', { timeout: 30000 }).should('exist');

    const applyFilters = () => {
      cy.get('app-cti-sidebar').contains('button', 'Apply', { timeout: 20000 }).click({ force: true });
      cy.wait('@graphQuery', { timeout: 30000 });
      cy.get('.vis-network canvas', { timeout: 30000 }).should('exist');
    };

    cy.get('app-cti-sidebar select[name="selectedType"]', { timeout: 20000 })
      .should('be.visible')
      .select('Cluster', { force: true });
    cy.get('app-cti-sidebar select[name="singleInputCluster"]', { timeout: 20000 })
      .should('be.visible')
      .select('All', { force: true });
    cy.get('app-cti-sidebar input[name="maxNodes"]').clear().type('50');
    cy.get('app-cti-sidebar input[name="maxDepth"]').clear().type('2');
    applyFilters();

    cy.get('input[placeholder="Search nodes to highlight..."]', { timeout: 20000 })
      .clear()
      .type('leak');
    cy.contains('button', 'Search').click({ force: true });
    cy.contains('node(s) highlighted', { timeout: 20000 }).should('exist');
    cy.get('input[placeholder="Search nodes to highlight..."]').should('have.value', 'leak');
    cy.get('.vis-network canvas').should('exist');

    cy.get('button[title="Disable Physics Simulation"], button[title="Enable Physics Simulation"]')
      .first()
      .click({ force: true });

    cy.get('button[title="Expand Groups"], button[title="Collapse Groups"]')
      .first()
      .click({ force: true });

    cy.get('app-cti-sidebar select[name="selectedType"]', { timeout: 20000 })
      .should('be.visible')
      .select('Property', { force: true });
    cy.get('app-cti-sidebar select[name="propertyType"]', { timeout: 20000 })
      .should('be.visible')
      .select('All', { force: true });
    cy.get('app-cti-sidebar input[name="propertyValue"]').clear().type('Pakistan');
    applyFilters();

    cy.get('app-cti-sidebar select[name="selectedType"]', { timeout: 20000 })
      .should('be.visible')
      .select('Document', { force: true });
    cy.get('app-cti-sidebar input[name="singleInputDoc"]').clear().type('all');
    applyFilters();

    cy.contains('button', 'Reset').click({ force: true });
    applyFilters();

    cy.get('button[title="List View"]').click({ force: true });
    cy.contains('Document').should('be.visible');
    cy.get('button[title="Graph View"]').click({ force: true });

    cy.get('button[title="Session Menu"]').first().click({ force: true });
    cy.contains('button', 'Export Current Session').click({ force: true });

    cy.get('button[title="Session Menu"]').first().click({ force: true });
    cy.contains('button', 'Export Report').click({ force: true });

    cy.contains('Export CTI Report', { timeout: 10000 }).should('be.visible');
    cy.contains('button', '1. JSON (Raw Graph Data)').click({ force: true });

    cy.get('button[title="Session Menu"]').first().click({ force: true });
    cy.contains('button', 'Export Report').click({ force: true });
    cy.contains('button', '2. PDF Graph Report').click({ force: true });

    cy.get('button[title="Session Menu"]').first().click({ force: true });
    cy.contains('button', 'Export Report').click({ force: true });
    cy.contains('button', '3. PDF Document Report').click({ force: true });

    cy.get('button[title="Session Menu"]').first().click({ force: true });
    cy.contains('button', 'New Session').click({ force: true });
    cy.get('header nav > div').its('length').should('be.greaterThan', 1);
  });
});
