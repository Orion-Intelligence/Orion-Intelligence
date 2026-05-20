const textMatcher = (value: string) => new RegExp(`^\\s*${value}\\s*$`, 'i');

const getSatelliteIntel = () => cy.get('app-satellite-intel', { timeout: 120000 });
const getThreatLens = () => cy.get('app-threat-lens', { timeout: 120000 });

const buildPowerPlantRecords = () => {
  const fuels = ['Hydro', 'Solar', 'Wind', 'Gas', 'Coal', 'Oil', 'Nuclear'];
  const countries = ['United States', 'China', 'Germany', 'Pakistan', 'Brazil'];

  return Array.from({ length: 1005 }, (_value, index) => ({
    id: `geo-fencing-power-plant-${index + 1}`,
    name: `Geo Fencing Test Facility ${index + 1}`,
    primary_fuel: fuels[index % fuels.length],
    type: fuels[index % fuels.length],
    country: countries[index % countries.length],
    capacity_mw: 50 + (index % 250),
    lat: -45 + (index % 90),
    lon: -170 + (Math.floor(index / 90) * 28),
  }));
};

const stubGeoFencingMicroApis = () => {
  const powerPlantRecords = buildPowerPlantRecords();

  cy.intercept('POST', '**/api/search/power-plants/stream', {
    statusCode: 200,
    headers: {
      'content-type': 'application/x-ndjson',
    },
    body: `${JSON.stringify(powerPlantRecords)}\n`,
  }).as('powerPlantStream');

  cy.intercept('POST', '**/api/search/power-plants/by-ids', (req) => {
    const ids = Array.isArray(req.body) ? req.body : [];
    const selected = powerPlantRecords
      .filter((record) => ids.includes(record.id))
      .map((record) => ({
        id: record.id,
        name: record.name,
        type: record.primary_fuel,
        country: record.country,
        capacity: record.capacity_mw,
        source: 'WRI',
        location: {
          lat: record.lat,
          lon: record.lon,
        },
      }));

    req.reply({
      statusCode: 200,
      body: {
        Result: selected,
      },
    });
  }).as('powerPlantDetails');

  cy.intercept('POST', '**/api/satellite/facilities', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        total: 0,
        features: [],
        type_counts: {},
      },
    },
  }).as('satelliteFacilities');

  cy.intercept('POST', '**/api/satellite/livetrack/**', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        aircraft: [],
        ships: [],
      },
    },
  }).as('satelliteLiveTrack');

  cy.intercept('POST', '**/api/satellite/sentinel/**', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        results: [],
      },
    },
  }).as('satelliteSentinel');

  cy.intercept('POST', '**/api/satellite/anomaly', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        months: [],
      },
    },
  }).as('satelliteAnomaly');

  cy.intercept('POST', '**/api/satellite/compare', {
    statusCode: 200,
    body: {
      status: 'done',
      result: {
        status: 'done',
        months: [],
      },
    },
  }).as('satelliteCompare');
};

const openGeoFencingFromHomepage = () => {
  cy.get('[data-testid="ioc-basic-tag-Geo Fencing"]', { timeout: 60000 })
    .should('be.visible')
    .click();

  cy.location('pathname', { timeout: 60000 }).should('include', '/dashboard/profile/consolidated/all');
  cy.location('search').should((search) => {
    expect(new URLSearchParams(search).get('tab')).to.equal('Geo Fencing');
  });
  getSatelliteIntel().should('be.visible');
};

const getSatellitePanel = (title: string) => {
  return getSatelliteIntel()
    .contains('.map-overlay-menu .text-\\[18px\\]', textMatcher(title), { timeout: 60000 })
    .parents('.map-overlay-menu')
    .first();
};

const getThreatPanelByTitle = (title: string) => {
  return getThreatLens()
    .contains('p,h2', textMatcher(title), { timeout: 60000 })
    .parents('.rounded-\\[12px\\], app-threat-lens-feed-panel')
    .first();
};

const toggleThreatPanel = (title: string) => {
  getThreatPanelByTitle(title)
    .find('button[aria-label="Collapse"], button[aria-label="Expand"]')
    .first()
    .click({ force: true });
};

describe('Geo Fencing - Satellite Intel and Threat Lens', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
    stubGeoFencingMicroApis();
    cy.on('uncaught:exception', (error) => {
      if (error.message.includes("_leaflet_pos")) {
        return false;
      }

      return true;
    });
  });

  after(() => {
    cy.logout();
  });

  it('loads satellite map dashboard, filters facility markers, and switches map layers', () => {
    openGeoFencingFromHomepage();

    getSatelliteIntel().contains('button', textMatcher('Satellite Map')).should('be.visible');
    getSatelliteIntel().contains('button', textMatcher('Threat Lens')).should('be.visible');
    getSatelliteIntel().contains('button', textMatcher('Satellite')).should('be.visible');
    getSatelliteIntel().contains('button', textMatcher('Street')).should('be.visible');

    getSatellitePanel('Dashboard').within(() => {
      cy.contains('div', textMatcher('Search')).should('be.visible');
      cy.get('input[placeholder="Search power plants or facilities"]').should('be.visible');
      cy.contains('div', textMatcher('All Facilities')).should('be.visible');
      cy.contains('span', /^Loaded\s+\d+\s+records$/i, { timeout: 120000 })
        .should('be.visible')
        .should(($count) => {
          expect(Number($count.text().match(/\d+/)?.[0] || 0)).to.be.greaterThan(1000);
        });
      cy.contains('div', /\d+\s+visible/i).should('be.visible');
    });

    cy.get('.leaflet-marker-icon', { timeout: 120000 }).should('have.length.greaterThan', 0);
    cy.get('.leaflet-marker-icon').first().click({ force: true });
    cy.wait('@powerPlantDetails', { timeout: 60000 });
    cy.get('app-power-plant-popup .ui-consolidated-main', { timeout: 60000 })
      .should('be.visible')
      .and('contain.text', 'Facility Details')
      .and('contain.text', 'Source')
      .and('contain.text', 'Coordinates');
    cy.get('app-power-plant-popup')
      .find('button[aria-label="Close popup"]')
      .first()
      .click({ force: true });

    getSatellitePanel('Dashboard')
      .contains('button', /Hydro|Solar|Wind|Gas|Coal|Oil|Nuclear|Geothermal|Biomass|Waste|Storage|Cogeneration|Petcoke|Wave/i)
      .parents('.grid')
      .first()
      .find('button')
      .then(($buttons) => {
        $buttons.each((_index, button) => {
          cy.wrap(button).click({ force: true });
        });
      });

    cy.get('.leaflet-marker-icon').should('have.length', 0);

    getSatelliteIntel().contains('button', textMatcher('Street')).first().click({ force: true });
    getSatelliteIntel()
      .contains('button', textMatcher('Street'))
      .should('have.class', 'bg-[var(--color-blue-640)]');

    getSatelliteIntel().contains('button', textMatcher('Satellite')).first().click({ force: true });
    getSatelliteIntel()
      .contains('button', textMatcher('Satellite'))
      .should('have.class', 'bg-[var(--color-blue-640)]');
  });

  it('loads Threat Lens, searches feeds, opens links, filters result count, and checks panel toggles', () => {
    openGeoFencingFromHomepage();

    getSatelliteIntel().contains('button', textMatcher('Threat Lens')).first().click({ force: true });
    getThreatLens().contains('Loading Threat Lens', { timeout: 60000 }).should('be.visible');

    getSatelliteIntel().contains('button', textMatcher('Satellite Map')).should('be.disabled');
    getSatelliteIntel().contains('button', textMatcher('Threat Lens')).should('be.disabled');
    getSatelliteIntel().contains('button', textMatcher('Satellite')).should('be.disabled');
    getSatelliteIntel().contains('button', textMatcher('Street')).should('be.disabled');

    getThreatLens().contains(/Loaded \d+ records/i, { timeout: 180000 }).should('be.visible');
    getThreatLens().contains('Loading Threat Lens').should('not.exist');
    getSatelliteIntel().contains('button', textMatcher('Satellite Map')).should('not.be.disabled');
    getSatelliteIntel().contains('button', textMatcher('Threat Lens')).should('not.be.disabled');
    getSatelliteIntel().contains('button', textMatcher('Satellite')).should('be.disabled');
    getSatelliteIntel().contains('button', textMatcher('Street')).should('be.disabled');

    ['Search', 'Threat Lens', 'News Feed', 'Archive'].forEach((title) => {
      toggleThreatPanel(title);
      getThreatPanelByTitle(title).find('button[aria-label="Expand"]').should('exist');
      toggleThreatPanel(title);
      getThreatPanelByTitle(title).find('button[aria-label="Collapse"]').should('exist');
    });

    getThreatPanelByTitle('News Feed')
      .find('input[placeholder="Search news feed..."]')
      .clear()
      .type('envirosep');

    getThreatPanelByTitle('News Feed')
      .contains('Envirosep', { timeout: 60000 })
      .should('be.visible');

    getThreatPanelByTitle('Archive')
      .find('input[placeholder="Search archive..."]')
      .clear()
      .type('data leak');

    getThreatPanelByTitle('Archive')
      .contains('No archive activity found for the selected time window.', { timeout: 60000 })
      .should('be.visible');

    getThreatLens()
      .contains(/Showing rotating arc batches of up to 5|rotating in batches of up to 5/i, { timeout: 60000 })
      .should('be.visible');
    getThreatLens().contains(/Arcs currently visible:\s*5/i, { timeout: 60000 }).should('be.visible');

    getThreatPanelByTitle('Search')
      .contains('button', /\d+/)
      .first()
      .click({ force: true });

    getThreatLens().contains(/Selected:/, { timeout: 120000 }).should('be.visible');

    getThreatPanelByTitle('Search')
      .find('input[placeholder^="Search keyword"]')
      .clear()
      .type('china{enter}');

    getThreatLens().contains('Active keyword:', { timeout: 120000 }).should('be.visible');
    getThreatLens().contains(/china/i).should('be.visible');
    getThreatLens().contains(/Loaded \d+ records/i, { timeout: 120000 }).should('be.visible');

    cy.window().then((win) => {
      cy.stub(win, 'open').as('openThreatLensLink');
    });

    getThreatPanelByTitle('News Feed')
      .find('button')
      .filter((_index, button) => Boolean(button.textContent?.trim().includes('Envirosep')))
      .first()
      .click({ force: true });

    cy.get('@openThreatLensLink').should('have.been.calledOnce');

    cy.intercept('POST', '**/api/threat/lens').as('filteredThreatLens');

    getSatelliteIntel().find('button.map-overlay-menu').first().click({ force: true });
    getSatelliteIntel().contains('button', textMatcher('Filter'), { timeout: 60000 }).first().click({ force: true });
    cy.get('input#side-filter-platform_result_count', { timeout: 60000 }).clear().type('5');
    cy.get('[data-testid="side-filter-apply"]').filter(':visible').first().click();

    cy.wait('@filteredThreatLens', { timeout: 120000 }).then(({ request, response }) => {
      expect(String(request.body?.platform_result_count ?? '')).to.equal('5');

      [
        'leak_model',
        'tracking_model',
        'news_model',
        'exploit_model',
        'defacement_model',
        'chat_model',
        'social_model',
        'generic_model',
      ].forEach((key) => {
        const results = response?.body?.[key]?.Result;
        if (Array.isArray(results)) {
          expect(results.length, `${key} result count`).to.be.at.most(5);
        }
      });
    });

    getThreatLens().contains(/Loaded \d+ records/i, { timeout: 120000 }).should('be.visible');
    getThreatLens().contains('Category Layers').should('be.visible');
    getThreatPanelByTitle('Search')
      .contains(/Leak|Defacement|Exploit|Social|Chat|Generic|News/i)
      .should('be.visible');
  });
});
