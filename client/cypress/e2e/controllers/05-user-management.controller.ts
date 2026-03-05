export interface ManagedUser {
  username: string;
  email: string;
  password: string;
  role: 'Member' | 'Analyst' | 'Demo';
  licenses: string[];
}

const SIDEBAR_GROUP_ROUTE_PREFIX: Record<string, string> = {
  'General Intelligence': 'strategic',
  'Data Breach': 'breach',
  Defacement: 'defacement',
  Social: 'social',
  Exploit: 'exploit',
  Feed: 'feed',
  'Stealer logs': 'stealerlogs',
  'Web Scans': 'scanner',
  'Entity API': 'api',
  Dump: 'dump',
};

function getSidebarGroupTestId(itemName: string): string {
  const routePrefix = SIDEBAR_GROUP_ROUTE_PREFIX[itemName];
  expect(routePrefix, `routePrefix mapping for "${itemName}"`).to.exist;
  return `sidebar-group-${routePrefix}`;
}

export function setSelect(name: 'role' | 'status', optionText: string) {
  cy.get('@addUserModal').find(`select[name="${name}"]`, {timeout: 30000}).should('exist').then(($select) => {
    const optionLabels = [...$select.find('option')].map((opt) => (opt.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean);
    const normalized = optionLabels.map((x) => x.toLowerCase());
    const wanted = optionText.trim().toLowerCase();
    let resolved = optionText;
    if (!normalized.includes(wanted)) {
      if (name === 'role' && wanted === 'member' && normalized.includes('analyst')) {
        resolved = 'Analyst';
      } else if (optionLabels.length > 0) {
        resolved = optionLabels[0];
      }
    }
    cy.wrap($select).select(resolved);
  });
}

export function addUser(user: ManagedUser) {
  cy.url({timeout: 30000}).should('include', '/dashboard/profile/users');
  cy.get('[data-testid="tenant-add-user-button"]', {timeout: 30000}).should('be.visible').scrollIntoView().click();
  cy.get('[data-testid="tenant-add-user-modal"]', {timeout: 30000}).should('be.visible').as('addUserModal');
  cy.get('@addUserModal').find('input[name="username"]', {timeout: 30000}).should('be.visible').clear().type(user.username);
  cy.get('@addUserModal').find('input[name="email"]', {timeout: 30000}).should('be.visible').clear().type(user.email);
  cy.get('@addUserModal').find('input[name="password"]', {timeout: 30000}).should('be.visible').clear().type(user.password);
  setSelect('role', user.role);
  setSelect('status', 'Active');
  const wanted = user.licenses.map((x) => x.trim().toLowerCase());

  cy.get('@addUserModal').find('.license-grid .license-card, .license-card, .license-btn', {timeout: 30000}).should('exist').each(($card) => {
    const label = $card.find('.license-label').text().replace(/\s+/g, ' ').trim().toLowerCase();
    const $checkbox = $card.find('input[type="checkbox"]');
    const shouldBeChecked = wanted.includes(label);
    const isChecked = $checkbox.is(':checked');
    if (shouldBeChecked && !isChecked) cy.wrap($card).click();
    if (!shouldBeChecked && isChecked) cy.wrap($card).click();
  });
  cy.get('@addUserModal').find('[data-testid="tenant-add-user-submit"]', {timeout: 30000}).should('be.visible').click();
  cy.get('[data-testid="tenant-add-user-modal"]', {timeout: 30000}).should('not.exist');
  cy.contains(user.username, {timeout: 30000}).should('exist');
}

export function loginAsUser(username: string, password: string) {
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.visit('/login');
  cy.get('[data-testid="login-user"]', {timeout: 30000}).should('be.visible').clear().type(username);
  cy.get('[data-testid="login-pass"]', {timeout: 30000}).should('be.visible').clear().type(password, {log: false});
  cy.get('[data-testid="login-button"]', {timeout: 30000}).should('be.visible').click();
  cy.url({timeout: 30000}).should('include', '/dashboard/profile');
}

export function loginAndClickSidebar(username: string, sidebarItems: string[], testUsers: any, testData: any) {
  const selectedUser = Object.values(testUsers).find((u: any) => u?.username === username) as ManagedUser | undefined;
  if (!selectedUser?.password) {
    throw new Error(`Missing user/password in Cypress env for username: ${username}`);
  }
  loginAsUser(username, selectedUser.password);
  sidebarItems.forEach((itemName) => {
    const sidebarGroupTestId = getSidebarGroupTestId(itemName);
    cy.get(`[data-testid="${sidebarGroupTestId}"]`, {timeout: 30000}).first().scrollIntoView().should('be.visible').click();

    if (username === 'testing5' && itemName === 'Stealer logs') {
      cy.get('body').then(($b) => {
        if ($b.find('.pro-subscription_container').length) {
          cy.get('.pro-subscription_container').should('be.visible');
          cy.get('.pro-subscription_subscription-options input[type="radio"][value="annual"]').check();
          cy.get('input#name').clear().type(testData.stealer_upgrade_name);
          cy.get('input#phone').clear().type('03001234567');
          cy.get('input#email').clear().type(testData.stealer_upgrade_email);
          cy.get('form.pro-subscription_payment-form').submit();
          cy.get('button.pro-subscription_btn-close', {timeout: 30000}).should('be.visible').click();
        }
      });
    }
  });
  cy.logout();
}

export function openUsersList(usersUrl: string) {
  cy.intercept('POST', '**/api/users').as('usersApi');
  cy.visit(usersUrl);
  cy.wait('@usersApi', {timeout: 30000});
}

export function deleteFirstUser(usersUrl: string) {
  cy.get('#dashboard-container', {timeout: 30000}).scrollTo('bottom', {duration: 300, ensureScrollable: false});

  cy.get('[data-testid="tenant-edit-user-button"]', {timeout: 30000}).then(($btns) => {
    if ($btns.length <= 2) {
      cy.log('Only system users left. Stop.');
      return;
    }
    cy.wrap($btns[0]).scrollIntoView().click();
    cy.get('[data-testid="tenant-delete-user-button"]', {timeout: 30000}).first().should('be.visible').click();

    cy.get('.ui-graph-popup-panel', {timeout: 30000}).should('be.visible').within(() => {
      cy.get('[data-testid="confirmation-yes-button"]').should('be.visible').click();
    });
    cy.get('.ui-graph-popup-panel').should('not.exist');
    openUsersList(usersUrl);
    deleteFirstUser(usersUrl);
  });
}
