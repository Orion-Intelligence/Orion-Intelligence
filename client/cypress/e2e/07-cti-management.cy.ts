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

    cy.get('[data-cy="graph-toolbar-search-input"]').first().clear().type('leak');
    cy.get('[data-cy="graph-toolbar-search-button"]').first().click({ force: true });
    cy.contains('node(s) highlighted', { timeout: 20000 }).should('exist');
    cy.get('[data-cy="graph-toolbar-clear-search"]').first().click({ force: true });

    cy.get('[data-cy="graph-toolbar-physics-toggle"]').first().click({ force: true });
    cy.get('[data-cy="cti-expand-groups-toggle"]').first().click({ force: true });

    cy.get('app-cti-sidebar select[name="selectedType"]').select('Property', { force: true });
    cy.get('app-cti-sidebar select[name="propertyType"]').select('All', { force: true });
    cy.get('app-cti-sidebar input[name="propertyValue"]').clear().type('Pakistan');
    applyFilters();

    cy.get('app-cti-sidebar select[name="selectedType"]').select('Document', { force: true });
    cy.get('app-cti-sidebar input[name="singleInputDoc"]').clear().type('all');
    applyFilters();

    cy.contains('button', 'Reset').click({ force: true });
    applyFilters();

    cy.get('[data-cy="graph-toolbar-view-list"]').first().click({ force: true });
    cy.contains('Document').should('be.visible');
    cy.get('[data-cy="graph-toolbar-view-graph"]').first().click({ force: true });

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
    cy.get('[data-cy="cti-tab-session-menu"], [data-cy="graph-tab-session-menu"]', { timeout: 15000 }).first().click({ force: true });
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

      cy.get('[data-cy="graph-toolbar-search-input"]').first().clear().type(username);
      cy.get('[data-cy="graph-toolbar-search-button"]')
        .first()
        .should('be.visible')
        .and('not.be.disabled')
        .click({ force: true });
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
    cy.get('[data-cy="graph-toolbar-view-list"]').first().click({ force: true });
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

  /*const addEntity = (entityType: 'wallet' | 'email' | 'domain', value: string, label: string) => {
    cy.get(`[data-cy="entity-add-${entityType}"]`, { timeout: 15000 }).first().click({ force: true });
    cy.get('[data-cy="add-entity-value-input"]', { timeout: 15000 }).should('be.visible').clear().type(value);
    cy.get('[data-cy="add-entity-label-input"]', { timeout: 10000 }).should('be.visible').clear().type(label);
    cy.get('[data-cy="add-entity-submit"]', { timeout: 10000 })
      .should('be.visible')
      .and('not.be.disabled')
      .click({ force: true });
    cy.get('app-add-entity-modal', { timeout: 10000 }).should('not.exist');
  };*/

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

    cy.get('[data-cy="list-view-followers-following"]').first().click({ force: true });
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
        if ($popup.find('[data-cy="follower-scan-single"]').length > 0) {
          cy.get('[data-cy="follower-scan-single"]').first().click({ force: true });
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

    cy.get('[data-cy="graph-toolbar-view-graph"]').first().click({ force: true });
    cy.get('.vis-network canvas', { timeout: 30000 }).should('exist');

    cy.get('[data-cy="graph-tab-add-menu"]').first().click({ force: true });
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

    cy.get('[data-cy="graph-toolbar-view-graph"]').first().click({ force: true });
    cy.get('.vis-network canvas', { timeout: 30000 }).should('exist');

    cy.get('[data-cy="graph-toolbar-physics-toggle"]')
      .first()
      .invoke('attr', 'title')
      .then((prevTitle) => {
        cy.get('[data-cy="graph-toolbar-physics-toggle"]').first().click({ force: true });
        cy.get('[data-cy="graph-toolbar-physics-toggle"]')
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

    //addEntity('wallet', '0x1234567890abcdef1234567890abcdef12345678', 'Coverage Wallet');
    //addEntity('email', 'coverage@example.com', 'Coverage Email');
    //addEntity('domain', 'coverage-example.com', 'Coverage Domain');

    //cy.contains('Coverage Wallet', { timeout: 15000 }).should('exist');
    //cy.contains('Coverage Email', { timeout: 15000 }).should('exist');
    //cy.contains('Coverage Domain', { timeout: 15000 }).should('exist');

    cy.get('input[placeholder="Filter items..."]', { timeout: 15000 }).clear().type('zzz-no-match');
    cy.contains('No Results Found').should('exist');
    cy.get('[data-cy="home-menu-tab-entities"], [data-cy="home-menu-tab-entities-collapsed"]').first().click({ force: true });
    cy.get('[data-cy="home-menu-tab-history"], [data-cy="home-menu-tab-history-collapsed"]').first().click({ force: true });

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
      if ($body.find('[data-cy="social-graph-search-trigger"]').length) {
        cy.get('[data-cy="social-graph-search-trigger"]').first().click({ force: true });
        cy.get('input[placeholder="Search on graph..."]', { timeout: 10000 }).should('be.visible').clear().type('bitbucket');
        cy.get('input[placeholder="Search on graph..."]').should('have.value', 'bitbucket');
      }
    });

    cy.get('[data-cy="graph-toolbar-image-search"]').first().click({ force: true });
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

describe('Orion Intelligence - Graph Coverage Boost', () => {
  const getNgComponent = (selector: string, componentName: string) =>
    cy.window().then((win) => {
      const host = win.document.querySelector(selector) as any;
      expect(host, `${selector} host`).to.exist;
      const ngApi = (win as any).ng;
      if (ngApi?.getComponent) return ngApi.getComponent(host) as any;
      const ctx = host.__ngContext__ as any[] | undefined;
      expect(ctx, `${componentName} ngContext`).to.exist;
      const comp = (ctx || []).find((x: any) => x && x.constructor?.name === componentName);
      expect(comp, `${componentName} instance`).to.exist;
      return comp as any;
    });

  const samplePlatform = (overrides: Record<string, any> = {}) => ({
    keyUsername: 'e2e-user',
    platform: 'Twitter',
    username: 'e2e_handle',
    url: 'https://x.com/e2e_handle',
    isSelected: true,
    status: 'active',
    allMetadata: { bio: 'E2E user', score: 10 },
    profileDetails: { real_name: 'E2E User', bio: 'bio' },
    posts: [
      { post_url: 'https://x.com/e2e/status/1', datetime: '2026-01-01', caption: 'c1', likes: '1', comments: '0', shares: '0', views: '1', media_type: 'image', media_url: '' },
      { post_url: 'https://x.com/e2e/status/2', datetime: '2026-01-02', caption: 'c2', likes: '2', comments: '0', shares: '0', views: '2', media_type: 'image', media_url: '' },
      { post_url: 'https://x.com/e2e/status/3', datetime: '2026-01-03', caption: 'c3', likes: '3', comments: '0', shares: '0', views: '3', media_type: 'image', media_url: '' },
      { post_url: 'https://x.com/e2e/status/4', datetime: '2026-01-04', caption: 'c4', likes: '4', comments: '0', shares: '0', views: '4', media_type: 'image', media_url: '' }
    ],
    images: [
      { image_url: 'https://example.com/1.jpg', thumbnail: 'https://example.com/1_t.jpg', title: '1', source: 'e2e' },
      { image_url: 'https://example.com/2.jpg', thumbnail: 'https://example.com/2_t.jpg', title: '2', source: 'e2e' },
      { image_url: 'https://example.com/3.jpg', thumbnail: 'https://example.com/3_t.jpg', title: '3', source: 'e2e' },
      { image_url: 'https://example.com/4.jpg', thumbnail: 'https://example.com/4_t.jpg', title: '4', source: 'e2e' },
      { image_url: 'https://example.com/5.jpg', thumbnail: 'https://example.com/5_t.jpg', title: '5', source: 'e2e' },
      { image_url: 'https://example.com/6.jpg', thumbnail: 'https://example.com/6_t.jpg', title: '6', source: 'e2e' },
      { image_url: 'https://example.com/7.jpg', thumbnail: 'https://example.com/7_t.jpg', title: '7', source: 'e2e' },
      { image_url: 'https://example.com/8.jpg', thumbnail: 'https://example.com/8_t.jpg', title: '8', source: 'e2e' },
      { image_url: 'https://example.com/9.jpg', thumbnail: 'https://example.com/9_t.jpg', title: '9', source: 'e2e' }
    ],
    followers_list: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
    following_list: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11'],
    ...overrides
  });

  const visitSocialGraph = () => {
    cy.viewport(1440, 900);
    cy.intercept('GET', '**/api/social/session/tabs?graph_type=social*').as('socialTabs');
    cy.visit('/dashboard/social-graph');
    cy.wait('@socialTabs', { timeout: 30000 });
    cy.get('app-social-graph', { timeout: 20000 }).should('be.visible');
  };

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('covers MetadataPopupComponent methods and load-more branches', () => {
    visitSocialGraph();
    getNgComponent('app-social-graph', 'SocialMapperComponent').then((mapper: any) => {
      mapper.state.selectedPlatformData.set(samplePlatform());
      mapper.state.isMetadataPopupVisible.set(true);
    });
    cy.get('app-metadata-popup', { timeout: 15000 }).should('exist');
    cy.get('app-metadata-popup > div.fixed.inset-0', { timeout: 15000 }).should('be.visible');

    getNgComponent('app-metadata-popup', 'MetadataPopupComponent').then((comp: any) => {
      const key = comp.getPlatformUniqueKey();
      expect(key).to.be.a('string').and.include('platform-');
      expect(comp.getMetadataEntries()).to.be.an('array');
      expect(comp.getProfileDetailEntries()).to.be.an('array');
      expect(comp.trackByKey(0, { key: 'k' })).to.eq('k');
      expect(comp.trackByUsername(0, 'u')).to.eq('u');
      expect(comp.getAccountUrl()).to.match(/^https?:\/\/|^#/);

      const closeSpy = cy.stub(comp.close, 'emit');
      comp.onClose();
      expect(closeSpy).to.have.been.called;

      const postsBefore = comp.displayPosts().length;
      comp.loadMorePosts();
      comp.loadMoreImages();
      comp.loadMoreFollowers();
      comp.loadMoreFollowing();
      const postsAfterFirstLoad = comp.displayPosts().length;
      comp.isLoadingMorePosts.set(true);
      comp.loadMorePosts();
      expect(postsAfterFirstLoad).to.be.greaterThan(postsBefore);
      expect(comp.displayPosts().length).to.eq(postsAfterFirstLoad);

      const originalData = comp.data;
      comp.data = () => ({
        ...originalData(),
        allMetadata: null,
        profileDetails: null,
        posts: null,
        images: null,
        followers_list: null,
        following_list: null
      });
      expect(comp.getMetadataEntries()).to.deep.eq([]);
      expect(comp.getProfileDetailEntries()).to.deep.eq([]);
      comp.data = originalData;
    });

    cy.wait(1200);
    cy.get('app-metadata-popup').then(($el) => {
      if ($el.find('button:contains(\"Done\")').length) {
        cy.contains('app-metadata-popup button', 'Done').click({ force: true });
      }
    });
  });

  it('covers SummaryPlatformViewComponent helper/load branches', () => {
    visitSocialGraph();
    getNgComponent('app-social-graph', 'SocialMapperComponent').then((mapper: any) => {
      mapper.state.summaryPopupData.set({
        username: 'e2e-user',
        platforms: [
          samplePlatform(),
          samplePlatform({
            platform: 'Github',
            username: 'e2e-gh',
            url: 'https://github.com/e2e-gh',
            posts: [],
            images: [],
            followers_list: [],
            following_list: []
          })
        ]
      });
    });
    cy.get('app-profile-summary-popup', { timeout: 15000 }).should('exist');
    cy.get('app-profile-summary-popup > div.fixed.inset-0', { timeout: 15000 }).should('be.visible');
    cy.get('app-profile-summary-popup .group.flex.items-center.p-2.rounded-md.transition-colors.cursor-pointer').eq(1).click({ force: true });
    cy.get('app-summary-platform-view', { timeout: 15000 }).should('exist');

    getNgComponent('app-summary-platform-view', 'SummaryPlatformViewComponent').then((comp: any) => {
      const p = comp.platform();
      expect(p).to.exist;
      expect(comp.getPlatformUniqueKey(p)).to.include('platform-');
      expect(comp.getProfileDetailEntries(null)).to.deep.eq([]);
      expect(comp.getProfileDetailEntries(p)).to.be.an('array');
      expect(comp.getAccountUrl(p)).to.match(/^https?:\/\/|^#/);

      comp.loadMorePosts();
      comp.loadMoreImages();
      comp.loadMoreFollowers();
      comp.loadMoreFollowing();
      comp.isLoadingMoreImages.set(true);
      comp.loadMoreImages();
      comp.isLoadingMoreImages.set(false);
    });

    cy.wait(1200);
    cy.get('app-profile-summary-popup button').filter(':has(i.bi-x-lg)').first().click({ force: true });
    cy.get('app-profile-summary-popup', { timeout: 10000 }).should('not.exist');
  });

  it('covers social context menu computed branches', () => {
    visitSocialGraph();
    getNgComponent('app-social-graph', 'SocialMapperComponent').then((mapper: any) => {
      const mkEvt = (x: number, y: number) => new MouseEvent('contextmenu', { clientX: x, clientY: y }) as MouseEvent;
      mapper.state.onNodeRightClicked({ nodeId: 'user-john', event: mkEvt(20, 20) }, false);
      expect(mapper.state.contextMenuData()).to.deep.include({ nodeId: 'user-john', type: 'user' });
      mapper.state.onNodeRightClicked({ nodeId: 'platform-john|github|octo', event: mkEvt(1200, 600) }, false);
      expect(mapper.state.contextMenuData()).to.deep.include({ nodeId: 'platform-john|github|octo', type: 'platform' });
      mapper.state.onNodeRightClicked({ nodeId: 'group-john-github', event: mkEvt(1200, 600) }, false);
      expect(mapper.state.contextMenuData()).to.deep.include({ nodeId: 'group-john-github', type: 'group' });
      mapper.state.closeContextMenu();
      expect(mapper.state.contextMenuData()).to.eq(null);
    });
  });
});
