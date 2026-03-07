import {
  applyDateRangeFilter,
  applyPasswordSchemeAndValidate,
  clearSideFilters,
  ensureInsightSectionExpanded,
  openFirstReportAndGoBack,
  openHomepageAndSearch,
  runAdvancedFilterFlow,
  runDomainScannerFlow,
  searchDeepFromTop,
  searchInIocs,
  setAllInsightsExpanded,
  switchToDeepSearchTab,
  switchToIocsTab
} from './controllers/13-consolidated.controller';

describe('Consolidated - IOC Basic Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  it('opens Deep Search section', () => {
    const consolidatedSections = [
      'consolidated-section-social',
      'consolidated-section-tracking',
      'consolidated-section-news',
      'consolidated-section-leak',
    ];

    openHomepageAndSearch('{enter}');
    switchToDeepSearchTab();
    cy.get('[data-testid="consolidated-tab-deep-search"]', {timeout: 30000})
      .should('be.visible')
      .and('have.attr', 'data-tab', 'Deep Search');
    searchDeepFromTop('data');

    cy.get('[data-testid="defacement-report"]', {timeout: 30000}).should('exist').within(() => {
      cy.get('[data-testid="defacement-report-title"]', {timeout: 30000}).should('contain.text', 'IP Threat Report');
      cy.get('[data-testid="defacement-report-chip"]', {timeout: 30000}).contains(/databases\s*\(\d+\)/i).scrollIntoView().should('exist');
      cy.get('[data-testid="defacement-report-chip"]', {timeout: 30000}).contains(/phishing\s*\(\d+\)/i).scrollIntoView().should('exist');
    });

    cy.get('[data-testid="defacement-report-toggle"] img[alt="Toggle Icon"]', {timeout: 30000})
      .first()
      .then(($icon) => {
        const isExpanded = (($icon.attr('class') || '') as string).includes('rotate-90');
        if (!isExpanded) {
          cy.wrap($icon)
            .closest('[data-testid="defacement-report-toggle"]')
            .click({force: true});
        }
      });

    cy.get('[data-testid="defacement-report-card"]', {timeout: 30000}).then(($allCards) => {
      const cards = [...$allCards].filter((el) => el.textContent?.includes('IOC THREAT'));
      expect(cards.length).to.be.greaterThan(2);
      for (let i = 0; i < 3; i += 1) {
        const card = cards[i];
        cy.wrap(card).scrollIntoView().should('contain.text', 'Web Server');
        cy.wrap(card).should('contain.text', 'Attacker');
        cy.wrap(card).should('contain.text', 'Team');
        cy.wrap(card).should('contain.text', 'IP(s)');
        cy.wrap(card).should('contain.text', 'URL');
      }
    });

    cy.get('[data-testid="defacement-report-toggle"]', {timeout: 30000})
      .first()
      .scrollIntoView()
      .click({force: true});
    cy.get('[data-testid="defacement-report-card-title"]', {timeout: 30000}).should('not.exist');

    cy.get('[data-testid="defacement-report-toggle"]', {timeout: 30000})
      .first()
      .scrollIntoView()
      .click({force: true});
    cy.get('[data-testid="defacement-report-card-title"]', {timeout: 30000}).should('be.visible');

    cy.get('[data-testid="insights-section-keyword"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid^="insights-keyword-item-"]', {timeout: 30000}).should('have.length.greaterThan', 0);
    cy.get('[data-testid="insights-section-coverage"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid^="insights-coverage-item-"]', {timeout: 30000}).should('have.length.greaterThan', 0);
    setAllInsightsExpanded(true);
    cy.get('[data-testid="insights-section-threat-actor"]', {timeout: 30000}).scrollIntoView().should('be.visible');

    cy.get('[data-testid="insights-section-threat-actor"]', {timeout: 30000}).should('be.visible');
    ensureInsightSectionExpanded('insights-toggle-threat-actor');
    cy.get('[data-testid="insights-section-threat-actor"] [data-testid^="insights-threat-item-"]', {timeout: 30000})
      .should('have.length.greaterThan', 0)
      .then(($before) => {
      const beforeCount = $before.length;
      expect(beforeCount).to.be.greaterThan(0);

      const firstItemText = ($before[0]?.textContent || '').trim();
      const keyword = (firstItemText.split(/\s+/).find((part) => part.length >= 3) || 'data').toLowerCase();

      cy.get('[data-testid="insights-threat-search-input"]', {timeout: 30000})
        .clear({force: true})
        .type(keyword, {force: true});
      cy.get('[data-testid="insights-section-threat-actor"] [data-testid^="insights-threat-item-"]', {timeout: 30000}).should(($after) => {
        expect($after.length).to.be.greaterThan(0);
        expect($after.length).to.be.at.most(beforeCount);
      });

      cy.get('[data-testid="insights-threat-search-input"]', {timeout: 30000})
        .clear({force: true})
        .type('zzzzzzzzzz-no-match', {force: true});
      cy.get('[data-testid="insights-section-threat-actor"] [data-testid^="insights-threat-item-"]', {timeout: 30000}).should('have.length', 0);

      cy.get('[data-testid="insights-threat-search-input"]', {timeout: 30000}).clear({force: true});
    });

    consolidatedSections.forEach((sectionId) => {
      cy.get(`[data-testid="${sectionId}"]`, {timeout: 30000}).scrollIntoView().should('be.visible');
      cy.get(`[data-testid="${sectionId}"]`).within(() => {
        cy.get(`[data-testid^="consolidated-section-count-"]`, {timeout: 30000}).should('be.visible');

        cy.get('[data-testid="consolidated-section-see-more"]').then(($toggles) => {
          const hasPagination = $toggles.filter(':visible').length > 0;
          if (!hasPagination) {
            return;
          }

          cy.get('[data-testid="result-card"]').then(($cardsBefore) => {
            const before = $cardsBefore.length;
            cy.get('[data-testid="consolidated-section-see-more"]', {timeout: 30000})
              .filter(':visible')
              .first()
              .scrollIntoView()
              .click({force: true});

            cy.get('[data-testid="result-card"]', {timeout: 30000}).then(($cardsAfterExpand) => {
              const expanded = $cardsAfterExpand.length;
              expect(expanded).to.be.at.least(before);

              cy.get('[data-testid="consolidated-section-see-more"]', {timeout: 30000})
                .filter(':visible')
                .first()
                .invoke('text')
                .then((toggleText) => {
                  const label = toggleText.trim().toLowerCase();
                  if (label.includes('less')) {
                    cy.get('[data-testid="consolidated-section-see-more"]', {timeout: 30000})
                      .filter(':visible')
                      .first()
                      .scrollIntoView()
                      .click({force: true});
                    cy.get('[data-testid="result-card"]', {timeout: 30000}).its('length').should('be.at.most', expanded);
                  }
                });
            });
          });
        });
      });
    });

    cy.scrollTo('top', {ensureScrollable: false});
    searchDeepFromTop('example.com');

    cy.get('[data-testid="consolidated-scan-section"]', {timeout: 60000}).should('be.visible');
    cy.get('[data-testid="consolidated-scan-title"]', {timeout: 60000}).should('contain.text', 'Threats Scans Report:');
    cy.get('[data-testid="consolidated-scan-openweb-title"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="consolidated-scan-liveapi-title"]', {timeout: 30000}).should('be.visible');

    cy.get('[data-testid="consolidated-scan-openweb-detail"]', {timeout: 30000})
      .first()
      .should('have.attr', 'href')
      .and('include', '/dashboard/scanner/');
    cy.get('[data-testid="consolidated-scan-openweb-detail"]', {timeout: 30000})
      .first()
      .invoke('removeAttr', 'target')
      .click({force: true});
    cy.url({timeout: 30000}).should('include', '/dashboard/scanner/');
    openHomepageAndSearch('{enter}');
    switchToDeepSearchTab();
    cy.scrollTo('top', {ensureScrollable: false});
    searchDeepFromTop('example.com');
    cy.get('[data-testid="consolidated-scan-section"]', {timeout: 60000}).should('be.visible');

    cy.get('[data-testid="consolidated-section-social"]', {timeout: 30000}).scrollIntoView().should('be.visible');
    openFirstReportAndGoBack();

    cy.get('[data-testid="side-filter-open"]', {timeout: 30000}).scrollIntoView().click({force: true});
    cy.get('[data-testid="side-filter-select-network"]', {timeout: 30000}).select('4: clearnet', {force: true});
    cy.get('[data-testid="side-filter-apply"]', {timeout: 30000}).click({force: true});
    cy.get('[data-testid="result-card"]', {timeout: 30000}).should('have.length.greaterThan', 0);
    cy.get('[data-testid="result-card"]', {timeout: 30000}).then(($cards) => {
      const cardWithNetwork = [...$cards].find((el) => (el.textContent || '').includes('Network:'));
      expect(cardWithNetwork, 'result card with Network field').to.exist;
      cy.wrap(cardWithNetwork as HTMLElement)
        .should('contain.text', 'Network:')
        .and('contain.text', 'clearnet');
    });
  });

  it('opens IOCs and clicks first 3 rows in Stealers and Threats', () => {
    openHomepageAndSearch('{enter}');
    switchToIocsTab();

    cy.get('[data-testid="ioc-stealer-table"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="ioc-threat-table"]', {timeout: 30000}).should('be.visible');

    cy.get('[data-testid="ioc-stealer-table"]')
      .within(() => {
        cy.get('[data-testid="ioc-stealer-row"]', {timeout: 30000}).should('have.length.greaterThan', 0);
        cy.get('[data-testid="ioc-stealer-row"]').then(($rows) => {
          const count = Math.min(3, $rows.length);
          for (let i = 0; i < count; i += 1) {
            cy.wrap($rows.eq(i))
              .scrollIntoView()
              .find('[data-testid="ioc-stealer-row-toggle"]')
              .first()
              .click({force: true});
          }
        });
      });

    cy.get('[data-testid="ioc-threat-table"]').scrollIntoView();
    cy.get('[data-testid="ioc-threats-heading"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="ioc-threat-table"]')
      .within(() => {
        cy.get('[data-testid="ioc-threat-row"]', {timeout: 30000}).should('have.length.greaterThan', 0);
        cy.get('[data-testid="ioc-threat-row"]').then(($rows) => {
          const count = Math.min(3, $rows.length);
          for (let i = 0; i < count; i += 1) {
            cy.wrap($rows.eq(i))
              .scrollIntoView()
              .find('[data-testid="ioc-threat-row-toggle"]')
              .first()
              .click({force: true});
          }
        });
      });

    searchInIocs('ydt.sja@gail.ccmm');
    cy.get('[data-testid="ioc-stealer-table"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="ioc-stealer-row"]', {timeout: 30000})
      .first()
      .find('[data-testid="ioc-stealer-row-toggle"]')
      .first()
      .click({force: true});
    cy.get('[data-testid="ioc-expanded-email-value"]', {timeout: 30000})
      .filter(':visible')
      .should('have.length.greaterThan', 0)
      .first()
      .should('contain.text', 'ydt.sja@gail.ccmm');

    searchInIocs('data');
    cy.get('[data-testid="ioc-threat-table"]').scrollIntoView();
    cy.get('[data-testid="ioc-threat-row"]', {timeout: 30000})
      .first()
      .find('[data-testid="ioc-threat-row-toggle"]')
      .first()
      .click({force: true});
    cy.get('[data-testid="ioc-expanded-telemetry-title"]', {timeout: 30000})
      .filter(':visible')
      .should('have.length.greaterThan', 0);

    cy.get('[data-testid="ioc-download-results"]', {timeout: 30000}).first().click({force: true});
    applyPasswordSchemeAndValidate();

    cy.get('[data-testid="ioc-basic-tag-m_email"]', {timeout: 30000})
      .should('be.visible')
      .click({force: true});
    searchInIocs('abc');
    cy.get('[data-testid="ioc-basic-error"]', {timeout: 30000}).should('be.visible');
    cy.get('[data-testid="ioc-stealer-table"]', {timeout: 30000})
      .find('[data-testid="ioc-stealer-row"]', {timeout: 30000})
      .should('have.length', 0);

    searchInIocs('');
    applyDateRangeFilter('January 2026', 13, 16);
    cy.get('[data-testid="ioc-threat-table"]', {timeout: 30000})
      .find('[data-testid="ioc-threat-row"]', {timeout: 30000})
      .should('have.length.greaterThan', 0);

    applyDateRangeFilter('March 2026', 1, 2);
    cy.get('[data-testid="ioc-threat-table"]', {timeout: 30000})
      .find('[data-testid="ioc-threat-row"]', {timeout: 30000})
      .should('have.length', 0);

    searchInIocs('');
    clearSideFilters();
    runAdvancedFilterFlow();
  });

  it('opens domain scanner and runs Subdomains, IP Lookup, and Wayback scans', () => {
    openHomepageAndSearch('{enter}');
    runDomainScannerFlow();
  });
});
