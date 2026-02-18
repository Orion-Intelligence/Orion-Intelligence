describe('Orion Intelligence - Social Mapper Deep Coverage', () => {
  const username = 'msmannan00';

  it('runs CTI graph deep flow with filters, search, views and export/report actions', () => {
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

    cy.get('app-cti-sidebar select[name="selectedType"]').select('Cluster', { force: true });
    cy.get('app-cti-sidebar select[name="singleInputCluster"]').select('All', { force: true });
    cy.get('app-cti-sidebar input[name="maxNodes"]').clear().type('50');
    cy.get('app-cti-sidebar input[name="maxDepth"]').clear().type('2');
    applyFilters();

    cy.get('input[placeholder="Search nodes to highlight..."]').clear().type('leak');
    cy.contains('button', 'Search').click({ force: true });
    cy.contains('node(s) highlighted', { timeout: 20000 }).should('exist');
    cy.get('button[title="Clear search"]').click({ force: true });

    cy.get('button[title="Disable Physics Simulation"], button[title="Enable Physics Simulation"]')
      .first()
      .click({ force: true });
    cy.get('button[title="Expand Groups"], button[title="Collapse Groups"]')
      .first()
      .click({ force: true });

    cy.get('app-cti-sidebar select[name="selectedType"]').select('Property', { force: true });
    cy.get('app-cti-sidebar select[name="propertyType"]').select('All', { force: true });
    cy.get('app-cti-sidebar input[name="propertyValue"]').clear().type('Pakistan');
    applyFilters();

    cy.get('app-cti-sidebar select[name="selectedType"]').select('Document', { force: true });
    cy.get('app-cti-sidebar input[name="singleInputDoc"]').clear().type('all');
    applyFilters();

    cy.contains('button', 'Reset').click({ force: true });
    applyFilters();

    cy.get('button[title="List View"]').click({ force: true });
    cy.contains('Document').should('be.visible');
    cy.get('button[title="Graph View"]').click({ force: true });

    openSessionMenu();
    cy.contains('button', 'Export Current Session').click({ force: true });

    openAndAssertReportModal('Export CTI Report');
    cy.contains('button', '1. JSON (Raw Graph Data)').click({ force: true });

    openAndAssertReportModal('Export CTI Report');
    cy.contains('button', '2. PDF Graph Report').click({ force: true });

    openAndAssertReportModal('Export CTI Report');
    cy.contains('button', '3. PDF Document Report').click({ force: true });

    openSessionMenu();
    cy.contains('button', 'New Session').click({ force: true });
    cy.get('header nav > div').its('length').should('be.greaterThan', 1);
  });

  const openSessionMenu = () => {
    cy.get('button[title="Session Menu"]', { timeout: 15000 }).first().click({ force: true });
  };

  const openAndAssertReportModal = (title: string) => {
    openSessionMenu();
    cy.contains('button', 'Export Report').click({ force: true });
    cy.contains(title, { timeout: 10000 }).should('be.visible');
    cy.contains('button', '1. JSON (Raw Graph Data)').should('be.visible');
    cy.contains('button', '2. PDF Graph Report').should('be.visible');
    cy.contains('button', '3. PDF Document Report').should('be.visible');
  };

  const visitSocialGraph = () => {
    cy.viewport(1440, 900);
    cy.intercept('GET', '**/api/social/session/tabs?graph_type=social*').as('socialTabs');
    cy.intercept('POST', '**/api/social/recon').as('socialRecon');
    cy.intercept('POST', '**/api/social/recon/image').as('socialReconImage');
    cy.intercept('POST', '**/api/social/session/upsert?graph_type=social*').as('socialSessionUpsert');
    cy.intercept('POST', '**/api/social/session/tab/add?graph_type=social*').as('socialSessionTabAdd');
    cy.intercept('POST', /\/api\/social\/(profile|posts|online\/images|followers|following)(\?|$)/).as('socialPlatformFetch');

    cy.visit('/dashboard/social-graph');
    cy.wait('@socialTabs', { timeout: 30000 });
    cy.get('app-tab-bar', { timeout: 20000 }).should('be.visible');
    cy.get('app-home-menu').should('exist');
    cy.get('app-entity-manager').should('exist');
    cy.get('app-graph-toolbar', { timeout: 20000 }).should('be.visible');
  };

  const triggerScanIfNeeded = () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes(username)) {
        return;
      }

      cy.get('app-graph-toolbar').within(() => {
        cy.get('input[placeholder="Enter username to scan..."]').clear().type(username);
        cy.contains('button', 'Scan')
          .should('be.visible')
          .and('not.be.disabled')
          .click({ force: true });
      });
      cy.wait('@socialRecon', { timeout: 90000 });
      cy.wait(1000);
    });

    cy.contains('app-home-menu .home-menu-created-item', username, { timeout: 30000 }).should('exist');
  };

  const updateGraphFromManageProfilesModal = () => {
    cy.get('app-manage-profiles-modal', { timeout: 20000 }).should('exist');
    cy.contains('app-manage-profiles-modal h3', 'Manage Profiles for', { timeout: 20000 }).should('exist');

    const loadAllProfilesInModal = () => {
      cy.get('body').then(($body) => {
        const hasLoadMore = $body.find('app-manage-profiles-modal button:contains("Load More")').length > 0;
        if (!hasLoadMore) {
          return;
        }
        cy.contains('app-manage-profiles-modal button', 'Load More').click({ force: true });
        loadAllProfilesInModal();
      });
    };

    loadAllProfilesInModal();
    cy.contains('app-manage-profiles-modal button', 'Select All', { timeout: 20000 }).should('exist').click({ force: true });
    cy.contains('app-manage-profiles-modal button', 'Deselect All', { timeout: 20000 }).should('exist').click({ force: true });
    cy.contains('app-manage-profiles-modal button', 'Select All', { timeout: 20000 }).should('exist').click({ force: true });
    cy.contains('app-manage-profiles-modal button', 'Update Graph')
      .should('exist')
      .and('not.be.disabled')
      .click({ force: true });
    cy.get('app-manage-profiles-modal', { timeout: 15000 }).should('not.exist');
  };

  const ensureProfileAddedToGraph = () => {
    cy.contains('app-home-menu .home-menu-created-item', username, { timeout: 30000 })
      .should('be.visible')
      .within(() => {
        cy.contains('p', username).click({ force: true });
      });

    cy.get('app-manage-profiles-modal', { timeout: 20000 }).should('exist');
    updateGraphFromManageProfilesModal();
  };

  const ensureListHasProfiles = () => {
    cy.get('button[title="List View"]').click({ force: true });
    cy.get('app-list-view, app-home-menu').should('exist');

    cy.get('body').then(($body) => {
      if (!$body.text().includes('List is Waiting for Data')) {
        return;
      }
      ensureProfileAddedToGraph();
    });

    cy.get('body', { timeout: 30000 }).should('not.contain', 'List is Waiting for Data');
    cy.contains('Active Profiles', { timeout: 20000 }).should('be.visible');
    cy.contains('app-list-view h3', username, { timeout: 20000 }).should('exist');
  };

  const addEntity = (buttonLabel: string, value: string, label: string) => {
    cy.contains('button:visible', buttonLabel, { timeout: 15000 }).click({ force: true });
    cy.get('app-add-entity-modal input#entityValue', { timeout: 15000 }).should('be.visible').clear().type(value);
    cy.get('app-add-entity-modal input#entityLabel', { timeout: 10000 }).should('be.visible').clear().type(label);
    cy.contains('app-add-entity-modal button', 'Add Entity', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });
    cy.get('app-add-entity-modal', { timeout: 10000 }).should('not.exist');
  };

  const closeProfileSummaryPopupIfOpen = () => {
    cy.get('body').then(($body) => {
      if (!$body.find('app-profile-summary-popup').length) {
        return;
      }
      cy.get('app-profile-summary-popup').within(() => {
        cy.get('button').filter(':has(i.bi-x-lg)').first().click({ force: true });
      });
      cy.get('app-profile-summary-popup', { timeout: 15000 }).should('not.exist');
    });
  };

  const closeManageProfilesModalIfOpen = () => {
    cy.get('body').then(($body) => {
      if (!$body.find('app-manage-profiles-modal').length) {
        return;
      }
      cy.get('app-manage-profiles-modal').within(() => {
        cy.contains('button', 'Cancel').click({ force: true });
      });
      cy.get('app-manage-profiles-modal', { timeout: 15000 }).should('not.exist');
    });
  };

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('covers scan to graph/list and profile/follower popups', () => {
    visitSocialGraph();
    triggerScanIfNeeded();
    ensureProfileAddedToGraph();
    ensureListHasProfiles();

    cy.get('app-list-view').within(() => {
      cy.get('h3.text-lg.font-bold.text-indigo-400').first().click({ force: true });
    });
    cy.get('app-profile-summary-popup', { timeout: 20000 }).should('exist');
    cy.get('app-profile-summary-popup input[placeholder="Filter platforms..."]').first().clear().type('bit');
    cy.get('app-profile-summary-popup').then(($popup) => {
      const linkSelector = 'a[title="Open account in new tab"], a[title="Visit Profile"]';
      if ($popup.find(linkSelector).length > 0) {
        cy.wrap($popup)
          .find(linkSelector)
          .first()
          .should('have.attr', 'href')
          .and('match', /^https?:\/\//);
        return;
      }

      const itemSelector = 'div.group.flex.items-center.p-2.rounded-md.transition-colors.cursor-pointer';
      const $platformItem = $popup.find(itemSelector).first();
      if ($platformItem.length) {
        cy.wrap($platformItem).click({ force: true });
      }

      cy.get('app-profile-summary-popup').then(($popupAfterClick) => {
        if ($popupAfterClick.find(linkSelector).length > 0) {
          cy.wrap($popupAfterClick)
            .find(linkSelector)
            .first()
            .should('have.attr', 'href')
            .and('match', /^https?:\/\//);
          return;
        }

        cy.wrap($popupAfterClick)
          .find('button')
          .contains(/^Fetch$/)
          .first()
          .should('exist');
      });
    });
    cy.get('app-profile-summary-popup button').contains(/^Fetch$/).first().click({ force: true });
    cy.wait('@socialPlatformFetch', { timeout: 30000 });
    closeProfileSummaryPopupIfOpen();

    cy.get('app-list-view').within(() => {
      cy.contains('button', 'Manage Profiles').first().click({ force: true });
    });
    cy.get('app-manage-profiles-modal', { timeout: 20000 }).should('exist');
    cy.contains('app-manage-profiles-modal h3', 'Manage Profiles for', { timeout: 20000 }).should('exist');
    cy.get('app-manage-profiles-modal input[placeholder="Filter platforms..."]').first().clear().type('git');
    cy.contains('app-manage-profiles-modal button', 'Select All', { timeout: 20000 }).should('exist').click({ force: true });
    cy.contains('app-manage-profiles-modal button', 'Deselect All', { timeout: 20000 }).should('exist').click({ force: true });
    cy.contains('app-manage-profiles-modal button', 'Cancel', { timeout: 20000 }).should('exist').click({ force: true });
    cy.get('app-manage-profiles-modal').should('not.exist');

    cy.get('app-list-view button[title="Followers and Following"]').first().click({ force: true });
    cy.get('app-follower-scan-popup', { timeout: 20000 }).should('exist');
    cy.get('app-follower-scan-popup').within(() => {
      cy.get('input[placeholder="Filter profiles..."]').first().clear().type('follow');
      cy.contains('button', 'Fetch Followers', { timeout: 15000 }).should('exist').click({ force: true });
      cy.wait('@socialPlatformFetch', { timeout: 30000 });
      cy.root().then(($popup) => {
        if ($popup.find('button:contains("Fetch Following")').length > 0) {
          cy.contains('button', 'Fetch Following').click({ force: true });
          cy.wait('@socialPlatformFetch', { timeout: 30000 });
        }
        if ($popup.find('button[title="Scan this username"]').length > 0) {
          cy.get('button[title="Scan this username"]').first().click({ force: true });
          cy.wait('@socialRecon', { timeout: 90000 });
        }
        if ($popup.find('a[title="Open account in new tab"]').length > 0) {
          cy.get('a[title="Open account in new tab"]').first().should('have.attr', 'href');
        }
      });
      cy.contains('button', 'Cancel').click({ force: true });
    });
    cy.get('app-follower-scan-popup').should('not.exist');
  });

  it('covers sessions, rename, export session, and report type modal actions', () => {
    visitSocialGraph();
    triggerScanIfNeeded();
    ensureProfileAddedToGraph();

    cy.get('button[title="Graph View"]').click({ force: true });
    cy.get('.vis-network canvas', { timeout: 30000 }).should('exist');

    cy.get('button[title="New Session"]').first().click({ force: true });
    cy.contains('button', 'New Session').click({ force: true });
    cy.wait('@socialSessionTabAdd', { timeout: 30000 });
    cy.get('app-tab-bar header nav > div.group').its('length').should('be.greaterThan', 1);

    const newName = `Social Session ${Date.now()}`;
    cy.get('app-tab-bar span[title="Double-click to rename"]').first().dblclick({ force: true });
    cy.get('app-tab-bar input[data-tab-id]', { timeout: 10000 }).clear().type(`${newName}{enter}`);
    cy.contains('app-tab-bar span', newName, { timeout: 10000 }).should('be.visible');

    openSessionMenu();
    cy.contains('button', 'Export Current Session').click({ force: true });

    openAndAssertReportModal('Export Social Report');
    cy.contains('button', '1. JSON (Raw Graph Data)').click({ force: true });

    openAndAssertReportModal('Export Social Report');
    cy.contains('button', '2. PDF Graph Report').click({ force: true });

    openAndAssertReportModal('Export Social Report');
    cy.contains('button', '3. PDF Document Report').click({ force: true });

    cy.get('input#fileInput', { timeout: 10000 }).first().selectFile('cypress/fixtures/social-session-sample.json', { force: true });
    cy.contains('app-tab-bar span', 'Imported Social Session', { timeout: 15000 }).should('exist');
  });

  it('covers entity manager, context menu, graph search trigger, and image scan upload', () => {
    visitSocialGraph();
    triggerScanIfNeeded();
    ensureProfileAddedToGraph();

    cy.get('button[title="Graph View"]').click({ force: true });
    cy.get('.vis-network canvas', { timeout: 30000 }).should('exist');

    cy.get('button[title="Disable Physics Simulation"], button[title="Enable Physics Simulation"]')
      .first()
      .invoke('attr', 'title')
      .then((prevTitle) => {
        cy.get('button[title="Disable Physics Simulation"], button[title="Enable Physics Simulation"]').first().click({ force: true });
        cy.get('button[title="Disable Physics Simulation"], button[title="Enable Physics Simulation"]')
          .first()
          .invoke('attr', 'title')
          .should('not.eq', prevTitle);
      });

    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Edit Connections"), button:contains("Done Editing")').length > 0) {
        cy.contains('button', 'Edit Connections').click({ force: true });
        cy.contains('button', 'Done Editing', { timeout: 10000 }).should('exist');
        cy.contains('button', 'Done Editing').click({ force: true });
      }
    });

    addEntity('Add Wallet', '0x1234567890abcdef1234567890abcdef12345678', 'Coverage Wallet');
    addEntity('Add Email', 'coverage@example.com', 'Coverage Email');
    addEntity('Add Domain', 'coverage-example.com', 'Coverage Domain');

    cy.contains('Coverage Wallet', { timeout: 15000 }).should('exist');
    cy.contains('Coverage Email', { timeout: 15000 }).should('exist');
    cy.contains('Coverage Domain', { timeout: 15000 }).should('exist');

    cy.get('input[placeholder="Filter items..."]', { timeout: 15000 }).clear().type('zzz-no-match');
    cy.contains('No Results Found').should('exist');
    cy.get('button[title="Entities"]').click({ force: true });
    cy.get('button[title="Scan History"]').click({ force: true });

    cy.get('.vis-network canvas').trigger('contextmenu', {
      button: 2,
      clientX: 200,
      clientY: 200,
      force: true,
    });
    cy.get('body').then(($body) => {
      if ($body.find('app-context-menu .social-mapper-context-menu-wrapper').length) {
        cy.get('app-context-menu .social-mapper-context-menu-wrapper').should('exist');
        cy.get('app-context-menu .social-mapper-context-menu-wrapper button').first().click({ force: true });
      }
    });

    cy.get('body').then(($body) => {
      if ($body.find('button[title="Search on graph"]').length) {
        cy.get('button[title="Search on graph"]').first().click({ force: true });
        cy.get('input[placeholder="Search on graph..."]', { timeout: 10000 }).should('be.visible').clear().type('bitbucket');
        cy.get('input[placeholder="Search on graph..."]').should('have.value', 'bitbucket');
      }
    });

    cy.get('app-graph-toolbar').within(() => {
      cy.get('button[title="Search by image"]').first().click({ force: true });
    });
    cy.get('input[type="file"][accept*="image"], input#imageInput', { timeout: 10000 })
      .first()
      .selectFile('cypress/fixtures/avatar.png', { force: true });
    cy.wait('@socialReconImage', { timeout: 90000 });
    cy.get('body').then(($body) => {
      if ($body.find('app-manage-profiles-modal').length) {
        cy.get('app-manage-profiles-modal').within(() => {
          cy.contains('button', 'Select All').click({ force: true });
          cy.contains('button', 'Update Graph').then(($btn) => {
            if (!$btn.prop('disabled')) {
              cy.wrap($btn).click({ force: true });
            } else {
              cy.contains('button', 'Cancel').click({ force: true });
            }
          });
        });
      }
    });
    closeManageProfilesModalIfOpen();
  });
});
