export function closeAndLogout() {
  cy.get('body').then(($body) => {
    const $close = $body.find('button[aria-label="Close"]').filter(':visible').first();
    if ($close.length) {
      cy.wrap($close).click();
    }
  });
  cy.scrollTo('top', {ensureScrollable: false});
  cy.logout();
}
