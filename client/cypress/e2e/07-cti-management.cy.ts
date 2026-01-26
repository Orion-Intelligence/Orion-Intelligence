describe('Orion Intelligence – CTI Graph Basic Flow', () => {
  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('CTI Management - Graph interactions', () => {
    cy.visit('dashboard/ctigraph');

    cy.get('div.position-fixed', { timeout: 20000 }).should('be.visible');
    cy.get('.graph_container.d-none.d-md-block', { timeout: 20000 }).should('exist');
    cy.get('.vis-network canvas', { timeout: 20000 }).should('exist');

    cy.contains('.graph-filters_details', 'Toggle Physics', { timeout: 20000 }).click();
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.contains('.graph-filters_details', 'Expand', { timeout: 20000 }).click();
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.contains('.graph-filters_details-header', 'Indicators', { timeout: 20000 }).click();
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.contains('.graph-filters_details-header', 'Preferences', { timeout: 20000 }).click();
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('#dropdownType', { timeout: 20000 }).click();
    cy.get('ul[aria-labelledby="dropdownType"] a.dropdown-item').contains(/^Cluster$/i).click({ force: true });
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('#dropdownCluster', { timeout: 20000 }).click();
    cy.get('ul[aria-labelledby="dropdownCluster"] a.dropdown-item').eq(1).click({ force: true });
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('#dropdownType', { timeout: 20000 }).click();
    cy.get('ul[aria-labelledby="dropdownType"] a.dropdown-item').contains(/^Property$/i).click({ force: true });
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('#dropdownProperty', { timeout: 20000 }).scrollIntoView().click({ force: true });
    cy.get('ul[aria-labelledby="dropdownProperty"] a.dropdown-item').contains(/^Country$/i).scrollIntoView().click({ force: true });
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('input[name="propertyValue"]', { timeout: 20000 }).clear().type('Pakistan');
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('input[name="maxNodes"]', { timeout: 20000 }).clear().type('25');
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('input[name="maxDepth"]', { timeout: 20000 }).clear().type('3');
    cy.contains('button.sidebar_submit-button', /^Apply$/, { timeout: 20000 }).click();

    cy.get('button.sidebar_submit-button').filter('.btn-secondary').last().click({ force: true });
    cy.get('.vis-network canvas', { timeout: 20000 }).should('exist');
  });
});
