describe('Homepage – Consolidated Checker Full Flow', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Open consolidated checker and validate all categories', () => {


    cy.visit('/dashboard');


    cy.contains('.sidebar__subitem-content', 'Homepage')
      .should('be.visible')
      .click({ force: true });


    cy.get('[data-cy="dashboard-general-input"]')
      .should('be.visible')
      .click({ force: true })
      .type('{enter}');


    cy.contains('.home-defacement-result__title', 'IP Threat Report')
      .should('be.visible');


    const openCategoryAndReturn = (categoryName: string) => {


      cy.contains('.home-defacement-result__filter-type', categoryName)
        .should('be.visible')
        .click({ force: true });

      cy.go('back');


    };

    openCategoryAndReturn('databases');
    openCategoryAndReturn('hacked');
    openCategoryAndReturn('phishing');
   

  });
});


