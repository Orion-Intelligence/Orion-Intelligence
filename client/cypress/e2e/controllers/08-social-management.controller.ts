const SOCIAL_ROOT = '[data-testid="social-graph-root"]';
const SOCIAL_LIST_EMPTY = '[data-testid="social-list-empty"]';
const SOCIAL_PROFILE_EMPTY_CARD = '[data-testid="social-profile-empty-card"]';
const SOCIAL_PROFILE_EMPTY_OVERVIEW_BUTTON = '[data-testid="social-profile-empty-overview-button"]';
const SOCIAL_PLATFORM_CARD = '[data-testid="social-platform-card"]';
const SOCIAL_SCAN_TIMEOUT = 180000;
const SOCIAL_FETCH_TIMEOUT = 120000;
const SOCIAL_API_MOCK_ROOT = '../backend/static/test/mocks/api';
const SOCIAL_ELASTIC_MOCK_ROOT = '../backend/static/test/mocks/elastic';

export const SOCIAL_STEALER_USERNAME = 'superman0011';
export const SOCIAL_STEALER_PLATFORM = /twitter/i;
const SOCIAL_STEALER_DOMAIN = 'twitter.com';

function isStealerDomain(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  try {
    const host = new URL(normalized.includes('://') ? normalized : `https://${normalized}`).hostname.replace(/^www\./, '');
    return host === SOCIAL_STEALER_DOMAIN || host.endsWith(`.${SOCIAL_STEALER_DOMAIN}`);
  } catch {
    return false;
  }
}

function loadSocialElasticMock<T = any>(filename: string) {
  return cy.readFile(`${SOCIAL_ELASTIC_MOCK_ROOT}/${filename}`, { log: false }) as Cypress.Chainable<T>;
}

function loadSocialApiMock<T = any>(filename: string) {
  return cy.readFile(`${SOCIAL_API_MOCK_ROOT}/${filename}`, { log: false }) as Cypress.Chainable<T>;
}

export function setupSocialManagementJsonStubs() {
  loadSocialElasticMock('social_recon.json').then((mock) => {
    cy.intercept('POST', '**/api/social/recon', { statusCode: 200, body: mock }).as('socialRecon');
  });
  loadSocialElasticMock('social_profile.json').then((mock) => {
    cy.intercept('POST', '**/api/social/profile', { statusCode: 200, body: mock }).as('socialProfile');
  });
  loadSocialElasticMock('social_posts.json').then((mock) => {
    cy.intercept('POST', '**/api/social/posts', { statusCode: 200, body: mock }).as('socialPosts');
  });
  loadSocialElasticMock('social_videos.json').then((mock) => {
    cy.intercept('POST', '**/api/social/videos', { statusCode: 200, body: mock }).as('socialVideos');
  });
  loadSocialElasticMock('social_shorts.json').then((mock) => {
    cy.intercept('POST', '**/api/social/shorts', { statusCode: 200, body: mock }).as('socialShorts');
  });
  loadSocialElasticMock('social_online_images.json').then((mock) => {
    cy.intercept('POST', '**/api/social/online/images', { statusCode: 200, body: mock }).as('socialImages');
  });
  loadSocialElasticMock('social_followers.json').then((mock) => {
    cy.intercept('POST', '**/api/social/followers', { statusCode: 200, body: mock }).as('socialFollowers');
  });
  loadSocialElasticMock('social_following.json').then((mock) => {
    cy.intercept('POST', '**/api/social/following', { statusCode: 200, body: mock }).as('socialFollowing');
  });
  loadSocialElasticMock('social_online_presence.json').then((mock) => {
    cy.intercept('POST', '**/api/social/metadata', { statusCode: 200, body: mock }).as('socialOnlinePresence');
  });
  loadSocialElasticMock('social_stealer_logs.json').then((mock) => {
    cy.intercept('POST', '**/api/search/stealer/ioc', { statusCode: 200, body: mock }).as('socialStealerLogs');
  });
  loadSocialApiMock('dynamic_wanted.json').then((mock) => {
    cy.intercept('POST', '**/api/dynamic/wanted', { statusCode: 200, body: mock }).as('socialWanted');
  });
  cy.intercept('GET', '**/api/social/data', { statusCode: 200, body: { status: 'done', result: [] } }).as('socialDataList');
  cy.intercept('GET', '**/api/social/data/*', { statusCode: 200, body: { profiles: [], count: 0 } }).as('socialDataDetail');
  cy.intercept('POST', '**/api/social/data', { statusCode: 200, body: { status: 'done' } }).as('socialDataSave');
}

export function visitSocialIntel() {
  setViewportToCurrentScreen();
  cy.visit('/dashboard/social-intel');
  cy.location('pathname').should('include', '/dashboard/social-intel');
  cy.get(SOCIAL_ROOT).should('be.visible');
  cy.get('[data-testid="social-header-breadcrumb"]').should('contain.text', 'Social').and('contain.text', 'Intel');
  cy.get('[data-testid="social-scan-control"]').should('be.visible');
  cy.get('[data-testid="social-scan-input"]').should('have.attr', 'placeholder', 'Search username or handle...');
  cy.get('[data-testid="social-scan-submit"]').should('contain.text', 'Search');
  cy.get('[data-testid="social-list-view"]').should('be.visible');
}

function setViewportToCurrentScreen() {
  cy.viewport(
    Number(Cypress.config('viewportWidth')) || 1920,
    Number(Cypress.config('viewportHeight')) || 1080
  );
}

export function scanKnownSocialUsername(username = SOCIAL_STEALER_USERNAME) {
  cy.get('[data-testid="social-scan-input"]').clear().type(username).should('have.value', username);
  cy.get('[data-testid="social-scan-submit"]').should('not.be.disabled').click();
  cy.wait('@socialRecon', { timeout: SOCIAL_FETCH_TIMEOUT });
  cy.contains('[data-testid="social-history-job"]', username, { timeout: SOCIAL_SCAN_TIMEOUT })
    .should('contain.text', 'Completed')
    .and('contain.text', 'Results Ready')
    .click();
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .should('be.visible');
  cy.docsScreenshot('social-intel');
}

export function assertSocialResultNavigation() {
  cy.get('[data-testid="social-sidebar-platform-row"]').should('have.length.greaterThan', 0);
  cy.contains('[data-testid="social-sidebar-platform-row"]', SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .click();
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .should('be.visible');
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="social-list-platform-open-link"]').length > 0) {
      cy.get('[data-testid="social-list-platform-open-link"]')
        .first()
        .should('have.attr', 'target', '_blank')
        .and('have.attr', 'rel')
        .and('include', 'noopener');
    }
  });
}

export function assertDashboardStealerExposure() {
  cy.get('[data-testid="social-stealerlog-section"]').should('be.visible');
  cy.wait('@socialStealerLogs', { timeout: SOCIAL_FETCH_TIMEOUT });
  cy.get('[data-testid="social-dashboard-stealer-exposure"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('be.visible')
    .and('contain.text', 'Exposure found');
  cy.get('[data-testid="social-dashboard-stealer-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .then(($rows) => {
      const matchingRow = [...$rows].slice(0, 3).find((row) => {
        const text = row.textContent || '';
        const domain = row.querySelector('[title]')?.getAttribute('title') || '';
        return text.includes(SOCIAL_STEALER_USERNAME) && isStealerDomain(domain);
      });
      expect(matchingRow, `top 3 stealer rows include ${SOCIAL_STEALER_DOMAIN}`).to.exist;
    });
}

export function assertWantedListJsonData() {
  cy.get('[data-testid="social-wanted-list-section"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('be.visible')
    .within(() => {
      cy.get('[data-testid="social-wanted-search-input"]').clear().type('John Doe');
      cy.get('[data-testid="social-wanted-search-button"]').should('not.be.disabled').click();
    });
  cy.wait('@socialWanted', { timeout: SOCIAL_FETCH_TIMEOUT });
  cy.get('[data-testid="social-wanted-result-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', 'Johnathan Andrew Doe')
    .and('contain.text', 'red_notice');
}

export function openConnectionsFromPlatformCard() {
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .then(($card) => {
      const $connectionsButton = $card.find('[data-testid="social-list-followers-following"]');
      if ($connectionsButton.length === 0) {
        return;
      }
      cy.wrap($connectionsButton).click();
      assertTabPanelSettled('social-tab-panel-connections', 'Loading post mentions');
      cy.get('[data-testid="social-connection-chip"]', { timeout: SOCIAL_FETCH_TIMEOUT })
        .should('have.length.greaterThan', 0)
        .and('contain.text', '@dailyplanet');
      cy.get('[data-testid="social-header-back"]').click();
    });
}

export function openProfileOverviewFromPlatformCard() {
  cy.contains(SOCIAL_PLATFORM_CARD, SOCIAL_STEALER_PLATFORM, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .within(() => {
      cy.get('[data-testid="social-profile-overview-button"]').click();
    });
  cy.get('[data-testid="social-header-back"]').should('be.visible');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="details"]').should('exist');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="posts"]').should('exist');
  cy.get('[data-testid="social-fetch-tab"][data-tab-key="stealerLogs"]').should('exist');
  assertTabPanelSettled('social-tab-panel-details', 'Loading profile details');
  cy.get('[data-testid="social-tab-panel-details"]').should('contain.text', 'Clark Kent');
  cy.docsScreenshot('social-summary-popup');
  cy.docsScreenshot('social-metadata-results');
}

export function setupSocialExtensionExecutorStubs() {
  loadSocialElasticMock('social_extensions.json').then((mock) => {
    const status = mock.status_response || {};
    const profileResult = mock.cypress_profile_result || {};
    const morePostsResult = mock.cypress_more_posts_result || { posts: [] };
    cy.intercept('GET', '**/api/social/extensions/status', { statusCode: 200, body: status }).as('extensionStatus');
    cy.intercept('POST', '**/api/social/extensions/profile', (req) => {
      expect(req.body.platform).to.match(/twitter|x/i);
      expect(req.body.username).to.eq(SOCIAL_STEALER_USERNAME);
      req.reply({ statusCode: 200, body: { result: profileResult } });
    }).as('extensionProfile');
    cy.intercept('POST', '**/api/social/extensions/posts', (req) => {
      expect(req.body.platform).to.match(/twitter|x/i);
      expect(req.body.username).to.eq(SOCIAL_STEALER_USERNAME);
      const postOffset = Number(req.body.post_offset || 0);
      req.reply({
        statusCode: 200,
        body: {
          result: postOffset > 0 ? morePostsResult : { posts: profileResult.posts || [] }
        }
      });
    }).as('extensionPosts');
  });
}

export function assertSocialExtensionExecutorTab() {
  clickFetchTab('extension');
  cy.get('[data-testid="social-tab-panel-extension"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('be.visible')
    .within(() => {
      cy.get('[data-testid="social-extension-download-chrome"]')
        .should('have.attr', 'href')
        .and('include', '/api/social/extensions/download/chrome');
      cy.get('[data-testid="social-extension-download-chrome"]')
        .should('have.attr', 'download', 'orion-social-scraper-chrome.zip');
      cy.get('[data-testid="social-extension-download-firefox"]')
        .should('have.attr', 'href')
        .and('include', '/api/social/extensions/download/firefox');
      cy.get('[data-testid="social-extension-download-firefox"]')
        .should('have.attr', 'download', 'orion-social-scraper-firefox.xpi');
      cy.get('[data-testid="social-extension-refresh"]').click();
    });
  cy.wait('@extensionStatus', { timeout: SOCIAL_FETCH_TIMEOUT });

  cy.get('[data-testid="social-tab-panel-extension"]').within(() => {
    cy.get('[data-testid="social-extension-status-label"]', { timeout: SOCIAL_FETCH_TIMEOUT })
      .should('contain.text', 'Extension ready');
    cy.get('[data-testid="social-extension-platform-status"]').should('contain.text', 'ready');
    cy.get('[data-testid="social-extension-id-value"]').should('contain.text', 'test-extension');
    cy.get('[data-testid="social-extension-fetch-all"]').click();
  });
  cy.wait('@extensionProfile', { timeout: SOCIAL_FETCH_TIMEOUT });

  cy.get('[data-testid="social-tab-panel-extension"]', { timeout: SOCIAL_FETCH_TIMEOUT }).within(() => {
    cy.contains('Extension Clark Kent').should('be.visible');
    cy.contains('Browser extension profile metadata').should('be.visible');
    cy.get('[data-testid="social-extension-follower-row"]').should('contain.text', '@loislane');
    cy.get('[data-testid="social-extension-following-row"]').should('contain.text', '@dailyplanet');
    cy.get('[data-testid="social-post-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain.text', 'Metropolis skyline');
    cy.get('[data-testid="social-extension-image-result"]')
      .should('have.attr', 'href')
      .and('include', 'extension-skyline.jpg');
  });
}

export function fetchSocialProfileTabs() {
  clickFetchTab('posts');
  assertTabPanelSettled('social-tab-panel-posts', 'Loading posts');
  cy.get('[data-testid="social-post-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', 'Metropolis skyline');
  cy.get('[data-testid="social-posts-load-more"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('be.visible')
    .click();
  cy.wait('@extensionPosts', { timeout: SOCIAL_FETCH_TIMEOUT }).then(({ request }) => {
    expect(request.body.platform).to.match(/twitter|x/i);
    expect(request.body.username).to.eq(SOCIAL_STEALER_USERNAME);
    expect(request.body.max_posts).to.eq(5);
    expect(request.body.post_offset).to.be.greaterThan(0);
    expect(request.body.existing_posts_count).to.eq(request.body.post_offset);
    expect(request.body.existing_post_urls).to.include('https://x.com/superman0011/status/1001');
  });
  cy.get('[data-testid="social-post-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('contain.text', 'Metropolis extension load more post');

  clickFetchTabIfPresent('videos', () => {
    cy.wait('@socialVideos', { timeout: SOCIAL_FETCH_TIMEOUT });
    assertTabPanelSettled('social-tab-panel-videos', 'Loading videos');
    cy.get('[data-testid="social-post-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain.text', 'Press briefing highlights');
  });

  clickFetchTabIfPresent('shorts', () => {
    cy.wait('@socialShorts', { timeout: SOCIAL_FETCH_TIMEOUT });
    assertTabPanelSettled('social-tab-panel-shorts', 'Loading shorts');
    cy.get('[data-testid="social-post-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain.text', 'Skyline update');
  });

  clickFetchTab('images');
  cy.wait('@socialImages', { timeout: SOCIAL_FETCH_TIMEOUT });
  assertTabPanelSettled('social-tab-panel-images', 'Loading images');
  cy.get('[data-testid="social-image-result"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('have.attr', 'href')
    .and('include', 'avatars.githubusercontent.com');

  clickFetchTabIfPresent('followers', () => {
    cy.wait('@socialFollowers', { timeout: SOCIAL_FETCH_TIMEOUT });
    assertTabPanelSettled('social-tab-panel-followers', 'Loading followers');
    cy.get('[data-testid="social-follower-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain.text', '@loislane');
    cy.docsScreenshot('social-followers-popup');
  });

  clickFetchTabIfPresent('following', () => {
    cy.wait('@socialFollowing', { timeout: SOCIAL_FETCH_TIMEOUT });
    assertTabPanelSettled('social-tab-panel-following', 'Loading following');
    cy.get('[data-testid="social-following-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain.text', '@loislane');
  });

  clickFetchTab('onlinePresence');
  cy.wait('@socialOnlinePresence', { timeout: SOCIAL_FETCH_TIMEOUT });
  assertTabPanelSettled('social-tab-panel-online-presence', 'Loading online presence');
  cy.get('[data-testid="social-online-presence-result"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .first()
    .should('contain.text', 'superman0011 on GitHub');

  clickFetchTab('stealerLogs');
  cy.wait('@socialStealerLogs', { timeout: SOCIAL_FETCH_TIMEOUT });
  cy.get('[data-testid="social-tab-panel-stealer-logs"]', { timeout: SOCIAL_FETCH_TIMEOUT }).should('be.visible');
  cy.get('[data-testid="social-stealerlog-row"]', { timeout: SOCIAL_FETCH_TIMEOUT })
    .should('have.length.greaterThan', 0)
    .then(($rows) => {
      const matchingRow = [...$rows].find((row) => {
        const text = row.textContent || '';
        const domain = row.querySelector('[title]')?.getAttribute('title') || '';
        return isStealerDomain(domain) && text.includes(SOCIAL_STEALER_USERNAME);
      });
      expect(matchingRow, `stealer tab row includes ${SOCIAL_STEALER_DOMAIN} and ${SOCIAL_STEALER_USERNAME}`).to.exist;
    });
}

export function assertManageProfilesForScannedResult() {
  cy.get('[data-testid="social-list-manage-profiles"]').first().click();
  cy.get('[data-testid="social-manage-profiles-modal"]').should('be.visible');
  cy.docsScreenshot('social-manage-profiles');
  cy.get('[data-testid="social-manage-profiles-filter"]').clear().type('twitter');
  cy.get('[data-testid="social-manage-profile-card"]').should('have.length.greaterThan', 0);
  cy.get('[data-testid="social-manage-profile-switch"]').first().should('have.attr', 'role', 'switch');
  cy.get('[data-testid="social-manage-profiles-close"]').click();
  cy.get('[data-testid="social-manage-profiles-modal"]').should('not.exist');
}

export function assertSocialSidebarAndBackNavigation() {
  cy.get('[data-testid="graph-sidebar-collapse"]').should('be.visible').click();
  cy.get('[data-testid="graph-sidebar-expand"]').should('be.visible');
  cy.get('[data-testid="graph-sidebar-expand"]').click();
  cy.get('[data-testid="social-scan-control"]').should('be.visible');
  cy.get('[data-testid="social-header-back"]').click();
  cy.location('pathname').should('match', /^\/dashboard\/(home|profile\/homepage)/);
}

export function assertSocialEmptyStateIfNoResults() {
  cy.get('body').then(($body) => {
    const $emptyState = $body.find(SOCIAL_LIST_EMPTY);
    if ($body.find(SOCIAL_PLATFORM_CARD).length === 0 && $emptyState.length > 0) {
      cy.wrap($emptyState).within(() => {
        cy.get(SOCIAL_PROFILE_EMPTY_CARD).should('be.visible');
        cy.get(SOCIAL_PROFILE_EMPTY_OVERVIEW_BUTTON).should('contain.text', 'Profile Overview').and('be.disabled');
        cy.get('[data-testid="social-platform-search-empty"]').should('be.disabled');
        cy.get('[data-testid="social-list-empty-manage-profiles"]').should('be.disabled');
      });
    }
  });
}

function clickFetchTab(tabKey: string) {
  cy.get(`[data-testid="social-fetch-tab"][data-tab-key="${tabKey}"]`, { timeout: SOCIAL_FETCH_TIMEOUT })
    .scrollIntoView()
    .should('be.visible')
    .click();
}

function clickFetchTabIfPresent(tabKey: string, assertions: () => void) {
  cy.get('body').then(($body) => {
    if ($body.find(`[data-testid="social-fetch-tab"][data-tab-key="${tabKey}"]`).length === 0) {
      return;
    }
    clickFetchTab(tabKey);
    assertions();
  });
}

function assertTabPanelSettled(panelTestId: string, loadingText: string) {
  cy.get(`[data-testid="${panelTestId}"]`, { timeout: SOCIAL_FETCH_TIMEOUT }).should('be.visible');
  cy.get(`[data-testid="${panelTestId}"]`, { timeout: SOCIAL_FETCH_TIMEOUT }).should(($panel) => {
    const text = ($panel.text() || '').replace(/\s+/g, ' ').trim();
    expect(text).not.to.include(loadingText);
    expect(text.length).to.be.greaterThan(0);
  });
}
