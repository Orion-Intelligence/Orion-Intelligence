describe('Dashboard Sections Test – Stealer Logs', () => {

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('Web Scans – Basic, Port, Repository & SEO', () => {

    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Web Scans')
      .should('be.visible')
      .click();

    cy.contains('.sidebar__subitem-content', 'Basic Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.get('.search__result-detail')
      .should('exist');

    cy.get('.search__result__section__heading .toggle-btn')
      .first()
      .click();

    cy.contains('.sidebar__subitem-content', 'Port Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.get('.search__result-detail')
      .should('exist');

    cy.contains('.sidebar__subitem-content', 'Repository Scan')
      .click();

    cy.get('input[placeholder="Repository"]')
      .clear()
      .type('https://github.com/juice-shop/juice-shop');

    cy.contains('button', 'Search')
      .click();

    cy.get('app-code-block')
      .should('exist');

    cy.get('button[ng-reflect-tooltip-text="Download"]')
      .click();

    cy.get('button[ng-reflect-tooltip-text="Print"]')
      .click();

    cy.contains('.sidebar__subitem-content', 'SEO Scan')
      .click();

    cy.get('input[placeholder="Domain"]')
      .clear()
      .type('https://ucp.edu.pk/');

    cy.contains('button', 'Search')
      .click();

    cy.contains('.sidebar__subitem-content', 'APK Scan')
      .should('be.visible')
      .click();

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk', { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.get('button[aria-label="Download report"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('button[aria-label="Scan another file"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile('cypress/fixtures/1MB_1.0_APKPure.apk', { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

  });

  it('Live APIs → Email Breach, Social Scanner, Playstore Scanner, Software Scanner', () => {

    cy.visit('/dashboard');

    cy.contains('.sidebar__item-dropdown', 'Live APIs')
      .should('be.visible')
      .click();

        cy.contains('.sidebar__subitem-content', 'File Scanner')
      .should('be.visible')
      .click();

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.get('button[aria-label="Download report"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('button[aria-label="Scan another file"]', { timeout: 60000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    cy.get('input[type="file"]')
      .should('exist')
      .selectFile({
        contents: 'cypress/fixtures/resume-sample.pdf',
        fileName: 'resume-sample.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

    cy.contains('span.ioc-report-pill.status-success', 'success', { timeout: 300000 })
      .should('be.visible');

    cy.contains('.sidebar__subitem-content', 'Email Breach')
      .click();

    cy.get('input[name="q2"]')
      .clear()
      .type('msmannan00@gmail.com');

    cy.get('.dash-search-button')
      .click();

    cy.contains('.sidebar__subitem-content', 'Social Scanner')
      .click();

    cy.get('input[placeholder="Username"]')
      .should('be.visible')
      .clear({ force: true })
      .type('Usama', { force: true });

    cy.get('.dash-search-button')
      .click();

    // cy.get('.dashboard-result-card .card-subtitle a')
    //   .should('exist');
    //
    // cy.contains('.sidebar__subitem-content', 'Playstore Scanner')
    //   .click();
    //
    // cy.get('input[placeholder="Package / Playstore URL"]')
    //   .clear()
    //   .type('https://play.google.com/store/apps/details?id=com.supercell.clashofclans&hl=en');
    //
    // cy.get('.dash-search-button')
    //   .click();
    //
    // cy.get('.dashboard-result-card .card-subtitle a')
    //   .should('exist');
    //
    // cy.contains('.sidebar__subitem-content', 'Software Scanner')
    //   .click();
    //
    // cy.get('input[placeholder="Software Name"]')
    //   .should('be.visible')
    //   .clear({ force: true })
    //   .type('GTA V', { force: true });
    //
    // cy.get('.dash-search-button')
    //   .click();

  });
  //
  // it('Dashboard → Global Search → Consolidated Scan → Ranked → IOCs', () => {
  //
  //   cy.visit('/dashboard');
  //
  //   cy.get('[data-cy="dashboard-result-container-input"]')
  //     .should('exist')
  //     .should('be.visible')
  //     .clear()
  //     .type('ucp.edu.pk{enter}');
  //
  //   cy.contains(
  //     '.consolidated-scans-title',
  //     'Threats Scans Report: ucp.edu.pk'
  //   ).should('exist');
  //
  //   cy.contains('button', 'Hide details')
  //     .should('be.visible')
  //     .click();
  //
  //   cy.contains('.card_header span', 'Keyword insights')
  //     .should('exist');
  //
  //   cy.contains('.card_header span', 'Results General Coverage')
  //     .should('exist');
  //
  //   cy.contains('.card_header', 'Keyword insights')
  //     .find('.toggle-btn')
  //     .click();
  //
  //   cy.contains('.card_header', 'Results General Coverage')
  //     .find('.toggle-btn')
  //     .click();
  //
  //   cy.contains('a.nav-link', 'IOCs')
  //     .should('be.visible')
  //     .click();
  // });


  // it('Crypto Scanner – Comprehensive Wallet & Transaction Analysis', () => {
  //
  //   cy.visit('/dashboard');
  //
  //   cy.contains('.sidebar__item-dropdown', 'Live APIs')
  //     .should('be.visible')
  //     .click();
  //
  //   cy.contains('.sidebar__subitem-content', 'Crypto Scanner')
  //     .should('be.visible')
  //     .click();
  //
  //
  //   cy.wait(1500);
  //
  //
  //   cy.get('input[placeholder="Wallet Address / Transaction Hash"]')
  //     .should('be.visible')
  //     .clear({ force: true })
  //     .type('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', { force: true });
  //
  //   cy.get('.dash-search-button')
  //     .should('not.be.disabled')
  //     .click();
  //
  //
  //   cy.get('.ioc-report-hero', { timeout: 120000 })
  //     .should('be.visible');
  //
  //   cy.contains('span.ioc-report-pill', 'success')
  //     .should('exist');
  //
  //   cy.get('.ioc-report-finding-value.mono')
  //     .contains('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')
  //     .should('exist');
  //
  //
  //   cy.contains('.ioc-report-finding-desc', 'Confirmed Balance')
  //     .should('exist')
  //     .parent()
  //     .find('.ioc-report-finding-value')
  //     .should('exist')
  //     .and('not.be.empty');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Unconfirmed Balance')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Total Transactions')
  //     .should('exist')
  //     .parent()
  //     .find('.ioc-report-finding-value')
  //     .should('not.contain', 'not available');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Received')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Sent')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Total Received')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Total Sent')
  //     .should('exist');
  //
  //
  //   cy.contains('.ioc-report-finding-desc', 'First Seen')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Last Seen')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Avg Transaction Value')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Is Active')
  //     .should('exist');
  //
  //
  //   cy.get('body').then($body => {
  //     if ($body.find('.ioc-report-category-name:contains("Recent Transactions")').length > 0) {
  //
  //       cy.contains('.ioc-report-category-name', 'Recent Transactions')
  //         .should('be.visible');
  //
  //       cy.contains('.ioc-report-category-name', 'Recent Transactions')
  //         .parent()
  //         .find('.ioc-report-category-count')
  //         .should('contain', 'TX');
  //
  //
  //       cy.contains('.ioc-report-category-name', 'Recent Transactions')
  //         .parent()
  //         .parent()
  //         .find('.ioc-report-finding')
  //         .first()
  //         .should('have.css', 'cursor', 'pointer')
  //         .click();
  //
  //
  //       cy.contains('.ioc-report-finding-desc', 'TXID', { timeout: 60000 })
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Network')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Confirmed')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Block Height')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Confirmations')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Total Input (BTC)')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Total Output (BTC)')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Fee (BTC)')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Size')
  //         .should('exist');
  //
  //       cy.contains('.ioc-report-finding-desc', 'Weight')
  //         .should('exist');
  //
  //
  //       cy.get('body').then($txBody => {
  //         if ($txBody.find('.ioc-report-category-name:contains("Inputs")').length > 0) {
  //           cy.contains('.ioc-report-category-name', 'Inputs')
  //             .should('be.visible');
  //
  //           cy.contains('.ioc-report-category-name', 'Inputs')
  //             .parent()
  //             .find('.ioc-report-category-count')
  //             .should('contain', 'Inputs');
  //
  //
  //           cy.contains('.ioc-report-category-name', 'Inputs')
  //             .parent()
  //             .parent()
  //             .find('.ioc-report-finding')
  //             .first()
  //             .should('have.css', 'cursor', 'pointer')
  //             .click();
  //
  //
  //           cy.contains('.ioc-report-finding-desc', 'Wallet Address', { timeout: 60000 })
  //             .should('exist');
  //
  //
  //           cy.contains('.ioc-report-finding-desc', 'Confirmed Balance')
  //             .should('exist');
  //
  //
  //           cy.contains('button.ioc-report-pill', 'back')
  //             .should('be.visible')
  //             .click();
  //         }
  //
  //
  //         if ($txBody.find('.ioc-report-category-name:contains("Outputs")').length > 0) {
  //           cy.contains('.ioc-report-category-name', 'Outputs')
  //             .should('be.visible');
  //
  //           cy.contains('.ioc-report-category-name', 'Outputs')
  //             .parent()
  //             .find('.ioc-report-category-count')
  //             .should('contain', 'Outputs');
  //
  //
  //           cy.contains('.ioc-report-category-name', 'Outputs')
  //             .parent()
  //             .parent()
  //             .find('.ioc-report-finding-desc')
  //             .first()
  //             .should('contain', 'BTC');
  //         }
  //       });
  //
  //
  //       cy.contains('button.ioc-report-pill', 'back')
  //         .should('be.visible')
  //         .click();
  //
  //
  //       cy.contains('.ioc-report-finding-desc', 'Wallet Address', { timeout: 30000 })
  //         .parent()
  //         .find('.ioc-report-finding-value.mono')
  //         .should('contain', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
  //     }
  //   });
  //
  //
  //   cy.get('input[placeholder="Wallet Address / Transaction Hash"]')
  //     .clear({ force: true })
  //     .type('invalid-wallet-address-123', { force: true });
  //
  //   cy.get('.dash-search-button')
  //     .should('be.disabled');
  //
  //
  //   cy.get('input[placeholder="Wallet Address / Transaction Hash"]')
  //     .clear({ force: true })
  //     .type('685b826d9726bcb2e287abb47a24f575aefe6fec7ccb2fa6304ebc11ea2b0842', { force: true });
  //
  //   cy.get('.dash-search-button')
  //     .should('not.be.disabled')
  //     .click();
  //
  //   cy.get('.ioc-report-hero', { timeout: 120000 })
  //     .should('be.visible');
  //
  //   cy.contains('.ioc-report-finding-desc', 'TXID')
  //     .parent()
  //     .find('.ioc-report-finding-value.mono')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Network')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Confirmed')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Block Height')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Confirmations')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Total Input (BTC)')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Total Output (BTC)')
  //     .should('exist');
  //
  //   cy.contains('.ioc-report-finding-desc', 'Fee (BTC)')
  //     .should('exist');
  //
  //   cy.get('.ioc-report-category-name')
  //     .filter(':contains("Inputs"), :contains("Outputs")')
  //     .should('have.length.greaterThan', 0);
  //
  //   cy.get('body').then($body => {
  //     if ($body.find('.ioc-report-category-name:contains("Outputs")').length > 0) {
  //       cy.contains('.ioc-report-category-name', 'Outputs')
  //         .parent()
  //         .parent()
  //         .find('.ioc-report-finding')
  //         .first()
  //         .click();
  //
  //       cy.contains('.ioc-report-finding-desc', 'Wallet Address', { timeout: 60000 })
  //         .should('exist');
  //     }
  //   });
  //
  // });


});



