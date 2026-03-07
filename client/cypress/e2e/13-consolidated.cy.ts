import {
  ensureDomainScannerModalOpen,
  openFirstReportAndGoBack,
  openHomepageAndSearch,
  searchInIocs,
  switchToDeepSearchTab,
  switchToIocsTab
} from './controllers/13-consolidated.controller';

describe('Consolidated - IOC Basic Flow', () => {
  const DOMAIN_SCANNER_MODAL_TIMEOUT = 90000;
  const DOMAIN_SCANNER_SELECTOR = '[data-testid="domain-scanner-modal"]';
  const DOMAIN_SCANNER_TEST_DOMAINS = ['example.com', 'bbc.com', 'cnn.com'];
  const DOMAIN_SCANNER_INPUT_SELECTOR = '[data-testid="domain-scanner-input"]';

  const runDomainScannerFlow = () => {
    cy.get('[data-testid="consolidated-tab-iocs"]', {timeout: 30000}).scrollIntoView().should('be.visible').click();
    ensureDomainScannerModalOpen();
    cy.get('[data-testid="domain-scanner-tab-subdomains"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="domain-scanner-live-toggle"]').should('exist').parents('label').first().click();
    cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).scrollIntoView().should('be.visible').clear().type('abcderfghh');
    cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
    cy.get('[data-testid="domain-scanner-search-subdomains"]', {timeout: 30000}).should('not.be.disabled');

    DOMAIN_SCANNER_TEST_DOMAINS.forEach((domain) => {
      cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).scrollIntoView().should('be.visible').clear().type(domain);
      cy.get('[data-testid="domain-scanner-search-subdomains"]').click();
      cy.get('[data-testid="domain-scanner-search-subdomains"]', {timeout: 30000}).should('not.be.disabled');
    });

    cy.get('[data-testid="domain-scanner-tab-ip-lookup"]').scrollIntoView().should('be.visible').click();
    cy.get(DOMAIN_SCANNER_INPUT_SELECTOR).clear().type('1.1.1.1');
    cy.get('[data-testid="domain-scanner-lookup-ip"]').scrollIntoView().should('be.visible').and('not.be.disabled').click();
    cy.get('[data-testid="domain-scanner-lookup-ip"]', {timeout: 30000}).should('not.be.disabled');

    ensureDomainScannerModalOpen();
    cy.get('[data-testid="domain-scanner-tab-wayback"]').scrollIntoView().should('be.visible').click();
    ensureDomainScannerModalOpen();
    cy.get(DOMAIN_SCANNER_INPUT_SELECTOR, {timeout: 30000}).should('be.visible').clear().type('example.com');
    cy.get('[data-testid="domain-scanner-search-wayback"]').scrollIntoView().should('be.visible').click();
    cy.get(DOMAIN_SCANNER_SELECTOR, {timeout: DOMAIN_SCANNER_MODAL_TIMEOUT}).should('be.visible').click('topLeft');
  };

  const validateAllTelemetryTabs = () => {
    cy.get('div.sensor-tabs button.sensor-tab:visible', {timeout: 30000}).then(($tabs) => {
      const tabCount = $tabs.length;
      expect(tabCount).to.be.greaterThan(0);

      for (let i = 0; i < tabCount; i += 1) {
        cy.get('div.sensor-tabs button.sensor-tab:visible').eq(i).click({force: true});
        cy.get('div.telemetry-details:visible', {timeout: 30000}).should('be.visible');
        cy.get('div.telemetry-details:visible div.telemetry-value:visible', {timeout: 30000})
          .should('have.length.greaterThan', 0);
      }
    });
  };

  const applyPasswordSchemeAndValidate = () => {
    cy.get('button img[alt="scheme"]', {timeout: 30000}).first().parent('button').click({force: true});
    cy.get('.ui-graph-popup-panel', {timeout: 30000}).should('be.visible');
    cy.contains('.ui-popup-title', 'Password Scheme Filter', {timeout: 30000}).should('be.visible');

    cy.get('.ui-graph-popup-panel input[type="number"]').eq(0).clear().type('8', {force: true});
    cy.get('.ui-graph-popup-panel input[type="number"]').eq(1).clear().type('24', {force: true});
    cy.contains('.ui-graph-popup-panel label', 'Has Alphabets').find('input[type="checkbox"]').check({force: true});
    cy.contains('.ui-graph-popup-panel label', 'Has Numbers').find('input[type="checkbox"]').check({force: true});
    cy.contains('.ui-graph-popup-panel button', /^Search$/).click({force: true});
    cy.get('.ui-graph-popup-panel', {timeout: 30000}).should('not.exist');

    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000}).eq(1).scrollIntoView();
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .eq(1)
      .find('div[role="row"]', {timeout: 30000})
      .should('have.length.greaterThan', 0);
  };

  const openIocFilterPanel = () => {
    cy.log('Filter: scroll to top and open panel');
    cy.window().then((win) => win.console.log('Filter: scroll to top and open panel'));
    cy.scrollTo('top', {ensureScrollable: false});
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="side-filter-close"]:visible').length === 0) {
        cy.contains('label.ui-cred-toolbar-btn span', 'Filter', {timeout: 30000})
          .should('be.visible')
          .click({force: true});
      }
    });
    cy.get('[data-testid="side-filter-close"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .should('be.visible');
  };

  const moveDatePickerToMonth = (targetLabel: string, attempts = 0): void => {
    if (attempts > 24) {
      throw new Error(`Could not navigate date picker to ${targetLabel}`);
    }

    cy.get('.mb-2 .text-sm.font-semibold', {timeout: 30000})
      .first()
      .invoke('text')
      .then((raw) => {
        const currentLabel = raw.trim();
        if (currentLabel === targetLabel) {
          return;
        }

        const currentDate = new Date(`${currentLabel} 1`);
        const targetDate = new Date(`${targetLabel} 1`);
        const goPrev = currentDate.getTime() > targetDate.getTime();

        cy.get('.mb-2 button', {timeout: 30000}).then(($buttons) => {
          cy.wrap(goPrev ? $buttons[0] : $buttons[$buttons.length - 1]).click({force: true});
          moveDatePickerToMonth(targetLabel, attempts + 1);
        });
      });
  };

  const applyDateRangeFilter = (monthLabel: string, startDay: number, endDay: number) => {
    cy.log(`Filter: applying date range ${monthLabel} (${startDay}-${endDay})`);
    cy.window().then((win) => win.console.log(`Filter: applying date range ${monthLabel} (${startDay}-${endDay})`));
    openIocFilterPanel();
    cy.get('[data-testid="side-filter-date-toggle"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .scrollIntoView()
      .click({force: true});
    moveDatePickerToMonth(monthLabel);
    cy.get(`[data-testid="side-filter-date-day-${startDay}"]`, {timeout: 30000}).filter(':visible').first().click({force: true});
    cy.get(`[data-testid="side-filter-date-day-${endDay}"]`, {timeout: 30000}).filter(':visible').first().click({force: true});
    cy.get('[data-testid="side-filter-apply"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .scrollIntoView()
      .click({force: true});
  };

  const clearSideFilters = () => {
    cy.log('Filter: clearing side filters before advanced flow');
    openIocFilterPanel();
    cy.get('[data-testid="side-filter-reset"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .scrollIntoView()
      .click({force: true});
    cy.get('[data-testid="side-filter-apply"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .scrollIntoView()
      .click({force: true});
  };

  const searchDeepFromTop = (query: string) => {
    cy.get('[data-cy="dashboard-body"]', {timeout: 30000})
      .scrollTo('top', {ensureScrollable: false});
    cy.scrollTo('top', {ensureScrollable: false});
    cy.get('[data-testid="dashboard-general-input"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .clear({force: true})
      .type(`${query}{enter}`, {force: true});
  };

  const setAllInsightsExpanded = (expand: boolean) => {
    cy.get('[data-testid^="insights-toggle-"]', {timeout: 30000}).each(($toggle) => {
      cy.wrap($toggle)
        .find('[aria-label]')
        .first()
        .invoke('attr', 'aria-label')
        .then((ariaLabel) => {
          const isExpanded = (ariaLabel || '').toLowerCase().includes('collapse');
          if (expand ? !isExpanded : isExpanded) {
            cy.wrap($toggle).scrollIntoView().click({force: true});
          }
        });
    });
  };

  const ensureInsightSectionExpanded = (toggleTestId: string) => {
    cy.get(`[data-testid="${toggleTestId}"]`, {timeout: 30000})
      .find('[aria-label]')
      .first()
      .invoke('attr', 'aria-label')
      .then((ariaLabel) => {
        const isExpanded = (ariaLabel || '').toLowerCase().includes('collapse');
        if (!isExpanded) {
          cy.get(`[data-testid="${toggleTestId}"]`).scrollIntoView().click({force: true});
        }
      });
  };

  const runAdvancedFilterFlow = () => {
    cy.log('Advanced: open and test real/fake filters with add/delete');
    cy.scrollTo('top', {ensureScrollable: false});

    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="ioc-adv-row"]:visible').length === 0) {
        cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000})
          .filter(':visible')
          .first()
          .scrollIntoView()
          .click({force: true});
      }
    });
    cy.get('[data-testid="ioc-adv-row"]', {timeout: 30000}).filter(':visible').should('have.length.at.least', 1);

    cy.get('[data-testid="ioc-adv-row"]').filter(':visible').first().within(() => {
      cy.get('[data-testid="ioc-adv-tag-select"]').select('m_email', {force: true});
      cy.get('[data-testid="ioc-adv-value-input"]').clear({force: true}).type('ydt.sja@gail.ccmm', {force: true});
    });
    cy.get('[data-testid="ioc-adv-execute"]', {timeout: 30000}).filter(':visible').first().click({force: true});
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .first()
      .find('div[role="row"]', {timeout: 30000})
      .should('have.length.greaterThan', 0);

    cy.get('[data-testid="ioc-adv-row"]').filter(':visible').first().within(() => {
      cy.get('[data-testid="ioc-adv-add-filter"]').click({force: true});
    });
    cy.get('[data-testid="ioc-adv-row"]', {timeout: 30000}).filter(':visible').should('have.length.at.least', 2);

    cy.get('[data-testid="ioc-adv-row"]').filter(':visible').eq(1).within(() => {
      cy.get('[data-testid="ioc-adv-operator-select"]').select('&&', {force: true});
      cy.get('[data-testid="ioc-adv-tag-select"]').select('m_email', {force: true});
      cy.get('[data-testid="ioc-adv-value-input"]').clear({force: true}).type('fake-no-result-value-xyz@gmail.com', {force: true});
    });
    cy.get('[data-testid="ioc-adv-execute"]', {timeout: 30000}).filter(':visible').first().click({force: true});

    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .first()
      .should(($shell) => {
        const rowCount = $shell.find('div[role="row"]').length;
        const emptyCount = $shell.find('.ui-ioc-table-empty').length;
        expect(rowCount === 0 || emptyCount > 0).to.eq(true);
      });

    cy.get('[data-testid="ioc-adv-row"]').filter(':visible').eq(1).within(() => {
      cy.get('[data-testid="ioc-adv-delete-filter"]').click({force: true});
    });
    cy.get('[data-testid="ioc-adv-execute"]', {timeout: 30000}).filter(':visible').first().click({force: true});
    cy.get('[data-testid="ioc-adv-row"]').filter(':visible').should('have.length.at.least', 1);
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .first()
      .find('div[role="row"]', {timeout: 30000})
      .should('have.length.greaterThan', 0);

    cy.get('[data-testid="ioc-advanced-toggle"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .scrollIntoView()
      .click({force: true});
    cy.get('[data-testid="ioc-adv-row"]:visible', {timeout: 30000}).should('have.length', 0);
    cy.get('app-credentials-search-bar [data-testid="ioc-basic-search-input"]', {timeout: 30000})
      .filter(':visible')
      .first()
      .should('be.visible');
  };

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

    cy.get('app-defacement-results .ui-consolidated-main', {timeout: 30000}).should('exist').within(() => {
      cy.contains('div', 'IP Threat Report', {timeout: 30000}).should('exist');
      cy.contains('div', /databases\s*\(\d+\)/i, {timeout: 30000}).scrollIntoView().should('exist');
      cy.contains('div', /phishing\s*\(\d+\)/i, {timeout: 30000}).scrollIntoView().should('exist');
    });

    cy.get('app-defacement-results .relative.inline-block.cursor-pointer img[alt="Toggle Icon"]', {timeout: 30000})
      .first()
      .then(($icon) => {
        const isExpanded = (($icon.attr('class') || '') as string).includes('rotate-90');
        if (!isExpanded) {
          cy.wrap($icon)
            .closest('div.relative.inline-block.cursor-pointer')
            .click({force: true});
        }
      });

    cy.get('app-defacement-results .ui-consolidated-sub', {timeout: 30000}).then(($allCards) => {
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

    cy.get('app-defacement-results .relative.inline-block.cursor-pointer', {timeout: 30000})
      .first()
      .scrollIntoView()
      .click({force: true});
    cy.contains('app-defacement-results b', 'IOC THREAT', {timeout: 30000}).should('not.exist');

    cy.get('app-defacement-results .relative.inline-block.cursor-pointer', {timeout: 30000})
      .first()
      .scrollIntoView()
      .click({force: true});
    cy.contains('app-defacement-results b', 'IOC THREAT', {timeout: 30000}).should('be.visible');

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
        cy.contains('div', 'Result count', {timeout: 30000}).should('be.visible');

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

    cy.get('app-consolidated-scan section.ui-consolidated-main', {timeout: 60000}).should('be.visible');
    cy.contains('app-consolidated-scan h1', /Threats Scans Report:/i, {timeout: 60000}).should('be.visible');
    cy.contains('app-consolidated-scan h2', 'Open Web Presence Scan', {timeout: 30000}).should('be.visible');
    cy.contains('app-consolidated-scan h2', 'Active Threat Discovery/Live Api', {timeout: 30000}).should('be.visible');

    cy.contains('app-consolidated-scan a', 'Details', {timeout: 30000})
      .first()
      .should('have.attr', 'href')
      .and('include', '/dashboard/scanner/');
    cy.contains('app-consolidated-scan a', 'Details', {timeout: 30000})
      .first()
      .invoke('removeAttr', 'target')
      .click({force: true});
    cy.url({timeout: 30000}).should('include', '/dashboard/scanner/');
    openHomepageAndSearch('{enter}');
    switchToDeepSearchTab();
    cy.scrollTo('top', {ensureScrollable: false});
    searchDeepFromTop('example.com');
    cy.get('app-consolidated-scan section.ui-consolidated-main', {timeout: 60000}).should('be.visible');

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

    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000}).should('have.length.at.least', 2);

    cy.get('app-credential-list .ui-ioc-table-shell')
      .first()
      .within(() => {
        cy.get('div[role="row"]', {timeout: 30000}).should('have.length.greaterThan', 0);
        cy.get('div[role="row"]').then(($rows) => {
          const count = Math.min(3, $rows.length);
          for (let i = 0; i < count; i += 1) {
            cy.wrap($rows[i]).find('button[aria-label*="row"]').first().click({force: true});
            cy.get('app-expanded-row .credential_row_expand:visible', {timeout: 30000}).first().within(() => {
              if (i === 0) {
                cy.get('button.icon-btn').first().click({force: true});
                cy.get('button.copy-ico').first().click({force: true});
                cy.contains('.section-title', 'Metadata Telemetry Array', {timeout: 30000}).should('be.visible');
                validateAllTelemetryTabs();
                cy.get('div.telemetry-details:visible div.telemetry-value:visible').first().click({force: true});
              }
            });
          }
        });
      });

    cy.get('app-credential-list .ui-ioc-table-shell').eq(1).scrollIntoView();
    cy.contains('app-credential-list span', /^Threats$/, {timeout: 30000}).should('be.visible');
    cy.get('app-credential-list .ui-ioc-table-shell')
      .eq(1)
      .within(() => {
        cy.get('div[role="row"]', {timeout: 30000}).should('have.length.greaterThan', 0);
        cy.get('div[role="row"]').then(($rows) => {
          const count = Math.min(3, $rows.length);
          for (let i = 0; i < count; i += 1) {
            cy.wrap($rows[i]).find('button[aria-label*="row"]').first().click({force: true});
            cy.get('app-expanded-row .credential_row_expand:visible', {timeout: 30000}).first().within(() => {
              if (i === 0) {
                cy.get('button.icon-btn').first().click({force: true});
                cy.get('button.copy-ico').first().click({force: true});
                cy.contains('.section-title', 'Metadata Telemetry Array', {timeout: 30000}).should('be.visible');
                validateAllTelemetryTabs();
                cy.get('div.telemetry-details:visible div.telemetry-value:visible').first().click({force: true});
              }
            });
          }
        });
      });

    searchInIocs('ydt.sja@gail.ccmm');
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000}).should('have.length.at.least', 2);
    cy.get('app-credential-list .ui-ioc-table-shell')
      .first()
      .within(() => {
        cy.get('div[role="row"]', {timeout: 30000}).first().within(() => {
          cy.contains('div.truncate', 'ydt.sja@gail.ccmm', {timeout: 30000}).should('be.visible');
          cy.get('button[aria-label*="row"]').first().click({force: true});
        });
      });
    cy.get('app-expanded-row .credential_row_expand:visible', {timeout: 30000}).first().within(() => {
      cy.contains('.cell.blink-green .kv-v', 'ydt.sja@gail.ccmm', {timeout: 30000}).should('be.visible');
    });

    searchInIocs('data');
    cy.get('app-credential-list .ui-ioc-table-shell').eq(1).scrollIntoView();
    cy.get('app-credential-list .ui-ioc-table-shell')
      .eq(1)
      .within(() => {
        cy.get('div[role="row"]', {timeout: 30000}).first().within(() => {
          cy.get('button[aria-label*="row"]').first().click({force: true});
        });
      });
    cy.get('app-expanded-row .credential_row_expand:visible', {timeout: 30000}).first().within(() => {
      cy.get('.kv-v:visible', {timeout: 30000}).should('have.length.greaterThan', 0);
    });

    cy.get('button img[alt="Download"]', {timeout: 30000}).first().parent('button').click({force: true});
    applyPasswordSchemeAndValidate();

    cy.contains('app-credentials-search-bar div.cursor-pointer', 'Email', {timeout: 30000})
      .should('be.visible')
      .click({force: true});
    searchInIocs('abc');
    cy.contains('app-credentials-search-bar span', 'Invalid email format', {timeout: 30000}).should('be.visible');
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .first()
      .find('div[role="row"]', {timeout: 30000})
      .should('have.length', 0);

    searchInIocs('');
    applyDateRangeFilter('January 2026', 13, 16);
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .eq(1)
      .find('div[role="row"]', {timeout: 30000})
      .should('have.length.greaterThan', 0);

    applyDateRangeFilter('March 2026', 1, 2);
    cy.get('app-credential-list .ui-ioc-table-shell', {timeout: 30000})
      .eq(1)
      .find('div[role="row"]', {timeout: 30000})
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
