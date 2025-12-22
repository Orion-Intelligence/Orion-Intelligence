// 03-screenshots.cy.ts
describe('Orion Intelligence – GI Data Sections Screenshots', () => {

  before(() => {
    // Ensure user is logged in
    cy.session('admin-login', () => {
      cy.visit('https://try.orionintelligence.org/login');
      cy.get('input[name="username"]').type('admin');
      cy.get('input[name="password"]').type(
        'cmUFD@CRw(MpYEj!)^rBhSAxk+HXWbu&#eGaq#ePysJNtgnV91',
        { log: false }
      );
      cy.get('input.login-button').click();
      cy.get('.dashboard_container').should('be.visible');
    });
  });

  it('Take screenshots for all General Intelligence sections', () => {
    // Go to System Settings → General Intelligence
    cy.visit('/dashboard'); // make sure we are on dashboard
    cy.contains('.sidebar__subitem-content', 'System Settings').click();
    cy.get('div.sidebar__item-dropdown').contains('General Intelligence').click({ force: true });

    // Screenshot for GI dropdown opened
    cy.screenshot('15-general-intelligence-dropdown-opened');

    const dataSections = [
      'Data Breach','Discussion','Defacement','Social','Exploit','Feed',
      'Stealer logs','Web Scans','Live APIs','Dump','Tenant'
    ];

    dataSections.forEach((section, index) => {
      cy.get('div.sidebar__item-dropdown')
        .contains(section)
        .scrollIntoView()
        .click({ force: true });

      cy.get('ul.sidebar__subitems .sidebar__subitems-container')
        .should('be.visible');

      // Screenshot for each section
      cy.screenshot(`16-${section.replace(/\s+/g, '-').toLowerCase()}`);
    });

    // Optional: Open CTI Graph at the end
    cy.get('a.sidebar__item-dropdown-hotlink')
      .contains('CTI Graph')
      .scrollIntoView()
      .should('be.visible')
      .invoke('removeAttr', 'target') // open in same tab for Cypress
      .click({ force: true });

    cy.get('body').should('contain.text', 'CTI Graph');
    cy.screenshot('28-ctigraph-page');
  });

});
