import {addUser, deleteFirstUser, loginAndClickSidebar, ManagedUser, openUsersList} from './controllers/05-user-management.controller';

const testUsers = Cypress.env('TEST_USERS') || {};
const testData = Cypress.env('TEST_DATA') || {};
const CREATE_USERS: ManagedUser[] = [
  {username: 'testing1', email: 'a@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free']},
  {username: 'testing2', email: 'b@hotmail.com', password: '1qaz!QAZ', role: 'Analyst', licenses: ['Free', 'OSINT Basic']},
  {username: 'testing3', email: 'c@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free', 'OSINT Advanced']},
  {username: 'testing4', email: 'd@hotmail.com', password: '1qaz!QAZ', role: 'Member', licenses: ['Free', 'Pentester']},
  {username: 'testing5', email: 'e@hotmail.com', password: '1qaz!QAZ', role: 'Demo', licenses: ['Free']}
];

describe('Orion Intelligence - User Management Creation Flow', () => {
  after(() => {
    cy.logout();
  });

  it('creates five users with configured licenses as admin', () => {
    cy.loginAsAdmin();
    cy.intercept('POST', '**/api/users').as('usersApi');
    cy.visit('/dashboard/profile/homepage');
    cy.get('[data-testid="sidebar-group-profile"]', {timeout: 30000}).should('be.visible').scrollIntoView().click();
    cy.get('[data-testid="sidebar-subitem-profile-users"]', {timeout: 30000}).should('be.visible').scrollIntoView().click();
    cy.url({timeout: 30000}).should('include', '/dashboard/profile/users');
    cy.wait('@usersApi', {timeout: 30000});

    CREATE_USERS.forEach((u) => addUser(u));
    cy.logout();
  });

  it('logs in as testing1 and verifies allowed sidebar group access', () => {
    loginAndClickSidebar(testUsers.testing1.username, ['General Intelligence'], testUsers, testData);
  });

  it('logs in as testing2 and verifies assigned license sidebar groups', () => {
    loginAndClickSidebar(testUsers.testing2.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Dump'], testUsers, testData);
  });

  it('logs in as testing3 and verifies assigned license sidebar groups', () => {
    loginAndClickSidebar(testUsers.testing3.username, ['General Intelligence', 'Data Breach', 'Defacement', 'Social', 'Exploit', 'Feed', 'Stealer logs', 'Dump'], testUsers, testData);
  });

  it('logs in as testing4 and verifies scanner and api sidebar groups', () => {
    loginAndClickSidebar(testUsers.testing4.username, ['Web Scans', 'Entity API'], testUsers, testData);
  });
});

describe('Orion Intelligence - User Management Deletion Flow', () => {
  const USERS_URL = '/dashboard/profile/users?page=1';

  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('deletes users sequentially until only system users remain', () => {
    openUsersList(USERS_URL);
    deleteFirstUser(USERS_URL);
    cy.logout();
  });
});
