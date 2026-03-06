import {FLOW_ADMIN_SECTIONS, FLOW_DATA_BREACH_SECTIONS, FLOW_DEFACEMENT_SECTIONS, FLOW_ENTITY_API_SECTIONS, FLOW_EXPLOIT_SECTIONS, FLOW_GENERAL_INTELLIGENCE_SECTIONS, FLOW_SOCIAL_SECTIONS, FLOW_WEB_SCANS_SECTIONS} from '../support/constants';
import {clickSidebarSubItem, getHeatmapComponent, openCountryReportFromMap, openHomepage, openSidebarGroup} from './controllers/03-flow.controller';

describe('Orion Intelligence - Full Navigation and Heatmap Flow', () => {
  before(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('navigates through all major sidebar sections and sub-sections', () => {
    openSidebarGroup('admin');

    FLOW_ADMIN_SECTIONS.forEach((section) => {
      clickSidebarSubItem('admin', section);
    });

    cy.get('[data-testid="sidebar-collapse-button"]', {timeout: 20000}).should('exist').then(($btn) => ($btn[0] as HTMLButtonElement).click());
    cy.get('[data-testid="sidebar-expand-button"]', {timeout: 20000}).should('be.visible').click();

    openSidebarGroup('General Intelligence');
    FLOW_GENERAL_INTELLIGENCE_SECTIONS.forEach((s) => clickSidebarSubItem('General Intelligence', s));

    openSidebarGroup('Data Breach');
    cy.scrollTo('top', {ensureScrollable: false});
    FLOW_DATA_BREACH_SECTIONS.forEach((s) => clickSidebarSubItem('Data Breach', s));

    openSidebarGroup('Defacement');
    FLOW_DEFACEMENT_SECTIONS.forEach((s) => clickSidebarSubItem('Defacement', s));

    openSidebarGroup('Social');
    FLOW_SOCIAL_SECTIONS.forEach((s) => clickSidebarSubItem('Social', s));

    openSidebarGroup('Exploit');
    FLOW_EXPLOIT_SECTIONS.forEach((s) => clickSidebarSubItem('Exploit', s));

    openSidebarGroup('Feed');
    openSidebarGroup('Stealer logs');

    cy.get('button[aria-label="Expand row"]').each(($btn, index) => {
      if (index < 5) {
        cy.wrap($btn).scrollIntoView().click();
      }
    });

    openSidebarGroup('Web Scans');
    FLOW_WEB_SCANS_SECTIONS.forEach((s) => clickSidebarSubItem('Web Scans', s));

    openSidebarGroup('Entity API');
    FLOW_ENTITY_API_SECTIONS.forEach((item) => clickSidebarSubItem('Entity API', item));
  });

  it('covers world heatmap render, interactions, and popup close paths', () => {
    cy.loginAsAdmin();
    cy.get('[data-testid="world-heatmap-map"] svg', {timeout: 15000}).should('exist');
    cy.get('[data-testid="world-heatmap-map"] svg', {timeout: 15000}).should('exist');

    cy.get('[data-testid="world-heatmap-map"] path.country.has-data, [data-testid="world-heatmap-map"] path.country', {timeout: 15000})
      .then(($paths) => {
        const aliases = ['united states', 'united states of america', 'usa', 'us'];
        const target = Array.from($paths).find((el) => {
          const name = (((el as any).__data__?.properties?.name) || '').toString().trim().toLowerCase();
          return aliases.includes(name);
        }) || $paths[0];
        expect(target, 'USA country path').to.exist;
        cy.wrap((target as unknown as SVGPathElement)).as('usaCountryPath');
      });

    cy.get('@usaCountryPath').should('exist').then(($el) => {
      let r = ($el[0] as Element).getBoundingClientRect();
      ($el[0] as Element).dispatchEvent(
        new MouseEvent('mousemove', {
          clientX: r.left + Math.max(1, r.width / 2),
          clientY: r.top + Math.max(1, r.height / 2),
          bubbles: true
        })
      );
    });

    cy.get('[data-testid="world-heatmap-map"] .heatmap-tooltip.heatmap-tooltip-visible', {timeout: 10000}).should('be.visible');

    cy.get('@usaCountryPath').should('exist').then(($el) => {
      ($el[0] as Element).dispatchEvent(
        new MouseEvent('mouseleave', {
          bubbles: true
        })
      );
    });

    cy.get('[data-testid="world-heatmap-map"] .heatmap-tooltip').should('exist');
    openCountryReportFromMap();
    cy.contains('[data-testid="heatmap-report"] h3', 'Reports', {timeout: 10000}).should('be.visible');
    cy.get('[data-testid="heatmap-report"] .overflow-y-auto').should('exist');
    cy.get('[data-testid="heatmap-report-close"]').scrollIntoView().should('be.visible').click();
    cy.get('[data-testid="heatmap-report"]', {timeout: 15000}).should('not.exist');

    openCountryReportFromMap();
    cy.get('[data-testid="heatmap-report-overlay"]').scrollIntoView().click('topLeft');
    cy.get('[data-testid="heatmap-report"]', {timeout: 15000}).should('not.exist');
  });

  it('covers branch paths by invoking heatmap component API', () => {
    cy.loginAsAdmin();
    cy.clock();

    getHeatmapComponent().then((comp: any) => {
      comp.ngOnChanges({
        data: {
          firstChange: false,
          currentValue: [{name: 'Mockland', value: 2}],
          previousValue: []
        }
      });

      let appService = comp['appService'];
      let originalWorld = appService.worldJson();
      appService.worldJson.set(null);
      comp['createChart']();
      appService.worldJson.set(originalWorld);
      comp['createChart']();

      let originalAll = comp['allCategoryReports'];
      comp['allCategoryReports'] = {};
      comp['startCategoryRotation']();
      comp['allCategoryReports'] = {
        leak: [{m_country: ['United States, Canada']}, {m_country: ['Canada']}],
        generic: [{m_country: ['France']}],
        exploit: [],
        chat: [],
        social: [],
        defacement: []
      };
      comp['startCategoryRotation']();

      let reports = comp.getReportsByCountry('Canada');
      expect(reports.length).to.be.greaterThan(0);
      comp['openCountryReport']('Canada');
      expect(comp.isOpenCountryReport).to.equal(true);
      expect(Array.isArray(comp.selectedCountryReports)).to.equal(true);
      comp.closeCountryReport();
      expect(comp.isOpenCountryReport).to.equal(false);
      comp['onCountryClick']({});
      comp['onCountryClick']({properties: {name: 'Canada'}});
      expect(comp.isOpenCountryReport).to.equal(true);
      comp.closeCountryReport();
      comp['allCategoryReports'] = originalAll;
      comp.ngOnDestroy();
    });

    cy.tick(8100);
    cy.get('[data-testid="world-heatmap-map"] svg', {timeout: 15000}).should('exist');
    cy.logout();
  });
});
