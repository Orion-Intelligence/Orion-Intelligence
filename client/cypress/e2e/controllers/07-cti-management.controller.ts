export function openAndAssertReportModal(title: string) {
  cy.get('[data-testid="cti-tab-session-menu"], [data-testid="social-tab-session-menu"]', {timeout: 15000}).filter(':visible').first().click();
  cy.get('[data-testid="cti-export-report"], [data-testid="social-export-report"]', {timeout: 15000}).filter(':visible').first().click();
  cy.contains(title, {timeout: 10000}).should('be.visible');
  cy.get('[data-testid="graph-report-export-modal"]', {timeout: 10000}).filter(':visible').first().should('be.visible');
  cy.get('[data-testid="graph-report-export-json"]').filter(':visible').first().should('exist');
  cy.get('[data-testid="graph-report-export-graph-pdf"]').filter(':visible').first().should('exist');
}

export function waitForToolbarSearchReady() {
  cy.get('[data-testid="graph-toolbar-search-input"]', {timeout: 30000}).should('be.visible').and('not.be.disabled');
}

export function waitForCtiGraphReady() {
  cy.get('[data-testid="cti-network-container"]', {timeout: 30000}).should('be.visible');
  cy.get('[data-testid="cti-network-container"] canvas', {timeout: 30000}).should('exist');
}

export function visitCtiGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/ctigraph');
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/ctigraph');
  cy.get('[data-testid="graph-toolbar-root"]', {timeout: 30000}).should('be.visible');
}

export function visitSocialGraph() {
  cy.viewport(1440, 900);
  cy.visit('/dashboard/social-mapper');
  cy.location('pathname', {timeout: 30000}).should('include', '/dashboard/social-mapper');
  cy.get('[data-testid="social-graph-root"]', {timeout: 30000}).should('be.visible');
}

export function setupSocialGraphInterceptors() {
  const socialReconBody = {
    result: [
      {
        metadata: {
          platform: 'twitter',
          username: 'image_scan_user',
          url: 'https://x.com/image_scan_user',
          status: 'active'
        },
        data: {
          ids: {
            bio: 'Fetched profile from image flow',
            follower_count: '42'
          }
        }
      },
      {
        metadata: {
          platform: 'github',
          username: 'image_scan_user',
          url: 'https://github.com/image_scan_user',
          status: 'active'
        },
        data: {
          ids: {
            bio: 'Second platform for select-all path'
          }
        }
      }
    ]
  };

  cy.intercept('POST', '**/api/social/recon/image', {
    statusCode: 200,
    body: {
      result: [
        {
          metadata: {
            platform: 'twitter',
            username: 'image_scan_user',
            url: 'https://x.com/image_scan_user'
          },
          data: {
            ids: {
              bio: 'Image scan test profile',
              follower_count: '10'
            }
          }
        }
      ]
    }
  }).as('imageRecon');

  cy.intercept('POST', '**/api/social/recon', (req) => {
    const query = req.body?.query;
    if (query === 'image_scan_user') {
      req.reply({statusCode: 200, body: socialReconBody});
      return;
    }

    req.reply({
      statusCode: 200,
      body: {
        result: [
          {
            metadata: {
              platform: 'twitter',
              username: query || 'scan_result_user',
              url: `https://x.com/${query || 'scan_result_user'}`,
              status: 'active'
            },
            data: {
              ids: {
                bio: `Generated scan for ${query || 'scan_result_user'}`
              }
            }
          }
        ]
      }
    });
  }).as('socialRecon');

  cy.intercept('POST', '**/api/social/metadata', {
    statusCode: 200,
    body: {
      result: {
        query: 'email leaked',
        total_found: 1,
        timestamp: '2026-03-10T00:00:00Z',
        results: [
          {
            title: 'Leak entry',
            url: 'https://example.com/leak',
            snippet: 'Found token in profile metadata'
          }
        ]
      }
    }
  }).as('socialMetadata');

  cy.intercept('POST', '**/api/social/online/images', {
    statusCode: 200,
    body: {
      result: {
        images: [
          {
            image_url: 'https://example.com/img-1.jpg',
            post_url: 'https://example.com/post-1'
          }
        ]
      }
    }
  }).as('socialImages');

  cy.intercept('POST', '**/api/social/followers', {
    statusCode: 200,
    body: {
      result: {
        followers: ['ally_one', 'ally_two', 'ally_three'],
        platform: 'Twitter',
        username: 'image_scan_user',
        status: 'active'
      }
    }
  }).as('socialFollowers');

  cy.intercept('POST', '**/api/social/following', {
    statusCode: 200,
    body: {
      result: {
        following: ['follow_one', 'follow_two'],
        platform: 'Twitter',
        username: 'image_scan_user',
        status: 'active'
      }
    }
  }).as('socialFollowing');
}
