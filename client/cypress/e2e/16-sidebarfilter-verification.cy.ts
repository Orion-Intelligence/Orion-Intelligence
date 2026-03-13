// import {
//   CONTENT_TYPES,
//   NETWORK_OPTIONS,
//   SAFE_SEARCH_OPTIONS,
// } from '../support/constants';
// import {
//   selectDateRangeAndReopen,
//   selectDateRangeResetAndReopen
// } from './controllers/16-sidebarfilter-verification.controller';
//
// describe('SideBar Filter Verification', () => {
//   beforeEach(() => {
//     cy.viewport(2560, 3000);
//     cy.loginAsAdmin();
//   });
//
//   afterEach(() => {
//     cy.logout();
//   });
//
//   it('applies all filter options in Data Breach', () => {
//     cy.get('[data-testid="sidebar-group-breach"]').scrollIntoView().click();
//     cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
//     cy.get('[data-testid="dashboard-advance-toggle"]')
//       .should('exist')
//       .scrollIntoView()
//       .check();
//
//     cy.openSideFilter();
//
//     NETWORK_OPTIONS.forEach((option) => {
//       cy.openSideFilter();
//
//       cy.get('[data-testid="side-filter-reset"]')
//         .scrollIntoView()
//         .should('be.visible')
//         .click();
//
//       cy.get('[data-testid="side-filter-select-network"]')
//
//
//       cy.get('[data-testid="side-filter-apply"]')
//         .scrollIntoView()
//         .should('be.visible')
//         .click();
//
//       cy.get('body', {timeout: 10000})
//         .should('be.visible')
//         .then(($body) => {
//           if ($body.find('[data-testid="result-card"]').length > 0) {
//             if (option === 'All') {
//               cy.get('[data-testid="result-card"]').should('exist').and('be.visible');
//             } else {
//               cy.get('[data-testid="result-card"]')
//                 .first()
//                 .within(() => {
//                   cy.contains('span', 'Network:')
//                     .parent()
//                     .find('span.font-medium')
//                     .invoke('text')
//                     .then((text) => {
//                       if (option === 'Onion') {
//                         expect(text.trim().toLowerCase()).to.eq('onion');
//                       } else if (option === 'I2P') {
//                         expect(text.trim().toLowerCase()).to.eq('i2p');
//                       } else if (option === 'Clear net' || option === 'Clearnet') {
//                         expect(text.trim().toLowerCase()).to.eq('clearnet');
//                       }
//                     });
//                 });
//             }
//           } else if (
//             $body.text().includes('No Results Found!') ||
//             $body.text().includes('No Results Found') ||
//             $body.text().includes('No result found') ||
//             $body.text().includes('No results found')
//           ) {
//             cy.contains('No Results Found', {matchCase: false}).should('be.visible');
//             cy.log(`No results found for Network Type: ${option}. Moving to next option.`);
//           } else {
//             cy.log(`Unexpected state for Network Type: ${option}`);
//           }
//         });
//     });
//
//     SAFE_SEARCH_OPTIONS.forEach((option) => {
//       cy.get('[data-testid="side-filter-select-safe"]')
//         .scrollIntoView()
//         .select(option);
//
//       cy.get('[data-testid="side-filter-apply"]')
//         .scrollIntoView()
//         .click();
//
//       cy.openSideFilter();
//     });
//
//     selectDateRangeAndReopen();
//
//     cy.get('[data-testid="side-filter-reset"]')
//       .scrollIntoView()
//       .click();
//
//     cy.openSideFilter();
//
//     CONTENT_TYPES.forEach((option) => {
//       cy.get('[data-testid="side-filter-select-content"]')
//         .scrollIntoView()
//         .select(option);
//
//       cy.get('[data-testid="side-filter-apply"]')
//         .scrollIntoView()
//         .click();
//
//       cy.openSideFilter();
//     });
//
//     cy.closeSideFilter();
//     cy.get('[data-testid="dashboard-search-submit"]')
//       .first()
//       .scrollIntoView()
//       .click();
//   });
//   it('applies all filters in Defacement with auto-apply', () => {
//     cy.get('[data-testid="sidebar-group-defacement"]').scrollIntoView().click();
//     cy.get('[data-testid="dashboard-general-input"]').should('be.visible');
//     cy.openSideFilter();
//     selectDateRangeResetAndReopen();
//
//     NETWORK_OPTIONS.forEach((option) => {
//       cy.get('[data-testid="side-filter-select-network"]').scrollIntoView().select(option);
//       cy.applySideFilter();
//       cy.openSideFilter();
//     });
//
//     cy.closeSideFilter();
//     cy.get('[data-testid="dashboard-search-submit"]').first().scrollIntoView().click();
//   });
//
//   function waitForSidebar() {
//     cy.get('.ui-filter-sidebar-panel.right-0', {timeout: 20000})
//       .should('be.visible')
//       .should('have.css', 'right', '0px');
//   }
//
//   function openSidebar() {
//     cy.get('body').then(($body) => {
//       const isOpen =
//         $body.find('.ui-filter-sidebar-panel.right-0').length > 0 &&
//         $body.find('.ui-filter-sidebar-panel.right-0').is(':visible');
//
//       if (!isOpen) {
//         cy.get('[data-testid="side-filter-open"]', {timeout: 60000})
//           .scrollIntoView({offset: {top: -100, left: 0}})
//           .should('be.visible')
//           .should('not.be.disabled')
//           .click();
//       }
//     });
//
//     waitForSidebar();
//   }
//
//   function selectAndApply(selectTestId: string, option: string) {
//     waitForSidebar();
//
//     cy.get('.ui-filter-sidebar-panel.right-0')
//       .scrollTo('top', {ensureScrollable: false});
//
//     cy.get(`[data-testid="${selectTestId}"]`, {timeout: 60000})
//       .scrollIntoView({offset: {top: -120, left: 0}})
//       .should('be.visible')
//       .should('not.be.disabled')
//       .select(option);
//
//     cy.get('.ui-filter-sidebar-panel.right-0')
//       .scrollTo('bottom', {ensureScrollable: false});
//
//     cy.get('[data-testid="side-filter-apply"]', {timeout: 60000})
//       .scrollIntoView({offset: {top: -140, left: 0}})
//       .should('be.visible')
//       .should('not.be.disabled')
//       .click({force: true});
//   }
//
//   it('applies all filters in Social with auto-apply and verifies selected network in report', () => {
//     cy.intercept('POST', '**/api/search/social').as('socialSearch');
//
//     cy.get('[data-testid="sidebar-group-social"]', {timeout: 60000})
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//
//     cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//     openSidebar();
//
//     selectDateRangeResetAndReopen();
//
//     openSidebar();
//
//     NETWORK_OPTIONS.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-network', option);
//
//       cy.wait('@socialSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//       cy.get('[data-testid="open-report"]', {timeout: 60000})
//         .should('have.length.at.least', 1)
//         .first()
//         .scrollIntoView()
//         .should('be.visible')
//         .click();
//
//       cy.contains('p', 'Network', {timeout: 30000})
//         .should('be.visible')
//         .parent()
//         .within(() => {
//           cy.get('span', {timeout: 30000})
//             .should('be.visible')
//             .invoke('text')
//             .then((text: string) => {
//               const normalizedText = text.trim().toLowerCase();
//               const normalizedOption = option.trim().toLowerCase();
//
//               if (normalizedOption === 'all') {
//                 expect(normalizedText).to.not.equal('');
//               } else {
//                 expect(normalizedText).to.equal(normalizedOption);
//               }
//             });
//         });
//
//       cy.go('back');
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//     });
//
//     CONTENT_TYPES.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-content', option);
//
//       cy.wait('@socialSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//     });
//
//     cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
//       .first()
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//   });
//   it('applies all filters in Exploit with auto-apply', () => {
//     cy.intercept('POST', '**/api/search/exploit').as('exploitSearch');
//
//     cy.get('[data-testid="sidebar-group-exploit"]', {timeout: 60000})
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//
//     cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//     openSidebar();
//
//     selectDateRangeResetAndReopen();
//
//     openSidebar();
//
//     CONTENT_TYPES.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-content', option);
//
//       cy.wait('@exploitSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//     });
//
//     NETWORK_OPTIONS.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-network', option);
//
//       cy.wait('@exploitSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//       cy.get('body').then(($body) => {
//         if ($body.find('[data-testid="open-report"]').length > 0) {
//           cy.get('[data-testid="open-report"]', {timeout: 60000})
//             .first()
//             .scrollIntoView()
//             .should('be.visible')
//             .click();
//
//           cy.contains('p', 'Network', {timeout: 30000})
//             .should('be.visible')
//             .parent()
//             .within(() => {
//               cy.get('span', {timeout: 30000})
//                 .should('be.visible')
//                 .invoke('text')
//                 .then((text: string) => {
//                   const normalizedText = text.trim().toLowerCase();
//                   const normalizedOption = option.trim().toLowerCase();
//
//                   if (normalizedOption === 'all') {
//                     expect(normalizedText).to.not.equal('');
//                   } else {
//                     expect(normalizedText).to.equal(normalizedOption);
//                   }
//                 });
//             });
//
//           cy.go('back');
//           cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//         } else {
//           cy.log(`No results for network: ${option}`);
//         }
//       });
//
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//     });
//
//     cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
//       .first()
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//   });
//
//   it('applies all filters in Feed News with auto-apply', () => {
//     cy.intercept('POST', '**/api/search/breach').as('feedNewsSearch');
//
//     cy.get('[data-testid="sidebar-group-feed"]', {timeout: 60000})
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//
//     cy.get('[data-testid="sidebar-subitem-feed-news"]', {timeout: 60000})
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//
//     cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//     openSidebar();
//     selectDateRangeResetAndReopen();
//     openSidebar();
//
//     CONTENT_TYPES.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-content', option);
//
//       cy.wait('@feedNewsSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//     });
//
//     NETWORK_OPTIONS.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-network', option);
//
//       cy.wait('@feedNewsSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//       cy.get('body').then(($body) => {
//         if ($body.find('[data-testid="open-report"]').length > 0) {
//           cy.get('[data-testid="open-report"]', {timeout: 60000})
//             .first()
//             .scrollIntoView()
//             .should('be.visible')
//             .click();
//
//           cy.contains('p', 'Network', {timeout: 30000})
//             .should('be.visible')
//             .parent()
//             .within(() => {
//               cy.get('span', {timeout: 30000})
//                 .should('be.visible')
//                 .invoke('text')
//                 .then((text: string) => {
//                   const normalizedText = text.trim().toLowerCase();
//                   const normalizedOption = option.trim().toLowerCase();
//
//                   if (normalizedOption === 'all') {
//                     expect(normalizedText).to.not.equal('');
//                   } else {
//                     expect(normalizedText).to.equal(normalizedOption);
//                   }
//                 });
//             });
//
//           cy.go('back');
//
//           cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//         }
//       });
//     });
//
//     cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
//       .first()
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//   });
//   it('applies all filters in General Intelligence with auto-apply', () => {
//     cy.intercept('POST', '**/api/search/strategic').as('strategicSearch');
//
//     cy.get('[data-testid="sidebar-group-strategic"]', {timeout: 60000})
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//
//     cy.get('[data-testid="sidebar-subitem-strategic-all"]', {timeout: 60000})
//
//
//     cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//     openSidebar();
//     selectDateRangeResetAndReopen();
//     openSidebar();
//
//     CONTENT_TYPES.forEach((option: string) => {
//       openSidebar();
//
//       selectAndApply('side-filter-select-content', option);
//
//       cy.wait('@strategicSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//     });
//
//     NETWORK_OPTIONS.forEach((option: string) => {
//       openSidebar();
//       selectDateRangeResetAndReopen();
//       openSidebar();
//
//       selectAndApply('side-filter-select-network', option);
//
//       cy.wait('@strategicSearch')
//         .its('response.statusCode')
//         .should('eq', 200);
//
//       cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//
//       cy.get('body').then(($body) => {
//         if ($body.find('[data-testid="open-report"]').length > 0) {
//           cy.get('[data-testid="open-report"]', {timeout: 60000})
//             .first()
//             .scrollIntoView()
//             .should('be.visible')
//             .click();
//
//           cy.contains('p', 'Network', {timeout: 30000})
//             .should('be.visible')
//             .parent()
//             .within(() => {
//               cy.get('span', {timeout: 30000})
//                 .should('be.visible')
//                 .invoke('text')
//                 .then((text: string) => {
//                   const normalizedText = text.trim().toLowerCase();
//                   const normalizedOption = option.trim().toLowerCase();
//
//                   if (normalizedOption === 'all') {
//                     expect(normalizedText).to.not.equal('');
//                   } else {
//                     expect(normalizedText).to.equal(normalizedOption);
//                   }
//                 });
//             });
//
//           cy.go('back');
//           cy.get('[data-testid="dashboard-general-input"]', {timeout: 60000});
//         }
//       });
//     });
//
//     cy.get('[data-testid="dashboard-search-submit"]', {timeout: 30000})
//       .first()
//       .scrollIntoView()
//       .should('be.visible')
//       .click();
//   });
//
// });
