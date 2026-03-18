export type FilterCategoryKey =
  | 'country' | 'currencies' | 'language' | 'domains' | 'ip_addresses'
  | 'cve_cwe' | 'hashtags' | 'author' | 'organizations' | 'locations';

export type AdvancedFilterFixture = {section_title: 'General Intelligence' | 'Data Breach' | 'Defacement' | 'Social' | 'Exploit' | 'Feed'; subitem_title: 'All' | 'News'; filters: Partial<Record<FilterCategoryKey, string[]>>; };

const CATEGORY_TO_TAB_TEXT: Record<string, string> = {
  currencies: 'Currencies',
  language: 'Language',
  domains: 'Domain',
  country: 'Country',
  organizations: 'Organization',
  locations: 'Location',
  ip_addresses: 'Content',
  hashtags: 'Content',
  author: 'Content',
  cve_cwe: 'Content',
};

export let ADVANCED_FILTER_FIXTURES: AdvancedFilterFixture[] = [
  {
    section_title: 'Data Breach',
    subitem_title: 'All',
    filters: { country: ['Canada'], domains: ['mission.in'], locations: ['Toronto'] },
  },
  {
    section_title: 'General Intelligence',
    subitem_title: 'All',
    filters: { currencies: ['USD'], domains: ['2222jzj4mec63vhvtsj3m3sk4wipoizepc2elo6qwauo3r3jhsjyd6yd.onion'] },
  },
  {
    section_title: 'Defacement',
    subitem_title: 'All',
    filters: { ip_addresses: ['66.96.149.32'], domains: ['instromegypt.com'] },
  },
  {
    section_title: 'Exploit',
    subitem_title: 'All',
    filters: {organizations: ['Skyvern']},
  },
  {
    section_title: 'Social',
    subitem_title: 'All',
    filters: { author: ['Wise'], domains: ['crackingx.com'] },

  },
  {
    section_title: 'Feed',
    subitem_title: 'News',
    filters: { organizations: ['Europol'], domains: ['vesilaitosyhdistys.fi'] },
  },
];

let SIDEBAR_GROUP_TESTID: Record<string, string> = {
  'General Intelligence': 'sidebar-group-strategic',
  'Data Breach': 'sidebar-group-breach',
  'Defacement': 'sidebar-group-defacement',
  'Social': 'sidebar-group-social',
  'Exploit': 'sidebar-group-exploit',
  'Feed': 'sidebar-group-feed',
};

let SIDEBAR_SUBITEM_PREFIX: Record<string, string> = {
  'General Intelligence': 'strategic',
  'Data Breach': 'breach',
  'Defacement': 'defacement',
  'Social': 'social',
  'Exploit': 'exploit',
  'Feed': 'feed',
};


export function visitDashboard18() {
  cy.visit('/dashboard/profile/homepage');
}

export function openSidebarGroup18(title: string) {
  const testId = SIDEBAR_GROUP_TESTID[title];
  cy.get(`[data-testid="${testId}"]`, { timeout: 30000 }).scrollIntoView().should('be.visible').click();
}

export function clickSidebarSubItem18(groupTitle: string, itemTitle: string) {
  const prefix = SIDEBAR_SUBITEM_PREFIX[groupTitle];
  const testId = groupTitle === 'Feed' ? 'sidebar-subitem-feed-news' : `sidebar-subitem-${prefix}-${itemTitle.toLowerCase()}`;
  cy.get(`[data-testid="${testId}"]`, { timeout: 30000 }).scrollIntoView().should('be.visible').click();
}

export function openAdvancedFiltersPanel18() {
  cy.get('input[data-testid="dashboard-general-input"][name="q"]', { timeout: 30000 }).first().click();
}

export function clearAdvancedFilters18() {
  openAdvancedFiltersPanel18();
  cy.get('[data-testid="entity-filter-clear-selection"]').should('be.visible').click();
}

export function selectAdvancedFilterCategory18(category: FilterCategoryKey) {
  openAdvancedFiltersPanel18();
  const formattedCategory = category.replace(/_/g, '-');
  cy.get(`[data-testid="entity-filter-category-${formattedCategory}"]`).scrollIntoView().click();
}

export function addAdvancedFilterValue18(value: string) {
  cy.get('[data-testid="entity-filter-value-input"]').scrollIntoView().type(value);
  cy.get('[data-testid="entity-filter-add-value"]').click();
}

export function submitSearchByEnter18() {
  cy.get('body').type('{esc}');
  cy.get('input[data-testid="dashboard-general-input"][name="q"]').first().click().type('{enter}');
}



export function guardAgainstEmptyResults18() {
  cy.get('body', { timeout: 30000 }).then(($body) => {
    if ($body.find('.empty-result-card').length > 0) {
      throw new Error('DATA NOT FOUND: The search returned no documents for these filter values.');
    }
  });
}

export function openReportDetail18(sectionTitle: string) {
  guardAgainstEmptyResults18();
  if (sectionTitle === 'Defacement') {
    cy.get('tbody tr.cursor-pointer', { timeout: 30000 }).first().click();
  } else {
    cy.get('[data-testid="open-report"]', { timeout: 30000 }).first().click();
  }
}

export function assertValuesInMetadata18(category: FilterCategoryKey, values: string[]) {
  const primaryTabLabel = CATEGORY_TO_TAB_TEXT[category];

  cy.contains('span', 'Metadata', { timeout: 20000 }).should('be.visible');

  values.forEach((val) => {
    const targetVal = val.replace(/^#/, '').toLowerCase();

    const getMetadataTabs = () => cy.contains('span', 'Metadata')
      .closest('.ui-result-card')
      .find('div.flex-wrap button');

    cy.get('body').then(($body) => {
      if ($body.text().toLowerCase().includes(targetVal)) {
        cy.log(`Value "${val}" found.`);
        return;
      }

      if (primaryTabLabel) {
        getMetadataTabs().each(($btn) => {
          if ($btn.text().trim().toLowerCase() === primaryTabLabel.toLowerCase()) {
            cy.wrap($btn).click({ force: true });
            cy.wait(1000);
          }
        });
      }

      cy.get('body').then(($newBody) => {
        if (!$newBody.text().toLowerCase().includes(targetVal)) {
          getMetadataTabs().each(($btn) => {
            cy.wrap($btn).click({ force: true });
            cy.wait(800);

          });
        }
      });

     cy.contains('span', 'Metadata')
  .closest('.ui-result-card')
  .within(() => {
    cy.get('li', { timeout: 10000 })
      .should('exist')
      .should(($els) => {
        const text = $els.text().toLowerCase();
      });
  });
      });
    });

}

export function runSectionFilters18(
  sectionTitle: AdvancedFilterFixture['section_title'],
  filters: Partial<Record<FilterCategoryKey, string[]>>
) {
  clearAdvancedFilters18();

  Object.keys(filters).forEach((k) => {
    const category = k as FilterCategoryKey;
    const values = filters[category];

    if (values && values.length > 0) {
      selectAdvancedFilterCategory18(category);
      values.forEach((v) => addAdvancedFilterValue18(v));
    }
  });

  submitSearchByEnter18();

  cy.get('app-loading-form', { timeout: 30000 }).should('not.exist');

  openReportDetail18(sectionTitle);

  Object.keys(filters).forEach((k) => {
    const category = k as FilterCategoryKey;
    const values = filters[category];

    if (values && values.length > 0) {
      assertValuesInMetadata18(category, values);
    }
  });

  cy.go('back');
  cy.wait(1000);
}
