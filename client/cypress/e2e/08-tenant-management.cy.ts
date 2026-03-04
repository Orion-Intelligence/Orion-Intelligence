describe('Tenant Complete Flow – Correct Order', () => {
  const tenant = Cypress.env('TENANT_ACCOUNT');
  const tenantSubUser = Cypress.env('TENANT_SUB_USER');

  if (!tenant?.username || !tenant?.email || !tenant?.password || !tenantSubUser?.username || !tenantSubUser?.email || !tenantSubUser?.password) {
    throw new Error('Missing TENANT_ACCOUNT or TENANT_SUB_USER in cypress.config.ts');
  }

  it('Tenant signs up', () => {
    cy.clearAllEmails()
    cy.visit('/login');

    cy.contains('Sign Up').click();

    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="companymail"]').type(tenant.email);
    cy.get('input[name="password"]').type(tenant.password);

    cy.contains('input[type="submit"]', 'Sign Up')
      .should('be.visible')
      .click();

    cy.get('img[alt="Tick"]').should('exist');
    cy.contains('Go to login').click();
    cy.openLastMailAndGetUrl().then(url => {
      cy.visit(url);
    });
  });

  it('Admin verifies all tenants and assigns Enterprise license', () => {
  cy.loginAsAdmin();

  cy.openTenantsPage();
  cy.contains("Not Verified", { timeout: 10000 }).should("exist");
  cy.contains('h1.ui-page-title', 'Tenants').should('be.visible');
  cy.get('tbody tr').its('length').should('be.gte', 1);

  let verifiedCount = 0;

  const approveAllTenants = (tries = 0) => {
    if (tries >= 5) return;

    cy.get('tbody tr').then($rows => {
      const rows = $rows.filter((_: number, row: HTMLElement) => {
        return (
          Cypress.$(row).find('span:contains("Not Verified")').length > 0 &&
          !Cypress.$(row).hasClass('!border-t-0')
        );
      });

      if (rows.length === 0) {
        
        return;
      }

      if (rows.length !== 1) {
        throw new Error(`Expected exactly 1 row, found ${rows.length}`);
      }

      verifiedCount++;

      
      cy.wrap(rows.eq(0)).within(() => {
        cy.get('#edit-tenant').click({ force: true });
      });

      cy.wrap(false).as('changed');

      
      cy.contains('tr', 'Edit Tenant', { timeout: 15000 }).should('be.visible');

      
      cy.contains('tr', 'Edit Tenant')
        .find('button, .ui-button, [role="button"]')
        .contains(/Not Verified/i)
        .then($el => {
          
          const $btn = Cypress.$($el).first();
          if ($btn.text().toLowerCase().includes('not verified')) {
            cy.wrap($btn).click({ force: true });
            cy.wrap(true).as('changed');
          }
        });

      
      cy.contains('tr', 'Edit Tenant')
        .contains('.license-card, .license-btn, .license-label', /Enterprise/i)
        .closest('.license-card, .license-btn')
        .find('input[type="checkbox"], input.license-checkbox')
        .then($cb => {
          if (!$cb.is(':checked')) {
            cy.wrap($cb).check({ force: true });
            cy.wrap(true).as('changed');
          }
        });

      
      cy.get('@changed').then((changed: any) => {
        if (changed) {
          cy.contains('button', 'Save changes', { timeout: 15000 })
            .should('be.visible')
            .click({ force: true });
        }
      });

      
      cy.openTenantsPage();

      cy.get('body').then($b => {
        if ($b.find('.badge-false, span:contains("Not Verified")').length) {
          approveAllTenants(tries + 1);
        }
      });
    });
  };

  approveAllTenants();

  cy.then(() => {
    expect(verifiedCount).to.be.greaterThan(0);
  });

  cy.openTenantsPage();
  cy.logout();
});

const openManageIOCs = () => {
  cy.contains('app-dashboard-sidebar-items div', 'IOC')
    .should('be.visible')
    .click();

  cy.get('input[placeholder="Search IOCs..."]')
    .should('exist');
};

const addIOCValue = (value: string) => {
  cy.get('input[placeholder="Type"]')
    .should('be.visible')
    .clear()
    .type(value);

  cy.contains('button', 'Add')
    .should('be.visible')
    .click();
};


const addIOCForAllTabs = () => {
  const iocValuesByTab: string[][] = [
    ['8.8.8.8', '1.1.1.1', '10.10.10.10'],                                  
    ['example.com', 'malicious-test.com', 'sub.example.org'],                
    ['http://evil.test/path', 'https://phish.test/login', 'https://t.co/x'], 
    ['d41d8cd98f00b204e9800998ecf8427e', '5d41402abc4b2a76b9719d911017c592'],
    [
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',   
      'a54d88e06612d820bc3be72877c74f257b561b19e8f5a0c0b3f3cb0adf3c3f6e'
    ],
  ];
  
};

it('Tenant adds user, IOCs, scans and logs out', () => {
  cy.visit('/login');
  cy.reload();

  cy.get('input[name="username"]').type(tenant.username);
  cy.get('input[name="password"]').type(tenant.password, { log: false });
  cy.contains('Sign In').click();

  
  cy.get('input#company[placeholder="Enter company name"]')
    .should('be.visible')
    .clear()
    .type('orion intelligence');

  cy.contains('button', 'Next')
    .should('be.visible')
    .click();

  cy.contains('button', 'Skip')
    .should('be.visible')
    .click();

  cy.contains('button', 'Confirm')
    .should('be.visible')
    .click();

  
  openManageIOCs();
  addIOCForAllTabs();

  
  cy.contains('Users').click();
  cy.contains('button', 'Add User').click({ force: true });

  cy.get('input[name="username"]').type(tenantSubUser.username);
  cy.get('input[name="email"]').type(tenantSubUser.email);
  cy.get('input[name="password"]').type(tenantSubUser.password, { log: false });

  cy.contains('button', 'Add User')
    .scrollIntoView()
    .click({ force: true });

  cy.logout();
  cy.url().should('include', '/login');
});





  it('Admin logs in again and sets quota to 1', () => {
    cy.loginAsAdmin();

    cy.visit('/dashboard/profile/homepage');
    cy.openTenantsPage();

    cy.contains('table tbody tr', /orion\s*intelligence/i, { timeout: 30000 })
  .find('button#edit-tenant')
  .should('be.visible')
  .click()
    cy.contains('label', 'User Quota')
      .parent()
      .find('input[type="number"]')
      .clear()
      .type('1');

    cy.contains('Save changes').click();
    cy.logout();
  });

  it('Tenant logs in again and sees homepage / paywall behavior', () => {
    cy.visit('/login');

    cy.get('input[name="username"]').type(tenant.username);
    cy.get('input[name="password"]').type(tenant.password, {log: false});
    cy.contains('Sign In').click();

    cy.get('[data-cy="dashboard-main-container"], [data-cy="dashboard-container"], .dashboard_container').should('be.visible');
    cy.contains('app-dashboard-sidebar-items div', 'Homepage').click();
    cy.contains('app-dashboard-sidebar-items div', 'Homepage', { timeout: 20000 })
      .should('be.visible')
      .click({ force: true });

    cy.location('pathname', { timeout: 20000 })
      .should('include', '/dashboard/profile/homepage');
  });
});


after(() => {
  cy.logoutIfLoggedIn();
});
