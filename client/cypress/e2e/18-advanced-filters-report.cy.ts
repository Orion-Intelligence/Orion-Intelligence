import {
  ADVANCED_FILTER_FIXTURES,
  visitDashboard18,
  openSidebarGroup18,
  clickSidebarSubItem18,
  runSectionFilters18,
} from './controllers/18-advanced-filters-report.controller';

describe('Orion Intelligence – Advanced Filters Resilient Validation', () => {

  beforeEach(() => {
    cy.loginAsAdmin();
    visitDashboard18();
  });

  after(() => {
    cy.logout();
  });

  const targetSections: ('General Intelligence' | 'Data Breach' | 'Defacement' | 'Social' | 'Exploit' | 'Feed')[] = ['General Intelligence', 'Data Breach', 'Defacement', 'Exploit', 'Social', 'Feed'];

  targetSections.forEach((section) => {
    it(`${section}: Verify filters by scanning report detail and metadata`, () => {
      const fx = ADVANCED_FILTER_FIXTURES.find((f) => f.section_title === section);
      if (!fx) return;

      openSidebarGroup18(section);
      const subItem = section === 'Feed' ? 'News' : 'All';
      clickSidebarSubItem18(section, subItem);


      runSectionFilters18(section, fx.filters);
    });
  });
});
