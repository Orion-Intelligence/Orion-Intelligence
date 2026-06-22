import {
  assertFeederRuleOptions,
  clearAllFeederRecords,
  loadFeederValidationData,
  expectCurrentUserHasNoScriptAccess,
  expectCurrentUserHasScriptAccess,
  openFeederRule,
  openFeederAsAdmin,
  openFeederAsUser,
  transferFirstVisibleScriptOwner,
  validateFixtureOperationsForAllFeederRules,
} from './controllers/18-feeder-management.controller';

let testUsers: any = {};
let adminUsername = '';

describe('Orion Intelligence - Feeder Management', () => {
  before(() => {
    cy.env(['TEST_USERS', 'ADMIN_USERNAME']).then(({ TEST_USERS, ADMIN_USERNAME }) => {
      testUsers = TEST_USERS || {};
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
    validateFixtureOperationsForAllFeederRules();
  });

  it('grants defacement script access to the first feeder user', () => {
    openFeederAsAdmin();
    openFeederRule('defacement');
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
});
