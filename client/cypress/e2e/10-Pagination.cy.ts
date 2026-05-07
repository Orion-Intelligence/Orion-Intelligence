describe('Dashboard – General Intelligence – Tabs & Pagination', () => {
  after(() => {
    cy.logout();
  });

  const TABS = [
    'All',
    'General'
  ];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.get('[data-testid="sidebar-group-strategic"]').should('exist');
  });

  it('General Intelligence – tabs load & pagination', () => {
    cy.get('[data-testid="sidebar-group-strategic"]').should('be.visible').click();
    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);
      cy.get('tr[id^="item-"], [data-testid="result-card"]').should('exist');
      cy.get('body').scrollTo('bottom', {
        ensureScrollable: false
      });
      cy.get('[data-testid="pagination-root"]').should('exist').scrollIntoView();

      cy.get('[data-testid="pagination-root"]', { timeout: 120000 }).scrollIntoView().should('be.visible');
      cy.get('[data-testid="pagination-next"]').filter(':visible').scrollIntoView().not(':disabled').then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();
            cy.get('tr[id^="item-"], [data-testid="result-card"]').should('exist');
          }
        });
    });
  });
});

describe('Data Breach – Tabs & Pagination', () => {
  after(() => {
    cy.logout();
  });

  const TABS = ['All', 'Tracking'];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.get('[data-testid="sidebar-group-breach"]').should('exist');
  });

  it('Data Breach – tabs load & pagination', () => {
    cy.get('[data-testid="sidebar-group-breach"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="sidebar-group-breach"]').as('dataBreachTabs');
    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);
      cy.get(`[data-testid="sidebar-subitem-breach-${tab.toLowerCase()}"]`).should('be.visible').click();
      cy.get('tr[id^="item-"], [data-testid="result-card"]').should('exist');
      cy.get('[data-testid="pagination-root"]').should('exist');

      cy.get('[data-testid="pagination-root"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="pagination-next"]').filter(':visible').scrollIntoView().not(':disabled').then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();
            cy.get('tr[id^="item-"], [data-testid="result-card"]').should('exist');
          }
        });
    });
  });
});

describe('Defacement – Tabs & Pagination', () => {
  after(() => {
    cy.logout();
  });

  const TABS = ['All', 'Hacked'];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.get('[data-testid="sidebar-group-defacement"]').should('exist');
  });

  it('Defacement – tabs load & pagination with scoped clicks', () => {
    cy.get('[data-testid="sidebar-group-defacement"]').click();
    cy.get('[data-testid="sidebar-group-defacement"]').as('defacementTabs');
    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);
      cy.get(`[data-testid="sidebar-subitem-defacement-${tab.toLowerCase()}"]`).click();
      cy.get('tr[id^="item-"], [data-testid="result-card"]').should('exist');
      cy.get('[data-testid="pagination-root"]').should('exist');

      cy.get('[data-testid="pagination-root"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="pagination-next"]').filter(':visible').scrollIntoView().not(':disabled').then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();
            cy.get('tr[id^="item-"], [data-testid="result-card"]').should('exist');
          }
        });
    });
  });
});

describe('Social – Tabs & Pagination', () => {
  after(() => {
    cy.logout();
  });

  const TABS = [
    'All',
    'Twitter'
  ];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.get('[data-testid="sidebar-group-social"]').should('exist');
  });

  it('Social – tabs load & pagination with scoped clicks', () => {
    cy.get('[data-testid="sidebar-group-social"]').click();
    cy.get('[data-testid="sidebar-group-social"]').as('socialTabs');
    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);
      cy.get(`[data-testid="sidebar-subitem-social-${tab.toLowerCase()}"]`).click();
      cy.get('[data-testid="result-card"]').should('exist');
      cy.get('[data-testid="result-card"]').should('exist');
      cy.get('body').then(($body) => {
        const hasPagination = $body.find('[data-testid="pagination-root"]:visible').length > 0;
        if (!hasPagination) {
          return;
        }
        cy.get('[data-testid="pagination-root"]').scrollIntoView().should('be.visible');
        cy.get('[data-testid="pagination-next"]').filter(':visible').scrollIntoView().not(':disabled').then(($btn) => {
            if ($btn.length) {
              cy.wrap($btn).click();
              cy.get('[data-testid="result-card"]').should('exist');
              cy.get('[data-testid="result-card"]').should('exist');
            }
          });
      });
    });
  });
});

describe('Exploit – Tabs & Pagination', () => {
  after(() => {
    cy.logout();
  });

  const TABS = ['All', 'CVE'];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.get('[data-testid="sidebar-group-exploit"]').should('exist');
  });

  it('Exploit – tabs load & pagination with scoped clicks', () => {
    cy.get('[data-testid="sidebar-group-exploit"]').click();
    cy.get('[data-testid="sidebar-group-exploit"]').as('exploitTabs');
    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);
      cy.get(`[data-testid="sidebar-subitem-exploit-${tab.toLowerCase()}"]`).click();
      cy.get('[data-testid="result-card"]').should('exist');
      cy.get('[data-testid="result-card"]').should('exist');
      cy.get('[data-testid="pagination-root"]').should('exist');

      cy.get('[data-testid="pagination-root"]').scrollIntoView().should('be.visible');
      cy.get('body').then(($body) => {
        const hasVisibleNext = $body.find('[data-testid="pagination-next"]:visible').length > 0;
        if (!hasVisibleNext) {
          return;
        }
        cy.get('[data-testid="pagination-next"]:visible').then(($btn) => {
          if (!$btn.is(':disabled')) {
            cy.wrap($btn).click();
            cy.get('[data-testid="result-card"]').should('exist');
            cy.get('[data-testid="result-card"]').should('exist');
          }
        });
      });
    });
  });
});

describe('Feed – Tabs & Pagination', () => {
  after(() => {
    cy.logout();
  });

  const TABS = ['News'];

  beforeEach(() => {
    cy.loginAsAdmin();
    cy.get('[data-testid="sidebar-group-feed"]').should('exist');
  });

  it('Feed – tabs load & pagination with scoped clicks', () => {
    cy.get('[data-testid="sidebar-group-feed"]').click();
    cy.get('[data-testid="sidebar-group-feed"]').as('feedTabs');
    TABS.forEach((tab) => {
      cy.log(`TAB: ${tab}`);
      cy.get(`[data-testid="sidebar-subitem-feed-${tab.toLowerCase()}"]`).click();
      cy.get('[data-testid="result-card"]').should('exist');
      cy.get('[data-testid="result-card"]').should('exist');
      cy.get('[data-testid="pagination-root"]').should('exist');

      cy.get('[data-testid="pagination-root"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="pagination-next"]').filter(':visible').scrollIntoView().not(':disabled').then(($btn) => {
          if ($btn.length) {
            cy.wrap($btn).click();
            cy.reload();
            cy.get('[data-testid="result-card"]').should('exist');
          }
        });
      cy.logout();
    });
  });
});
