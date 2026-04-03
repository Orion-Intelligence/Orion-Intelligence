import { addUser, loginAsUser, ManagedUser } from './controllers/05-user-management.controller';

describe('Orion Intelligence - Enterprise Demo Tour', () => {
  const enterpriseUser: ManagedUser = {
    username: `enterprise_tour1`,
    email: `enterprise_tour@example.com`,
    password: '1qaz!QAZ',
    role: 'Analyst',
    licenses: ['Enterprise']
  };

  const waitForTourStep = (stepNumber: number, totalSteps = 6) => {
    cy.get('[data-testid="demo-tour-tooltip"]').should('be.visible');
    cy.get('[data-testid="demo-tour-step"]').should('contain', `Step ${stepNumber} / ${totalSteps}`);
  };

  before(() => {
    cy.loginAsAdmin();
    cy.intercept('POST', '**/api/users').as('usersApi');
    cy.visit('/dashboard/profile/homepage');
    cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').scrollIntoView().click();
    cy.get('[data-testid="sidebar-subitem-profile-users"]').should('be.visible').scrollIntoView().click();
    cy.url().should('include', '/dashboard/profile/users');
    cy.wait('@usersApi');
    addUser(enterpriseUser);
    cy.logout();
  });

  beforeEach(() => {
    cy.intercept('POST', '**/api/get/tenant/node', (req) => {
      req.continue((res) => {
        if (res.body?.user) {
          res.body.user.demo_tour = false;
          res.body.user.license = ['enterprise'];
          res.body.user.role = 'Analyst';
        }
      });
    }).as('enterpriseTenantNode');
  });

  after(() => {
    cy.logout();
  });

  it('blocks page interaction during the tour and only allows next and skip', () => {
    cy.intercept('POST', '**/api/update/current/user', (req) => {
      req.reply({ statusCode: 200, body: { message: 'updated' } });
    }).as('updateCurrentUser');

    loginAsUser(enterpriseUser.username, enterpriseUser.password);
    cy.wait('@enterpriseTenantNode');
    waitForTourStep(1);

    cy.get('html').should('have.class', 'no-scroll');
    cy.get('body').should('have.class', 'no-scroll');

    cy.window().then((win) => {
      const overlay = win.document.querySelector('[data-testid="demo-tour-overlay"]') as SVGElement | null;
      const profileButton = win.document.querySelector('[data-testid="sidebar-group-profile"]') as HTMLElement | null;

      expect(overlay, 'demo tour overlay').to.not.be.null;
      expect(profileButton, 'profile sidebar button').to.not.be.null;

      const clickEvent = new win.MouseEvent('click', { bubbles: true, cancelable: true });
      const clickResult = profileButton!.dispatchEvent(clickEvent);
      expect(clickResult).to.eq(false);
      expect(clickEvent.defaultPrevented).to.eq(true);
    });

    cy.get('[data-testid="demo-tour-next"]').should('be.visible').click();
    waitForTourStep(2);

    cy.get('[data-testid="demo-tour-skip"]').should('be.visible').click();
    cy.wait('@updateCurrentUser').then(({ request }) => {
      expect(request.body.demo_tour).to.eq(true);
      expect(request.body.username).to.eq(enterpriseUser.username);
    });
    cy.get('[data-testid="demo-tour-tooltip"]').should('not.exist');
  });

  it('marks demo_tour true after the enterprise tour completes', () => {
    cy.intercept('POST', '**/api/update/current/user', (req) => {
      req.reply({ statusCode: 200, body: { message: 'updated' } });
    }).as('updateCurrentUser');

    loginAsUser(enterpriseUser.username, enterpriseUser.password);
    cy.wait('@enterpriseTenantNode');
    waitForTourStep(1);

    for (let stepNumber = 1; stepNumber <= 6; stepNumber += 1) {
      cy.get('[data-testid="demo-tour-next"]').should('be.visible').click();

      if (stepNumber < 6) {
        waitForTourStep(stepNumber + 1);
      }
    }

    cy.wait('@updateCurrentUser').then(({ request }) => {
      expect(request.body.demo_tour).to.eq(true);
      expect(request.body.username).to.eq(enterpriseUser.username);
    });
    cy.get('[data-testid="demo-tour-tooltip"]').should('not.exist');
  });
});
