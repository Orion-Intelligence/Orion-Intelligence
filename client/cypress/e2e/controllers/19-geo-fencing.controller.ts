export const THREAT_LENS_FEED_TYPES = ['news', 'archive'];

export const THREAT_LENS_FEED_RANGES = ['1d', '7d', 'all'];

export function visitThreatLens() {
  void cy.visit('/dashboard/profile/consolidated/all?tab=Geo%20Fencing');
  void cy.get('[data-testid="geo-fencing-page"]', { timeout: 120000 }).should('be.visible');
  void cy.get('[data-testid="geo-fencing-tab-threat"]').should('be.visible').and('not.be.disabled').click({ force: true });
  void cy.get('[data-testid="geo-fencing-threat-view"]', { timeout: 120000 }).should('be.visible');
  void cy.get('[data-testid="threat-lens-page"]', { timeout: 120000 }).should('be.visible');
}

export function waitForThreatLensReady() {
  void cy.get('[data-testid="threat-lens-loading"]', { timeout: 180000 }).should('not.exist');
  void cy.get('[data-testid="threat-lens-map-renderer"]', { timeout: 180000 }).should('exist');
  void cy.get('[data-testid="threat-lens-search-panel"]', { timeout: 180000 }).should('be.visible');
}

export function cycleThreatLensFeedRanges(feedType: string) {
  THREAT_LENS_FEED_RANGES.forEach((range) => {
    void cy.get(`[data-testid="threat-lens-feed-range-${feedType}-${range}"]`).filter(':visible').first().click();
  });
}

export function assertThreatLensFeedEmptyOnSearch(feedType: string) {
  void cy.get(`[data-testid="threat-lens-feed-search-${feedType}"]`).filter(':visible').first().clear({ force: true }).type('zzzz-no-feed-match', { force: true });
  void cy.get(`[data-testid="threat-lens-feed-empty-${feedType}"]`).should('be.visible');
  void cy.get(`[data-testid="threat-lens-feed-search-${feedType}"]`).filter(':visible').first().clear({ force: true });
}

export function assertThreatLensFeedItemNotEmpty(feedType: string) {
  void cy.get('body').then(($body) => {
    const item = $body.find(`[data-testid="threat-lens-feed-item-${feedType}"]:visible`).first();
    if (item.length) {
      cy.wrap(item).should(($el) => {
        expect($el.text().replace(/\s+/g, ' ').trim()).to.not.equal('');
      });
    }
  });
}

export function toggleThreatLensFeedPanel(feedType: string) {
  void cy.get(`[data-testid="threat-lens-feed-toggle-${feedType}"]`).filter(':visible').first().click({ force: true });
}

export function openThreatLensFeedItemIfPresent(feedType: string) {
  void cy.get('body').then(($body) => {
    const item = $body.find(`[data-testid="threat-lens-feed-item-${feedType}"]:visible`).first();
    if (item.length) {
      cy.wrap(item).click({ force: true });
    }
  });
}

export function selectThreatLensCategoryLayerIfPresent() {
  void cy.get('body').then(($body) => {
    const layer = $body.find('[data-testid="threat-lens-category-layer"]:visible').filter((_index, element) => !element.hasAttribute('disabled')).first();
    if (layer.length) {
      cy.wrap(layer).click({ force: true });
    }
  });
}

export function setThreatLensArcRangeIfPresent(value: string) {
  void cy.get('body').then(($body) => {
    const range = $body.find('[data-testid="threat-lens-arc-range"]:visible').first();
    if (range.length && !range.is(':disabled')) {
      cy.wrap(range).clear({ force: true }).type(`${value}{enter}`, { force: true });
    }
  });
}

export function submitThreatLensTopicSearch(term: string) {
  void cy.get('[data-testid="threat-lens-topic-search-input"]').filter(':visible').first().clear({ force: true }).type(term, { force: true });
  void cy.get('[data-testid="threat-lens-topic-search-submit"]').filter(':visible').first().click({ force: true });
}

export function submitThreatLensKeyword(term: string) {
  void cy.get('[data-testid="threat-lens-search-input"]').filter(':visible').first().clear({ force: true }).type(`${term}{enter}`, { force: true });
  void cy.get('[data-testid="threat-lens-active-keyword"]', { timeout: 60000 }).should('contain.text', term);
}

export function selectThreatLensTopCountryIfPresent() {
  void cy.get('body').then(($body) => {
    const topCountry = $body.find('[data-testid="threat-lens-top-country"]:visible').first();
    if (topCountry.length) {
      cy.wrap(topCountry).click({ force: true });
    }
  });
}

export function toggleThreatLensSearchPanel() {
  void cy.get('[data-testid="threat-lens-search-toggle"]').filter(':visible').first().click({ force: true });
}

export function resetThreatLensCountry() {
  void cy.get('[data-testid="threat-lens-reset-country"]').filter(':visible').first().click({ force: true });
}

export function resetThreatLensPosition() {
  void cy.get('[data-testid="threat-lens-reset-position"]').filter(':visible').first().click({ force: true });
}

export function openThreatLensFilters() {
  void cy.get('[data-testid="geo-fencing-panel-menu-button"]').click({ force: true });
  void cy.get('[data-testid="geo-fencing-panel-menu-filter"]').should('be.visible').click({ force: true });
  void cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().should('be.visible');
}
