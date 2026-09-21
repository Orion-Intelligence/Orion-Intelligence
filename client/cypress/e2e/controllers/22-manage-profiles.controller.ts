import { stubExtensionPresence } from './08-social-extension.controller';

export function setupManageProfilesStubs() {
  stubExtensionPresence(true);
  cy.intercept('GET', '**/api/extension/session', {
    statusCode: 200,
    body: { extension_connected: true }
  }).as('extensionSession');

  cy.intercept('POST', '**/api/manage-profiles/platforms', {
    statusCode: 200,
    body: { status: 'done', result: { items: [{ platform: 'twitter', base: 'https://twitter.com' }] } }
  }).as('manageProfilesPlatforms');

  cy.intercept('POST', '**/api/manage-profiles/sessions', {
    statusCode: 200,
    body: { status: 'done', result: { platforms: { twitter: [{ id: 'session123', platform: 'twitter', capturedAt: '2026-09-04T12:00:00Z', verified: true, username: 'testuser' }] } } }
  }).as('manageProfilesSessions');

  cy.intercept('GET', '**/api/manage-profiles/personas', {
    statusCode: 200,
    body: { personas: [] }
  }).as('manageProfilesPersonas');

  cy.intercept('GET', '**/api/manage-profiles/profiles', {
    statusCode: 200,
    body: { profiles: [] }
  }).as('manageProfilesProfiles');

  cy.intercept('POST', '**/api/manage-profiles/personas', {
    statusCode: 200,
    body: { persona_id: 'p1', name: 'Test Persona', adult_status: true, age_group: '25-34', gender: 'male', city: 'New York', country: 'USA', interests: ['tech'] }
  }).as('manageProfilesPersonaCreate');

  cy.intercept('POST', '**/api/manage-profiles/profiles', {
    statusCode: 200,
    body: { profile_id: 'prof1', platform: 'twitter', profile_username: 'testuser', connection_status: 'connected', assigned_persona_id: null }
  }).as('manageProfilesProfileCreate');
  
  cy.intercept('POST', '**/api/manage-profiles/assignments', {
    statusCode: 200,
    body: { status: 'assigned' }
  }).as('manageProfilesAssignmentCreate');

  cy.intercept('DELETE', '**/api/manage-profiles/results*', {
    statusCode: 200,
    body: { status: 'success', message: 'Results cleared' }
  }).as('manageProfilesResultsClear');

  cy.intercept('GET', '**/api/manage-profiles/results', {
    statusCode: 200,
    body: {
      active_runs: [
        {
          run_id: 'run1',
          profile_id: 'prof1',
          platform: 'twitter',
          activity: 'posting',
          is_manual: false,
          started_at: '2026-09-04T12:05:00Z',
          step: 'opening composer'
        }
      ],
      ad_detection_results: [
        {
          date_time: '2026-09-04T12:00:00Z',
          total_detected_ads: 2,
          is_manual: true,
          ads: [
            { author: 'AdAuthor1', url: 'https://twitter.com/ad1', content_text: 'Ad text 1', likes: '10', shares: '2', views: '100', detected_at: '2026-09-04T12:00:00Z' }
          ]
        }
      ],
      post_results: [
        {
          date_time: '2026-09-04T12:00:00Z',
          post_url: 'https://twitter.com/post1',
          error: false,
          is_manual: true
        }
      ]
    }
  }).as('manageProfilesResults');
}

export function visitManageProfiles() {
  cy.viewport(1920, 1080);
  cy.visit('/dashboard/manage-profiles');
  cy.get('[data-testid="manage-profiles-page"]').should('be.visible');
}

export function assertSessionsTab() {
  cy.get('[data-testid="manage-profiles-tab-sessions"]').click();
  cy.wait(['@manageProfilesPlatforms', '@manageProfilesSessions']);
  
  cy.get('[data-testid="manage-profiles-platform"]').should('contain.text', 'twitter');
  
  cy.get('[data-testid="manage-profiles-session-toggle"]').click();
  cy.get('[data-testid="manage-profiles-session-list"]').should('be.visible');
  cy.get('[data-testid="manage-profiles-session-list"]').should('contain.text', 'session1');
  cy.get('[data-testid="manage-profiles-session-list"]').should('contain.text', '@testuser');
  
  cy.get('[data-testid="manage-profiles-session-verify"]').should('be.visible');
  cy.get('[data-testid="manage-profiles-session-edit"]').should('be.visible');
  cy.get('[data-testid="manage-profiles-session-delete"]').should('be.visible');
}

export function assertPersonasTab() {
  cy.get('[data-testid="manage-profiles-tab-personas"]').click();
  cy.wait('@manageProfilesPersonas');
  
  cy.get('[data-testid="manage-profiles-add-persona"]').click();
  cy.get('[data-testid="manage-profile-popup-drawer"]').should('be.visible');
  
  cy.get('input[name="personaName"]').clear().type('Test Persona');
  cy.get('input[name="country"]').clear().type('USA');
  cy.get('input[name="city"]').clear().type('New York');
  
  cy.intercept('GET', '**/api/manage-profiles/personas', {
    statusCode: 200,
    body: { personas: [{ persona_id: 'p1', name: 'Test Persona', adult_status: true, age_group: '25-34', gender: 'male', city: 'New York', country: 'USA', interests: ['tech'] }] }
  }).as('manageProfilesPersonasList2');

  cy.get('[data-testid="manage-profile-popup-save"]').click();
  cy.wait('@manageProfilesPersonaCreate');
  cy.wait('@manageProfilesPersonasList2');
  
  cy.get('[data-testid="manage-profile-popup-drawer"]').should('not.exist');
  
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'Test Persona');
}

export function assertProfilesTab() {
  cy.get('[data-testid="manage-profiles-tab-profiles"]').click();
  cy.wait('@manageProfilesProfiles');
  
  cy.get('[data-testid="manage-profiles-add-profile"]').click();
  cy.get('[data-testid="manage-profile-popup-drawer"]').should('be.visible');
  
  cy.get('input[name="profileUsername"]').clear().type('testuser');
  
  cy.contains('Select platform').click();
  cy.get('button[role="option"]').contains('twitter', { matchCase: false }).click();
  
  cy.contains('Select session').click();
  cy.get('button[role="option"]').contains('session1', { matchCase: false }).click();
  
  cy.contains('Select actions').click();
  cy.get('.ui-dropdown-menu').first().find('button').first().click();
  
  cy.get('h3').contains('Account Details').click();
  
  cy.intercept('GET', '**/api/manage-profiles/profiles', {
    statusCode: 200,
    body: { profiles: [{ profile_id: 'prof1', platform: 'twitter', profile_username: 'testuser', connection_status: 'connected', assigned_persona_id: null }] }
  }).as('manageProfilesProfilesList2');

  cy.get('[data-testid="manage-profile-popup-save"]').click();
  cy.wait('@manageProfilesProfileCreate');
  cy.wait('@manageProfilesProfilesList2');
  
  cy.get('[data-testid="manage-profile-popup-drawer"]').should('not.exist');
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'testuser');
}

export function assertAssignmentsTab() {
  cy.get('[data-testid="manage-profiles-tab-assignments"]').click();
  cy.get('[data-testid="manage-profiles-running-scans"]').should('contain.text', '1 scan running').and('contain.text', 'Post').and('contain.text', 'opening composer');
  
  cy.intercept('GET', '**/api/manage-profiles/profiles', {
    statusCode: 200,
    body: { profiles: [{ profile_id: 'prof1', platform: 'twitter', profile_username: 'testuser', connection_status: 'connected', assigned_persona_id: 'p1', session_id: 'sess-1' }] }
  }).as('manageProfilesProfilesAssigned');

  cy.get('[data-testid="manage-profiles-assign-btn"]').should('not.exist');
  cy.get('[data-testid="manage-profiles-assign-persona"]').click();
  cy.get('button[role="option"]').contains('Test Persona').click();
  cy.wait('@manageProfilesAssignmentCreate').its('request.body').should('deep.equal', { persona_id: 'p1', profile_id: 'prof1' });
  
  cy.wait('@manageProfilesProfilesAssigned');
  cy.get('[data-testid="manage-profiles-assign-persona"]').should('not.exist');
  
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'Test Persona');
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'twitter');

  cy.intercept('POST', '**/api/manage-profiles/profiles/prof1/trigger-post-monitoring', {
    statusCode: 200,
    body: {}
  }).as('manageProfilesTriggerPostMonitoring');

  cy.intercept('POST', '**/api/manage-profiles/profiles/prof1/trigger-ad-monitoring', {
    statusCode: 200,
    body: {}
  }).as('manageProfilesTriggerAdMonitoring');

  cy.get('button[title="Trigger Post Monitoring"]').click();
  cy.wait('@manageProfilesTriggerPostMonitoring');
  
  cy.get('button[title="Trigger Ad Monitoring"]').click();
  cy.wait('@manageProfilesTriggerAdMonitoring');
}

export function assertResultsTab() {
  cy.get('[data-testid="manage-profiles-tab-results"]').click();
  cy.wait('@manageProfilesResults');

  cy.get('[data-testid="manage-profiles-result-row"][data-running="true"]').should('have.length', 1);
  cy.get('[data-testid="manage-profiles-result-row"][data-running="true"]').should('contain.text', 'Running');
  cy.get('[data-testid="manage-profiles-result-row"][data-running="true"]').should('contain.text', 'Publishing post');
  cy.get('[data-testid="manage-profiles-result-row"][data-running="true"]').should('contain.text', 'opening composer');

  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', '2 ads detected');
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'Completed');
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'Manual');
  cy.get('[data-testid="manage-profiles-page"]').should('not.contain.text', 'https://twitter.com/post1');

  cy.get('[data-testid="manage-profiles-page"]').contains('2 ads detected').click();
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'AdAuthor1');
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', 'https://twitter.com/ad1');

  cy.get('[data-testid="manage-profiles-results-profile-filter"]').should('be.visible');
  cy.get('[data-testid="manage-profiles-results-view"]').should('be.visible').click();
  cy.get('button[role="option"]').contains('Posts').click();
  cy.get('[data-testid="manage-profiles-post-row"]').should('have.length', 1);
  cy.get('[data-testid="manage-profiles-post-row"]').should('contain.text', 'Published');
  cy.get('[data-testid="manage-profiles-post-row"]').should('contain.text', 'https://twitter.com/post1');
  cy.get('[data-testid="manage-profiles-page"]').should('not.contain.text', '2 ads detected');
  cy.get('[data-testid="manage-profiles-results-view"]').click();
  cy.get('button[role="option"]').contains('Ads').click();
  cy.get('[data-testid="manage-profiles-page"]').should('contain.text', '2 ads detected');
  cy.get('[data-testid="manage-profiles-results-clear"]').should('be.enabled').click();
  cy.get('[data-testid="confirmation-popup"]').should('be.visible');
  cy.get('[data-testid="confirmation-yes-button"]').click();
  cy.wait('@manageProfilesResultsClear');
}
