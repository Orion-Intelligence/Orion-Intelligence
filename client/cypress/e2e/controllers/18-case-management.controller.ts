export const CASE_MOVE_STATUS_IDS: Record<string, string> = {
  'Intake Review': 'intake_review',
  'Under Investigation': 'under_investigation',
  'Move back to Intake Review': 'intake_review',
  'Evidence Collection': 'evidence_collection',
  'Verification': 'verification',
  'Regulatory Action': 'regulatory_action',
  'Legal Review': 'legal_review',
  'Resolved': 'resolved'
};

export let caseId = '';
export let linkedCaseId = '';

export const selector = (testId: string) => `[data-testid="${testId}"]`;

function parseCaseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function caseDateMonthStart(label: string): number {
  return new Date(`${label.trim()} 1`).getTime();
}

function moveCaseDatePickerToMonth(targetLabel: string, attempts = 24) {
  cy.get('[data-testid="side-filter-date-month-label"]').filter(':visible').first().invoke('text').then((raw) => {
    const currentLabel = raw.trim();
    if (currentLabel === targetLabel) {
      return;
    }

    expect(attempts, `navigate case date picker to ${targetLabel}`).to.be.greaterThan(0);
    const goPrev = caseDateMonthStart(currentLabel) > caseDateMonthStart(targetLabel);
    const navSelector = goPrev ? '[data-testid="side-filter-date-prev-month"]' : '[data-testid="side-filter-date-next-month"]';
    cy.get(navSelector).filter(':visible').first().click({ force: true });
    moveCaseDatePickerToMonth(targetLabel, attempts - 1);
  });
}

export function selectCaseDate(testId: string, value: string) {
  const date = parseCaseDate(value);
  const monthLabel = date.toLocaleString(undefined, { month: 'long', year: 'numeric' });

  cy.get(selector(testId)).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
  moveCaseDatePickerToMonth(monthLabel);
  cy.get(`[data-testid="side-filter-date-day-${date.getDate()}"]`)
    .filter(':visible')
    .filter((_index, element) => !String(element.getAttribute('class') || '').includes('text-slate-400'))
    .first()
    .scrollIntoView()
    .click({ force: true });
  cy.get(selector(testId)).filter(':visible').first().should('contain.text', value);
}

export function clickHeaderAction(testId: string) {
  cy.scrollTo('top', { ensureScrollable: false });
  cy.get(selector(testId)).last().scrollIntoView().should('exist').click({ force: true });
}

export function assertNotification(message: string) {
  cy.contains(message, { timeout: 60000 }).should('exist');
}

function caseListSelector(id: string): string {
  return `${selector(`case-row-${id}`)}, ${selector(`case-mobile-card-${id}`)}`;
}

export function openCaseFiltersIfCollapsed() {
  cy.get('body').then(($body) => {
    const toggle = $body.find(selector('case-filter-mobile-toggle')).filter(':visible').first();
    if (toggle.length && toggle.attr('aria-expanded') !== 'true') {
      cy.wrap(toggle).click({ force: true });
    }
  });
}

export function selectCaseFilterDropdown(testId: string, optionLabel: string) {
  openCaseFiltersIfCollapsed();
  cy.get(selector(testId)).filter(':visible').first().scrollIntoView().should('be.visible').then(($button) => {
    const menuId = $button.attr('aria-controls');
    expect(menuId, `${testId} dropdown menu id`).to.exist;

    cy.wrap($button).click({ force: true });
    cy.get(`#${menuId}`, { timeout: 60000 })
      .should('be.visible')
      .contains('[role="option"]', optionLabel)
      .click({ force: true });
  });
}

export function typeCaseFilterSearch(value: string) {
  openCaseFiltersIfCollapsed();
  cy.get(selector('case-filter-search')).filter(':visible').first().scrollIntoView().should('be.visible').clear().type(value);
}

export function assertCaseVisibleInList(id: string) {
  cy.get(caseListSelector(id), { timeout: 60000 }).filter(':visible').first().scrollIntoView().should('be.visible');
}

export function assertCaseHiddenInList(id: string) {
  cy.get(caseListSelector(id), { timeout: 60000 }).should('not.exist');
}

export function createCase(title: string, description: string, entityValue: string, assignId: (id: string) => void) {
  let createdCaseId = '';
  cy.get(selector('add-case-button')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
  cy.get(selector('case-add-drawer')).filter(':visible').first().should('be.visible');
  cy.get(selector('case-add-id-input'))
    .should(($input) => expect(String($input.val() || '')).not.to.equal(''))
    .invoke('val')
    .then((value) => {
      createdCaseId = String(value || '');
      assignId(createdCaseId);
    });
  cy.get(selector('case-add-title-input')).should('be.visible').type(title);
  cy.get(selector('case-add-description-input')).should('be.visible').type(description);
  cy.get(selector('case-add-type-select')).should('be.visible').select('fraud');
  cy.get(selector('case-add-intake-source-select')).should('be.visible').select('soc_alert');
  cy.get(selector('case-add-severity-select')).should('be.visible').select('high');
  cy.get(selector('case-add-priority-select')).should('be.visible').select('high');
  cy.get(selector('case-primary-entity-value-input')).scrollIntoView().should('be.visible').type(entityValue);
  cy.get(selector('case-add-save')).filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });

  assertNotification('Case added successfully');
  cy.then(() => {
    cy.get(selector(`case-row-${createdCaseId}`)).should('be.visible');
  });
}

export function openCaseManagement() {
  cy.visit('/dashboard/profile/homepage');
  cy.get('[data-testid="sidebar-group-profile"]').filter(':visible').first().scrollIntoView().should('be.visible').click({ force: true });
  cy.get('[data-testid="sidebar-subitem-profile-case-management"]').filter(':visible').first().scrollIntoView().should('exist').click({ force: true });
  cy.get(selector('case-management-page')).should('be.visible');
}

export function addCase() {
  createCase('Cypress Case Title', 'Cypress investigation context', 'Cypress Entity', (createdCaseId) => {
    caseId = createdCaseId;
  });
}

export function assignAnalystIfAvailable() {
  cy.then(() => {
    cy.get(selector(`case-row-${caseId}`), { timeout: 60000 })
      .scrollIntoView()
      .should('be.visible');

    cy.get(selector(`case-assign-analyst-${caseId}`), { timeout: 60000 })
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.get(selector('case-analyst-dialog'), { timeout: 60000 })
      .should('be.visible');

    cy.get(selector('case-analyst-select'), { timeout: 60000 })
      .should('be.visible')
      .then(($control) => {
        if (($control[0] as HTMLButtonElement).disabled) {
          cy.get(selector('case-analyst-cancel')).click({ force: true });
          return;
        }

        const menuId = $control.attr('aria-controls');
        expect(menuId, 'case analyst dropdown menu id').to.exist;
        cy.wrap($control).click({ force: true });
        cy.get(`#${menuId}`, { timeout: 60000 }).should('be.visible').find('[role="option"]').first().click({ force: true });
        cy.get(selector('case-analyst-submit')).click({ force: true });
        assertNotification('Case analyst assigned successfully');
      });
  });
}

export function addLinkTargetCase() {
  createCase('Cypress Link Target Case', 'Cypress linked case context', 'Cypress Link Target Entity', (createdCaseId) => {
    linkedCaseId = createdCaseId;
  });
}

export function openCreatedCaseFromList() {
  cy.window().then((win) => {
    cy.stub(win, 'open').as('caseDetailsWindowOpen');
  });

  cy.then(() => {
    cy.get(selector(`case-view-${caseId}`)).should('be.visible').click();
    cy.get('@caseDetailsWindowOpen').should('have.been.calledWithMatch', new RegExp(`case-management/case-details\\?caseId=${caseId}`), '_blank');

    cy.visit(`/dashboard/profile/case-management/case-details?caseId=${caseId}`);
  });
  cy.get(selector('case-details-page')).should('be.visible');
}

export function openCreatedCaseDetails() {
  cy.then(() => {
    cy.visit(`/dashboard/profile/case-management/case-details?caseId=${caseId}`);
  });
  cy.get(selector('case-details-page')).should('be.visible');
  cy.then(() => {
    cy.get(selector('case-details-case-id-value'), { timeout: 60000 })
      .should(($value) => {
        expect($value.text().trim()).to.equal(caseId);
      });
  });
}
