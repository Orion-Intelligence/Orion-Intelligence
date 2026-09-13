import {
  assertFeederRuleOptions,
  clearAllFeederRecords,
  clickIfVisible,
  DEEP_FEEDER_TIMEOUT,
  dismissConfirmation,
  loadFeederValidationData,
  expectCurrentUserHasNoScriptAccess,
  expectCurrentUserHasScriptAccess,
  openBulkConfirmAndCancel,
  openFeederRule,
  openFeederAsAdmin,
  openFeederAsUser,
  openRuleForSharedPanel,
  openTab,
  removeSelectedFileIfPresent,
  transferFirstVisibleScriptOwner,
  validateFixtureOperationsForAllFeederRules,
} from './controllers/16-feeder-management.controller';
import type { ManagedUsers } from './model/05-user-management.model';

let testUsers = {} as ManagedUsers;
let adminUsername = '';

describe('Orion Intelligence - Feeder Management', () => {
  before(() => {
    cy.env(['TEST_USERS', 'ADMIN_USERNAME']).then(({ TEST_USERS, ADMIN_USERNAME }) => {
      testUsers = (TEST_USERS || {}) as ManagedUsers;
      adminUsername = ADMIN_USERNAME || '';
    });
    loadFeederValidationData();
  });

  after(() => {
    cy.logout();
  });

  it('validates feeder fixture operations across all rules', () => {
    openFeederAsAdmin();
    assertFeederRuleOptions();
    cy.docsScreenshot('feeder-workspace');
    validateFixtureOperationsForAllFeederRules();
  });

  it('grants defacement script access to the first feeder user', () => {
    openFeederAsAdmin();
    openFeederRule('defacement');
    cy.docsScreenshot('feeder-defacement-rule');
    transferFirstVisibleScriptOwner(testUsers.testing6.username);
  });

  it('lets the first feeder user access the transferred defacement script', () => {
    openFeederAsUser(testUsers.testing6.username, testUsers.testing6.password);
    openFeederRule('defacement');
    expectCurrentUserHasScriptAccess();
  });

  it('revokes defacement script access from the first feeder user', () => {
    openFeederAsAdmin();
    openFeederRule('defacement');
    transferFirstVisibleScriptOwner(adminUsername);
  });

  it('removes defacement script access from the first feeder user', () => {
    openFeederAsUser(testUsers.testing6.username, testUsers.testing6.password);
    openFeederRule('defacement');
    expectCurrentUserHasNoScriptAccess();
  });

  it('opens feeder and clears all records', () => {
    openFeederAsAdmin();
    assertFeederRuleOptions();
    clearAllFeederRecords();
  });

  it('exercises add-feeder validation and field handlers for a parser rule', () => {
    openFeederAsAdmin();
    openFeederRule('defacement');
    openTab('feeder-tab-add');

    void cy.get('[data-testid="feeder-select-file-button"]').filter(':visible').first().should('be.visible');

    void cy.get('[data-testid="feeder-upload-script-button"]').filter(':visible').first().click({ force: true });
    void cy.get('[data-testid="feeder-form-error"]').should('be.visible');

    void cy.get('[data-testid="feeder-session-file-input"]')
      .last()
      .selectFile('cypress/fixtures/feeder/crawl_data_defacement.txt', { force: true });
    void cy.get('[data-testid="feeder-form-error"]').should('be.visible');

    void cy.get('[data-testid="feeder-file-input"]')
      .last()
      .selectFile('cypress/fixtures/feeder/unique/_defacement_sample.py', { force: true });
    void cy.wait(300);
    removeSelectedFileIfPresent();
  });

  it('exercises add-feeder value handlers for a generic rule', () => {
    openFeederAsAdmin();
    openFeederRule('generic');
    openTab('feeder-tab-add');

    void cy.get('[data-testid="feeder-values-input"]')
      .should('be.visible')
      .clear()
      .type('https://example.com/deep-a\nhttps://example.com/deep-b', { delay: 0 });
    void cy.get('[data-testid="feeder-values-input"]').clear();
    clickIfVisible('[data-testid="feeder-upload-values-button"]');
    void cy.wait(400);
  });

  it('exercises the shared-rule add-feeder setup panel', () => {
    openFeederAsAdmin();
    openRuleForSharedPanel();
    openTab('feeder-tab-add');

    void cy.get('body').then(($body) => {
      if (!$body.find('[data-testid="feeder-select-file-button"]:visible').length) {
        return;
      }
      void cy.get('[data-testid="feeder-select-file-button"]').filter(':visible').first().should('be.visible');
      void cy.get('[data-testid="feeder-file-input"]')
        .last()
        .selectFile('cypress/fixtures/feeder/shared/_pastebin_sample.py', { force: true });
      void cy.wait(300);
      removeSelectedFileIfPresent();
    });

    void cy.get('body').then(($body) => {
      if (!$body.find('[data-testid="feeder-select-session-file-button"]:visible').length) {
        return;
      }
      void cy.get('[data-testid="feeder-select-session-file-button"]').filter(':visible').first().should('be.visible');
      void cy.get('[data-testid="feeder-session-file-input"]')
        .last()
        .selectFile('cypress/fixtures/feeder/crawl_data_pastebin.txt', { force: true });
      void cy.get('[data-testid="feeder-form-error"]').should('be.visible');
    });
  });

  it('drives the feeder script table rows, sorting, selection and row actions', () => {
    openFeederAsAdmin();
    openFeederRule('defacement');
    openTab('feeder-tab-add');

    void cy.get('[data-testid="feeder-select-file-button"]').filter(':visible').first().should('be.visible');
    void cy.get('[data-testid="feeder-file-input"]')
      .last()
      .selectFile('cypress/fixtures/feeder/unique/_defacement_sample.py', { force: true });
    void cy.wait(300);
    void cy.get('[data-testid="feeder-upload-script-button"]').filter(':visible').first().click({ force: true });
    void cy.wait(600);
    void cy.get('body').then(($body) => {
      const yes = $body.find('[data-testid="confirmation-yes-button"]:visible').first();
      if (yes.length) {
        void cy.wrap(yes).click({ force: true });
      }
    });

    openTab('feeder-tab-script');
    void cy.get('[data-testid^="feeder-script-row-"]', { timeout: DEEP_FEEDER_TIMEOUT })
      .filter(':visible')
      .first()
      .should('exist');

    void cy.get('thead button').filter(':visible').each(($btn) => {
      void cy.wrap($btn).click({ force: true });
      void cy.wrap($btn).click({ force: true });
    });

    void cy.get('[data-testid="feeder-search-input"]').filter(':visible').first().clear().type('cypress');
    void cy.get('[data-testid="feeder-search-input"]').filter(':visible').first().clear();
    void cy.get('[data-testid="feeder-reload-button"]').filter(':visible').first().click({ force: true });
    void cy.wait(400);

    void cy.get('[data-testid^="feeder-script-view-button-"]').filter(':visible').first().click({ force: true });
    void cy.wait(200);
    void cy.get('[data-testid^="feeder-script-view-button-"]').filter(':visible').first().click({ force: true });

    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mousedown', { button: 0 });
    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mouseover');
    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mouseleave');
    void cy.get('body').trigger('mouseup');
    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mousedown', { button: 0, ctrlKey: true });
    void cy.get('body').trigger('mouseup');
    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mousedown', { button: 0, shiftKey: true });
    void cy.get('body').trigger('mouseup');
    void cy.get('body').click(0, 0);

    void cy.get('[data-testid^="feeder-script-toggle-button-"]').filter(':visible').first().click({ force: true });
    dismissConfirmation(false);

    openBulkConfirmAndCancel('feeder-enable-all-button');
    openBulkConfirmAndCancel('feeder-disable-all-button');
    openBulkConfirmAndCancel('feeder-clear-all-button');

    void cy.get('body').then(($body) => {
      const owner = $body.find('[data-testid^="feeder-script-owner-button-"]:visible').first();
      if (owner.length) {
        void cy.wrap(owner).click({ force: true });
        void cy.get('[data-testid="feeder-owner-dialog"]').should('be.visible');
        void cy.get('[data-testid="feeder-owner-cancel"]').filter(':visible').first().click({ force: true });
      }
    });

    void cy.get('[data-testid^="feeder-script-delete-button-"]').filter(':visible').first().click({ force: true });
    dismissConfirmation(false);
  });

  it('drives the feeder values table rows and actions', () => {
    openFeederAsAdmin();
    openFeederRule('generic');
    openTab('feeder-tab-add');

    void cy.get('[data-testid="feeder-values-input"]')
      .should('be.visible')
      .clear()
      .type('https://example.com/values-a\nhttps://example.com/values-b', { delay: 0 });
    clickIfVisible('[data-testid="feeder-upload-values-button"]');
    void cy.wait(600);

    openTab('feeder-tab-values');

    void cy.get('body').then(($body) => {
      if ($body.find('[data-testid^="feeder-value-row-"]:visible').length) {
        void cy.get('thead button').filter(':visible').each(($btn) => {
          void cy.wrap($btn).click({ force: true });
        });
        clickIfVisible('[data-testid="feeder-value-view-button-0"]');
        void cy.wait(200);
        clickIfVisible('[data-testid="feeder-value-view-button-0"]');

        void cy.get('body').then(($inner) => {
          const del = $inner.find('[data-testid^="feeder-value-delete-button-"]:visible').first();
          if (del.length) {
            void cy.wrap(del).click({ force: true });
            dismissConfirmation(false);
          }
        });
        openBulkConfirmAndCancel('feeder-clear-all-values-button');
      }
    });
  });

  it('confirms feeder bulk toggles, selection ranges and owner selection', () => {
    openFeederAsAdmin();
    openFeederRule('defacement');
    openTab('feeder-tab-add');

    void cy.get('[data-testid="feeder-select-file-button"]').filter(':visible').first().should('be.visible');
    void cy.get('[data-testid="feeder-file-input"]')
      .last()
      .selectFile('cypress/fixtures/feeder/unique/_defacement_sample.py', { force: true });
    void cy.wait(300);
    void cy.get('[data-testid="feeder-upload-script-button"]').filter(':visible').first().click({ force: true });
    void cy.wait(600);
    void cy.get('body').then(($body) => {
      const yes = $body.find('[data-testid="confirmation-yes-button"]:visible').first();
      if (yes.length) {
        void cy.wrap(yes).click({ force: true });
      }
    });

    openTab('feeder-tab-script');
    void cy.get('[data-testid^="feeder-script-row-"]', { timeout: DEEP_FEEDER_TIMEOUT })
      .filter(':visible')
      .first()
      .should('exist');

    void cy.get('[data-testid="feeder-search-input"]').filter(':visible').first().clear().type('defacement');
    void cy.wait(200);
    void cy.get('[data-testid="feeder-search-input"]').filter(':visible').first().clear();

    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mousedown', { button: 0 });
    void cy.get('body').trigger('mouseup');
    void cy.get('[data-feeder-script-row="true"]').filter(':visible').last().trigger('mousedown', { button: 0, shiftKey: true });
    void cy.get('body').trigger('mouseup');
    void cy.get('[data-feeder-script-row="true"]').filter(':visible').first().trigger('mousedown', { button: 0, ctrlKey: true });
    void cy.get('body').trigger('mouseup');
    void cy.get('body').click(0, 0);

    function confirmBulkAction(testId: string) {
      void cy.get('body').then(($body) => {
        const btn = $body.find(`[data-testid="${testId}"]:visible:not(:disabled)`).first();
        if (!btn.length) {
          return;
        }
        void cy.wrap(btn).click({ force: true });
        dismissConfirmation(true);
        void cy.wait(500);
      });
    }

    confirmBulkAction('feeder-enable-all-button');
    confirmBulkAction('feeder-disable-all-button');
    confirmBulkAction('feeder-enable-all-button');

    void cy.get('[data-testid^="feeder-script-toggle-button-"]').filter(':visible').first().click({ force: true });
    dismissConfirmation(true);
    void cy.wait(500);
    void cy.get('[data-testid^="feeder-script-toggle-button-"]').filter(':visible').first().click({ force: true });
    dismissConfirmation(true);
    void cy.wait(500);

    void cy.get('body').then(($body) => {
      const owner = $body.find('[data-testid^="feeder-script-owner-button-"]:visible').first();
      if (!owner.length) {
        return;
      }
      void cy.wrap(owner).click({ force: true });
      void cy.get('[data-testid="feeder-owner-dialog"]').should('be.visible');
      void cy.get('body').then(($dialog) => {
        const select = $dialog.find('[data-testid="feeder-owner-select"]:visible').first();
        const options = $dialog.find('[data-testid^="feeder-owner-option-"]');
        if (select.length && options.length) {
          const value = options.get(0)?.getAttribute('value');
          if (value) {
            void cy.get('[data-testid="feeder-owner-select"]').filter(':visible').first().select(value);
          }
        }
      });
      void cy.get('[data-testid="feeder-owner-cancel"]').filter(':visible').first().click({ force: true });
    });
  });

  it('confirms feeder value previews, status sort and deletions', () => {
    openFeederAsAdmin();
    openFeederRule('generic');
    openTab('feeder-tab-add');

    void cy.get('[data-testid="feeder-values-input"]')
      .should('be.visible')
      .clear()
      .type('https://example.com/deep-delete-a\nhttps://example.com/deep-delete-b', { delay: 0 });
    clickIfVisible('[data-testid="feeder-upload-values-button"]');
    void cy.wait(600);

    openTab('feeder-tab-values');

    void cy.get('body').then(($body) => {
      if (!$body.find('[data-testid^="feeder-value-row-"]:visible').length) {
        return;
      }

      void cy.get('thead button').filter(':visible').each(($btn) => {
        void cy.wrap($btn).click({ force: true });
        void cy.wrap($btn).click({ force: true });
      });

      clickIfVisible('[data-testid="feeder-value-view-button-0"]');
      void cy.wait(200);
      clickIfVisible('[data-testid="feeder-value-view-button-0"]');

      void cy.get('[data-testid="feeder-search-input"]').filter(':visible').first().clear().type('deep-delete-a');
      void cy.wait(200);
      void cy.get('[data-testid="feeder-search-input"]').filter(':visible').first().clear();

      void cy.get('body').then(($inner) => {
        const del = $inner.find('[data-testid^="feeder-value-delete-button-"]:visible').first();
        if (del.length) {
          void cy.wrap(del).click({ force: true });
          dismissConfirmation(true);
          void cy.wait(500);
        }
      });

      void cy.get('body').then(($inner) => {
        const clearAll = $inner.find('[data-testid="feeder-clear-all-values-button"]:visible:not(:disabled)').first();
        if (clearAll.length) {
          void cy.wrap(clearAll).click({ force: true });
          dismissConfirmation(true);
          void cy.wait(500);
        }
      });
    });
  });
});
