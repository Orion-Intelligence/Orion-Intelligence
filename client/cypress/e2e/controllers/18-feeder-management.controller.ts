let feederValidationData: any = null;
export const FEEDER_RULE_KEYS = [
  'apt',
  'defacement',
  'exploit',
  'forum',
  'generic',
  'leak',
  'malware',
  'mastodon',
  'news',
  'pastebin',
  'reddit',
  'tracking',
  'twitter',
];
const FILE_RULE_KEYS = FEEDER_RULE_KEYS.filter((ruleKey) => ruleKey !== 'generic');
const FEEDER_TEST_RULE_LIMIT = 4;

export function openFeederAsAdmin() {
  cy.loginAsAdmin();
  cy.visit('/dashboard/profile/homepage');
  cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="sidebar-subitem-profile-feeder"]').should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="feeder-page-title"]').should('be.visible').and('contain.text', 'Feeder Scripts');
}

export function openFeederAsUser(username: string, password: string) {
  cy.intercept('POST', '**/api/token').as('loginRequest');
  cy.visit('/login');
  cy.get('[data-testid="login-user"]').should('be.visible').clear().type(username);
  cy.get('[data-testid="login-pass"]').should('be.visible').clear().type(password, { log: false });
  cy.get('[data-testid="login-button"], input.login-button').first().should('be.visible').click();
  cy.get('[data-testid="dashboard-main"]').should('be.visible');
  cy.get('[data-testid="sidebar-group-profile"]').should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="sidebar-subitem-profile-feeder"]').should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="feeder-page-title"]').should('be.visible').and('contain.text', 'Feeder Scripts');
}

function getFixturePath(path: string) {
  return `cypress/fixtures/${path}`;
}

function getWrongFileCategory(ruleKey: string) {
  const currentIndex = FILE_RULE_KEYS.indexOf(ruleKey);
  const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % FILE_RULE_KEYS.length;
  return feederValidationData.categories[FILE_RULE_KEYS[nextIndex]];
}

function selectFeederRule(ruleKey: string) {
  return cy.get(`[data-testid="feeder-rule-option-${ruleKey}"]`).then(($option) => {
    cy.get('[data-testid="feeder-rule-select"]').should('be.visible').and('not.be.disabled').select($option.attr('value')!);
    cy.get('[data-testid="feeder-rule-select"]')
      .find(':selected')
      .should('have.attr', 'data-testid', `feeder-rule-option-${ruleKey}`);
    cy.wait(250);
  });
}

export function assertFeederRuleOptions() {
  cy.get('[data-testid="feeder-rule-select"]').should('be.visible');
  cy.get('[data-testid="feeder-rule-select"] option').then(($options) => {
    const actualRuleKeys = [...$options]
      .map((option) => option.getAttribute('data-testid') || '')
      .filter(Boolean)
      .map((testId) => testId.replace('feeder-rule-option-', ''));

    expect(actualRuleKeys.length).to.be.greaterThan(11);
  });
}

export function openFeederRule(ruleKey: string) {
  return selectFeederRule(ruleKey);
}

function openAddTab() {
  return openTabIfPresent('feeder-tab-add', () => {
    cy.wait(250);
  });
}

function openScriptTab() {
  return openTabIfPresent('feeder-tab-script', () => {
    cy.wait(250);
  });
}

export function openFeederScriptTab() {
  return openScriptTab();
}

function openTabIfPresent(testId: string, callback: () => void) {
  return cy.get('body').then(($body) => {
    const tab = $body.find(`[data-testid="${testId}"]:visible`).first();
    if (!tab.length) {
      return;
    }
    cy.wrap(tab).click();
    return cy.then(() => {
      return callback();
    });
  });
}

function uploadScript(category: any) {
  if (!category.fileFixture || !category.fileName) {
    return;
  }

  cy.get('[data-testid="feeder-select-file-button"]').filter(':visible').first().should('be.visible');
  cy.get('[data-testid="feeder-file-input"]')
    .last()
    .selectFile(getFixturePath(category.fileFixture), { force: true });
  cy.wait(250);
  cy.get('[data-testid="feeder-upload-script-button"]').should('be.visible').click();

  if (category.ruleType === 'shared') {
    cy.get('[data-testid="message-notification-text"]', { timeout: 4000 })
      .should('be.visible')
      .and('contain.text', 'Upload completed successfully');
    openAddTab();
    return cy.get('[data-testid="feeder-values-input"]', { timeout: 4000 }).should('be.visible');
  }

  return cy.wait(250);
}

function expectWrongFileUploadError(category: any) {
  const wrongCategory = getWrongFileCategory(category.ruleKey);
  if (!wrongCategory?.fileFixture) {
    return;
  }

  cy.get('[data-testid="feeder-select-file-button"]').filter(':visible').first().should('be.visible');
  cy.get('[data-testid="feeder-file-input"]')
    .last()
    .selectFile(getFixturePath(wrongCategory.fileFixture), { force: true });
  cy.wait(250);
  cy.get('[data-testid="feeder-upload-script-button"]').should('be.visible').click();
  cy.get('[data-testid="feeder-form-error"], [data-testid="message-notification-text"]', { timeout: 4000 }).should('exist');
}

function uploadFirstValue(fixturePath: string) {
  return cy.fixture(fixturePath, 'utf8').then((text) => {
    const firstValue = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (!firstValue) {
      return;
    }

    cy.get('[data-testid="feeder-values-input"]').should('be.visible').clear().type(firstValue, { delay: 0 });
    cy.get('[data-testid="feeder-upload-values-button"]').should('be.visible').click();
    cy.wait(250);
  });
}

function expectWrongValueUploadError(fixturePath: string) {
  return cy.fixture(fixturePath, 'utf8').then((text) => {
    const firstValue = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find(Boolean);

    if (!firstValue) {
      return;
    }

    cy.get('[data-testid="feeder-values-input"]').should('be.visible').clear().type(firstValue, { delay: 0 });
    cy.get('[data-testid="feeder-upload-values-button"]').should('be.visible').click();
    cy.get('[data-testid="feeder-form-error"], [data-testid="message-notification-text"]', { timeout: 4000 }).should('exist');
  });
}

function clearVisibleValueRows() {
  return cy.get('body').then(($body) => {
    const button = $body.find('[data-testid^="feeder-value-delete-button-"]:visible').first();
    if (!button.length) {
      return;
    }
    cy.wrap(button).click();
    cy.get('[data-testid="confirmation-yes-button"]').should('be.visible').click();
    cy.wait(250);
    return clearVisibleValueRows();
  });
}

function clearScripts() {
  return cy.contains('.ui-section-title', 'Your Scripts', { timeout: 4000 }).should('be.visible').then(() => {
    return cy.get('[data-testid="feeder-empty-scripts"], [data-testid^="feeder-script-row-"], [data-testid="feeder-clear-all-button"]', { timeout: 4000 })
      .should('exist')
      .then(() =>
        cy.get('body', { timeout: 4000 }).should(($body) => {
          const hasEmptyState = $body.find('[data-testid="feeder-empty-scripts"]:visible').length > 0;
          const hasEnabledClearButton = $body.find('[data-testid="feeder-clear-all-button"]:visible:not(:disabled)').length > 0;
          expect(hasEmptyState || hasEnabledClearButton).to.eq(true);
        })
      )
      .then(() => cy.get('body'))
      .then(($body) => {
        const enabledClearButton = $body.find('[data-testid="feeder-clear-all-button"]:visible:not(:disabled)').first();
        if (enabledClearButton.length) {
          cy.wrap(enabledClearButton).click({ force: true });
          cy.get('[data-testid="confirmation-popup"]').should('be.visible');
          cy.get('[data-testid="confirmation-yes-button"]').should('be.visible').click({ force: true });
          cy.get('[data-testid="feeder-empty-scripts"], [data-testid="feeder-clear-all-button"]:disabled', { timeout: 4000 })
            .should('exist');
          return;
        }

        const hasEmptyState = $body.find('[data-testid="feeder-empty-scripts"]:visible').length > 0;
        if (hasEmptyState) {
          return;
        }

        throw new Error('Script panel has neither a visible clear button nor an empty state');
      });
  });
}

function confirmPopup() {
  cy.get('[data-testid="confirmation-popup"]').should('be.visible');
  cy.get('[data-testid="confirmation-yes-button"]').should('be.visible').click({ force: true });
}

export function transferFirstVisibleScriptOwner(username: string) {
  return openScriptTab().then(() => {
    cy.get('[data-testid^="feeder-script-owner-button-"]').filter(':visible').first().click({ force: true });
    cy.get('[data-testid="feeder-owner-dialog"]').should('be.visible');
    cy.get(`[data-testid="feeder-owner-option-${username}"]`).then(($option) => {
      cy.get('[data-testid="feeder-owner-select"]').select($option.attr('value')!);
    });
    cy.get('[data-testid="feeder-owner-submit"]').should('be.visible').click({ force: true });
    cy.get('[data-testid="message-notification-text"]', { timeout: 4000 })
      .should('be.visible')
      .and('contain.text', 'Script owner updated successfully');
  });
}

export function expectCurrentUserHasScriptAccess() {
  return openScriptTab().then(() => {
    cy.get('[data-testid^="feeder-script-row-"]').filter(':visible').first().should('exist');
  });
}

export function expectCurrentUserHasNoScriptAccess() {
  return openScriptTab().then(() => {
    cy.get('[data-testid="feeder-empty-scripts"]').should('be.visible');
  });
}

function assertFirstRowStatus(expected: 'enabled' | 'disabled') {
  cy.get('[data-testid^="feeder-script-active-status-"]').filter(':visible').first()
    .should('contain.text', expected);
}

function toggleFirstRowStatus(expected: 'enabled' | 'disabled') {
  cy.get('[data-testid^="feeder-script-toggle-button-"]').filter(':visible').first().click({ force: true });
  confirmPopup();
  cy.get('[data-testid="message-notification-text"]', { timeout: 4000 })
    .should('be.visible')
    .invoke('text')
    .should((text) => {
      expect(text).to.match(/Script (enabled|disabled) successfully|Script status updated successfully/);
    });
  assertFirstRowStatus(expected);
}

function toggleAllStatuses(enabled: boolean) {
  const buttonTestId = enabled ? 'feeder-enable-all-button' : 'feeder-disable-all-button';
  const expectedStatus = enabled ? 'enabled' : 'disabled';

  cy.get(`[data-testid="${buttonTestId}"]`).filter(':visible').first().should('not.be.disabled').click({ force: true });
  confirmPopup();
  cy.wait(250);
  assertFirstRowStatus(expectedStatus);
}

export function loadFeederValidationData() {
  return cy.fixture('feeder/collector-validation.json').then((data) => {
    feederValidationData = data;
    return data;
  });
}

export function clearAllFeederRecords() {
  if (!feederValidationData) {
    throw new Error('Feeder validation data is not loaded');
  }

  cy.wrap(feederValidationData.ruleKeys.slice(0, FEEDER_TEST_RULE_LIMIT)).each((ruleKey) => {
    const category = feederValidationData.categories[ruleKey];

    return cy.then(() => {
      return selectFeederRule(category.ruleKey).then(() => {
        if (category.ruleType !== 'generic') {
          return openTabIfPresent('feeder-tab-script', clearScripts).then(() => {
            return openTabIfPresent('feeder-tab-values', clearVisibleValueRows);
          });
        }

        return openTabIfPresent('feeder-tab-values', clearVisibleValueRows);
      });
    });
  });
}

export function uploadFixtureRecordsForAllFeederRules() {
  if (!feederValidationData) {
    throw new Error('Feeder validation data is not loaded');
  }

  cy.wrap(feederValidationData.ruleKeys.slice(0, FEEDER_TEST_RULE_LIMIT)).each((ruleKey) => {
    const category = feederValidationData.categories[ruleKey];

    return cy.then(() => {
      return selectFeederRule(category.ruleKey).then(() => {
        return openAddTab().then(() => {
          if (category.ruleType === 'generic') {
            return uploadFirstValue(category.valuesFixture);
          }

          return cy.then(() => {
            return uploadScript(category);
          }).then(() => {
            if (category.ruleType === 'shared' && category.valuesFixture) {
              return uploadFirstValue(category.valuesFixture);
            }
          });
        });
      });
    });
  });
}

export function validateFixtureOperationsForAllFeederRules() {
  if (!feederValidationData) {
    throw new Error('Feeder validation data is not loaded');
  }

  cy.wrap(feederValidationData.ruleKeys.slice(0, FEEDER_TEST_RULE_LIMIT)).each((ruleKey) => {
    const category = feederValidationData.categories[ruleKey];

    return cy.then(() => {
      return selectFeederRule(category.ruleKey).then(() => {
        return openAddTab().then(() => {
          if (category.ruleType === 'generic') {
            uploadFirstValue(category.valuesFixture);
            if (category.invalidValuesFixture) {
              expectWrongValueUploadError(category.invalidValuesFixture);
            }
            return;
          }

          return cy.then(() => uploadScript(category))
            .then(() => {
              if (category.ruleType === 'shared' && category.valuesFixture) {
                return uploadFirstValue(category.valuesFixture);
              }
            })
            .then(() => openScriptTab())
            .then(() => {
              toggleFirstRowStatus('disabled');
              toggleFirstRowStatus('enabled');
              toggleAllStatuses(false);
              toggleAllStatuses(true);
            })
            .then(() => openAddTab())
            .then(() => expectWrongFileUploadError(category));
        });
      });
    });
  });
}
