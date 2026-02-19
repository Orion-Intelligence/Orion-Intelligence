
import { Suggestion, SuggestionOption } from '../../src/app/shared/model/results/shared/common-result';
import { initCallbackModel } from '../../src/app/shared/model/results/callback.init';
import { buildSocialProfileUrl } from '../../src/app/pages/graphs/social-graph/utils/profile-url.util';
import { ChatCallbackModel, ChatResultItem } from '../../src/app/shared/model/results/chat/chat.callback.model';
import { DefacementCallbackModel, DefacementResultItem } from '../../src/app/shared/model/results/defacement/defacement.callback.model';
import { ExploitCallbackModel, ExploitResultItem } from '../../src/app/shared/model/results/exploit/exploit.callback.model';
import { GeneralCallbackModel, GeneralResultItem } from '../../src/app/shared/model/results/general/general.callback.model';
import { LeakCallbackModel, LeakResultItem } from '../../src/app/shared/model/results/leak/leak.callback.model';
import { SocialCallbackModel, SocialResultItem } from '../../src/app/shared/model/results/social/social.callback.model';
import { StealerLogCallbackModel, StealerLogResultItem } from '../../src/app/shared/model/results/credentials/credential.callback.model';
import { RankedCallbackModel } from '../../src/app/shared/model/results/consolidated/ranked.callback.model';
import { ConsolidatedParamModel } from '../../src/app/shared/model/results/consolidated/consolidated.param.model';

describe('Orion Intelligence - Heatmap Coverage', () => {
  const getHeatmapComponent = () =>
    cy.window().then((win) => {
      const host = win.document.querySelector('app-world-heatmap') as any;
      expect(host, 'app-world-heatmap host').to.exist;

      const ngApi = (win as any).ng;
      if (ngApi?.getComponent) {
        return ngApi.getComponent(host) as any;
      }

      // Fallback when Angular debug API isn't exposed.
      const ctx = host.__ngContext__ as any[] | undefined;
      expect(ctx, 'Angular context fallback').to.exist;
      const comp = (ctx || []).find((x: any) => x && x.constructor?.name === 'WorldHeatmapComponent');
      expect(comp, 'WorldHeatmapComponent in ngContext').to.exist;
      return comp as any;
    });

  const openHomepage = () => {
    cy.visit('/dashboard/profile/homepage');
    cy.get('app-world-heatmap', { timeout: 30000 }).should('be.visible');
    cy.get('app-world-heatmap .map-container svg', { timeout: 30000 }).should('exist');
    cy.get('app-world-heatmap .map-container path.country', { timeout: 30000 }).should('have.length.greaterThan', 0);
  };

  const openCountryReportFromMap = () => {
    cy.get('app-world-heatmap .map-container').then(($container) => {
      const hasDataCountry = $container.find('path.country.has-data').length > 0;
      if (hasDataCountry) {
        cy.wrap($container).find('path.country.has-data').first().click({ force: true });
      } else {
        cy.wrap($container).find('path.country').first().click({ force: true });
      }
    });

    cy.get('app-heatmap-report', { timeout: 15000 }).should('be.visible');
  };

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('covers world heatmap render, resize redraw, country popup open, and popup close', () => {
    openHomepage();

    // HostListener onResize -> createChart
    cy.viewport(1280, 800);
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');
    cy.viewport(1440, 900);
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');

    // Hover handlers on map paths
    cy.get('app-world-heatmap .map-container path.country').first().trigger('mousemove', {
      clientX: 40,
      clientY: 40,
      force: true
    });
    cy.get('app-world-heatmap .map-container .heatmap-tooltip.heatmap-tooltip-visible', { timeout: 10000 }).should('be.visible');
    cy.get('app-world-heatmap .map-container path.country').first().trigger('mouseleave', { force: true });
    cy.get('app-world-heatmap .map-container .heatmap-tooltip').should('exist');

    // Click guard path: country with no data should not open popup
    cy.get('body').then(($body) => {
      const noData = $body.find('app-world-heatmap .map-container path.country:not(.has-data)');
      if (noData.length > 0) {
        cy.wrap(noData[0]).click({ force: true });
        cy.get('app-heatmap-report').should('not.exist');
      }
    });

    // Open report modal from data country click
    openCountryReportFromMap();
    cy.contains('app-heatmap-report h3', 'Reports', { timeout: 10000 }).should('be.visible');
    cy.get('app-heatmap-report .report-list').should('exist');

    // Close via close button (HeatmapReportComponent.closePopup -> emit -> closeCountryReport)
    cy.get('app-heatmap-report button.close-btn').click({ force: true });
    cy.get('app-heatmap-report', { timeout: 15000 }).should('not.exist');

    // Re-open and close via overlay path
    openCountryReportFromMap();
    cy.get('app-heatmap-report .overlay').click('topLeft', { force: true });
    cy.get('app-heatmap-report', { timeout: 15000 }).should('not.exist');
  });

  it('covers remaining branch paths by invoking component API in e2e context', () => {
    openHomepage();

    cy.clock();

    getHeatmapComponent().then((comp: any) => {
      // ngOnChanges guarded path
      comp.ngOnChanges({
        data: {
          firstChange: false,
          currentValue: [{ name: 'Mockland', value: 2 }],
          previousValue: []
        }
      });

      // createChart early-return path (worldJson missing)
      const appService = comp['appService'];
      const originalWorld = appService.worldJson();
      appService.worldJson.set(null);
      comp['createChart']();
      appService.worldJson.set(originalWorld);
      comp['createChart']();

      // startCategoryRotation no-category path
      const originalAll = comp['allCategoryReports'];
      comp['allCategoryReports'] = {};
      comp['startCategoryRotation']();

      // startCategoryRotation interval callback path with deterministic data
      comp['allCategoryReports'] = {
        leak: [{ m_country: ['United States, Canada'] }, { m_country: ['Canada'] }],
        generic: [{ m_country: ['France'] }],
        exploit: [],
        chat: [],
        social: [],
        defacement: []
      };
      comp['startCategoryRotation']();

      // open/calc report helpers
      const reports = comp.getReportsByCountry('Canada');
      expect(reports.length).to.be.greaterThan(0);
      comp['openCountryReport']('Canada');
      expect(comp.isOpenCountryReport).to.equal(true);
      expect(Array.isArray(comp.selectedCountryReports)).to.equal(true);
      comp.closeCountryReport();
      expect(comp.isOpenCountryReport).to.equal(false);

      // onCountryClick guard + success paths
      comp['onCountryClick']({});
      comp['onCountryClick']({ properties: { name: 'Canada' } });
      expect(comp.isOpenCountryReport).to.equal(true);
      comp.closeCountryReport();

      // Restore original data and cleanup
      comp['allCategoryReports'] = originalAll;
      comp.ngOnDestroy();
    });

    cy.tick(8100);

    // Ensure DOM still functional after direct API branch calls
    cy.get('app-world-heatmap .map-container svg', { timeout: 15000 }).should('exist');
  });
});

describe('Orion Intelligence - Extras Utilities Coverage', () => {
  it('covers common-result constructors', () => {
    const optionDefault = new SuggestionOption();
    expect(optionDefault.text).to.eq('');

    const optionInit = new SuggestionOption({ text: 'alt' });
    expect(optionInit.text).to.eq('alt');

    const suggestionDefault = new Suggestion();
    expect(suggestionDefault.text).to.eq('');
    expect(suggestionDefault.offset).to.eq(0);
    expect(suggestionDefault.length).to.eq(0);
    expect(suggestionDefault.options).to.deep.eq([]);

    const suggestionInit = new Suggestion({
      text: 'word',
      offset: 2,
      length: 4,
      options: [{ text: 'a' }, { text: 'b' }]
    });
    expect(suggestionInit.text).to.eq('word');
    expect(suggestionInit.offset).to.eq(2);
    expect(suggestionInit.length).to.eq(4);
    expect(suggestionInit.options).to.have.length(2);
    expect(suggestionInit.options[0]).to.be.instanceOf(SuggestionOption);
    expect(suggestionInit.options[0].text).to.eq('a');
  });

  it('covers callback.init branches', () => {
    const target = {
      Result: [] as Array<{ id: number }>,
      Suggestions: [] as Suggestion[],
      Page_Count: 0
    };

    initCallbackModel(target, undefined, (r: Partial<{ id: number }>) => ({ id: Number(r.id ?? -1) }));
    expect(target.Result).to.deep.eq([]);
    expect(target.Suggestions).to.deep.eq([]);
    expect(target.Page_Count).to.eq(0);

    initCallbackModel(
      target,
      {
        Result: [{ id: 1 }, { id: 2 }],
        Suggestions: [{ text: 'q', offset: 1, length: 2, options: [{ text: 'qq' }] }],
        Page_Count: 7
      },
      (r: Partial<{ id: number }>) => ({ id: Number(r.id ?? -1) })
    );
    expect(target.Result).to.deep.eq([{ id: 1 }, { id: 2 }]);
    expect(target.Suggestions).to.have.length(1);
    expect(target.Suggestions[0]).to.be.instanceOf(Suggestion);
    expect(target.Page_Count).to.eq(7);

    initCallbackModel(target, {}, (r: Partial<{ id: number }>) => ({ id: Number(r.id ?? -1) }));
    expect(target.Result).to.deep.eq([]);
    expect(target.Suggestions).to.deep.eq([]);
    expect(target.Page_Count).to.eq(0);
  });

  it('covers profile-url utility branches', () => {
    expect(buildSocialProfileUrl('x', 'alice')).to.eq('https://x.com/alice');
    expect(buildSocialProfileUrl('twitter', '@alice')).to.eq('https://x.com/alice');
    expect(buildSocialProfileUrl('instagram', 'alice')).to.eq('https://www.instagram.com/alice');
    expect(buildSocialProfileUrl('facebook', 'alice')).to.eq('https://www.facebook.com/alice');
    expect(buildSocialProfileUrl('tiktok', 'alice')).to.eq('https://www.tiktok.com/@alice');
    expect(buildSocialProfileUrl('youtube', 'alice')).to.eq('https://www.youtube.com/@alice');
    expect(buildSocialProfileUrl('github', 'alice')).to.eq('https://github.com/alice');
    expect(buildSocialProfileUrl('gitlab', 'alice')).to.eq('https://gitlab.com/alice');
    expect(buildSocialProfileUrl('bitbucket', 'alice')).to.eq('https://bitbucket.org/alice');
    expect(buildSocialProfileUrl('linkedin', 'alice')).to.eq('https://www.linkedin.com/in/alice');
    expect(buildSocialProfileUrl('reddit', 'alice')).to.eq('https://www.reddit.com/user/alice');

    expect(buildSocialProfileUrl('unknown', '', '')).to.eq('#');
    expect(buildSocialProfileUrl('unknown', '', 'https://example.com/base')).to.eq('https://example.com/base');

    expect(buildSocialProfileUrl('unknown', '@alice', 'https://example.com/users/alice')).to.eq('https://example.com/users/alice');
    expect(buildSocialProfileUrl('unknown', 'alice', 'https://example.com')).to.eq('https://example.com/alice');
    expect(buildSocialProfileUrl('unknown', 'alice', 'https://example.com/base/path/')).to.eq('https://example.com/base/path/alice');
    expect(buildSocialProfileUrl('unknown', 'alice', 'not a url')).to.eq('not a url');
    expect(buildSocialProfileUrl('unknown', 'alice')).to.eq('#');
  });
});

describe('Orion Intelligence - Extras Result Models Coverage', () => {
  it('covers result item constructors and callback model init paths', () => {
    const chatItem = new ChatResultItem({ m_caption: 'caption', m_weblink: ['a'] });
    expect(chatItem.m_caption).to.eq('caption');
    const chatModel = new ChatCallbackModel({
      Result: [{ m_caption: 'c1' }],
      Suggestions: [{ text: 's' }],
      Page_Count: 2
    } as any);
    expect(chatModel.Result[0]).to.be.instanceOf(ChatResultItem);
    expect(chatModel.Suggestions[0]).to.be.instanceOf(Suggestion);
    expect(chatModel.Page_Count).to.eq(2);

    const leakItem = new LeakResultItem({ m_title: 'title' });
    expect(leakItem.m_title).to.eq('title');
    const leakModel = new LeakCallbackModel({
      Result: [{ m_title: 'x' }],
      Suggestions: [{ text: 'l' }],
      Page_Count: 3
    } as any);
    expect(leakModel.Result[0]).to.be.instanceOf(LeakResultItem);
    expect(leakModel.Page_Count).to.eq(3);

    const exploitItem = new ExploitResultItem({ m_title: 'exp' });
    expect(exploitItem.m_title).to.eq('exp');
    const exploitModel = new ExploitCallbackModel({
      Result: [{ m_title: 'exp2' }],
      Suggestions: [{ text: 'e' }],
      Page_Count: 4
    } as any);
    expect(exploitModel.Result[0]).to.be.instanceOf(ExploitResultItem);
    expect(exploitModel.Page_Count).to.eq(4);

    const socialItem = new SocialResultItem({ m_platform: 'twitter' });
    expect(socialItem.m_platform).to.eq('twitter');
    expect(socialItem.m_summary).to.deep.eq([]);
    const socialModel = new SocialCallbackModel({
      Result: [{ m_platform: 'x' }],
      Suggestions: [{ text: 'soc' }],
      Page_Count: 5
    } as any);
    expect(socialModel.Result[0]).to.be.instanceOf(SocialResultItem);
    expect(socialModel.Page_Count).to.eq(5);

    const generalItem = new GeneralResultItem({ m_title: 'g' });
    expect(generalItem.m_title).to.eq('g');
    expect(generalItem.m_content_type).to.be.an('array');
    const generalModel = new GeneralCallbackModel({
      Result: [{ m_title: 'g2' }],
      Suggestions: [{ text: 'gen' }],
      Page_Count: 6
    } as any);
    expect(generalModel.Result[0]).to.be.instanceOf(GeneralResultItem);
    expect(generalModel.Page_Count).to.eq(6);

    const defacementItem = new DefacementResultItem({ q: 'site' });
    expect(defacementItem.q).to.eq('site');
    const defacementModel = new DefacementCallbackModel({
      Result: [{ q: 'site2' }],
      Suggestions: [{ text: 'def' }],
      Page_Count: 7
    } as any);
    expect(defacementModel.Result[0]).to.be.instanceOf(DefacementResultItem);
    expect(defacementModel.Page_Count).to.eq(7);

    const stealerItem = new StealerLogResultItem({ type: 'telegram', raw: 'x' });
    expect(stealerItem.type).to.eq('telegram');
    const stealerModel = new StealerLogCallbackModel({
      Result: [{ type: 'log' }],
      Suggestions: [{ text: 'st' }],
      Page_Count: 8
    } as any);
    expect(stealerModel.Result[0]).to.be.instanceOf(StealerLogResultItem);
    expect(stealerModel.Page_Count).to.eq(8);
  });

  it('covers ranked and consolidated param models', () => {
    const rankedDefault = new RankedCallbackModel();
    expect(rankedDefault.result).to.deep.eq([]);
    expect(rankedDefault.pageCount).to.eq(0);
    expect(rankedDefault.totalHits).to.eq(0);

    const rankedInit = new RankedCallbackModel({
      result: [{ id: 1 }],
      pageCount: 2,
      totalHits: 3
    });
    expect(rankedInit.result).to.have.length(1);
    expect(rankedInit.pageCount).to.eq(2);
    expect(rankedInit.totalHits).to.eq(3);

    const param = new ConsolidatedParamModel();
    param.q = 'abc';
    param.page = 9;
    param.category = 'leak';
    param.platform = 'x';
    param.content = 'posts';
    param.email = 'a@b.com';
    param.username = 'alice';
    param.url = 'https://example.com';
    param.user = 'u';
    param.ioc = 'ioc';
    param.fullsearch = true;
    param.tab = 'social';
    param.reset();

    expect(param.q).to.eq('');
    expect(param.page).to.eq(1);
    expect(param.category).to.eq('all');
    expect(param.platform).to.eq('all');
    expect(param.content).to.eq('all');
    expect(param.email).to.eq(undefined);
    expect(param.username).to.eq(undefined);
    expect(param.url).to.eq('');
    expect(param.user).to.eq('');
    expect(param.ioc).to.eq('');
    expect(param.fullsearch).to.eq(false);
    expect(param.tab).to.eq('');
  });
});

describe('Orion Intelligence - Home Search Coverage', () => {
  const getHomeSearchComponent = () =>
    cy.window().then((win) => {
      const host = win.document.querySelector('app-home-search') as any;
      expect(host, 'app-home-search host').to.exist;

      const ngApi = (win as any).ng;
      if (ngApi?.getComponent) {
        return ngApi.getComponent(host) as any;
      }

      const ctx = host.__ngContext__ as any[] | undefined;
      expect(ctx, 'Angular context fallback').to.exist;
      const comp = (ctx || []).find((x: any) => x && x.constructor?.name === 'HomeSearchComponent');
      expect(comp, 'HomeSearchComponent in ngContext').to.exist;
      return comp as any;
    });

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('covers HomeSearchComponent branch logic via component API', () => {
    cy.visit('/dashboard/profile/homepage');
    cy.get('app-home-search', { timeout: 30000 }).should('exist');

    getHomeSearchComponent().then((comp: any) => {
      // getMatchType branches
      const originalSelectedFilters = comp.dashboardService.selectedFilters;
      comp.dashboardService.selectedFilters = () => ({ matchtype: 'full' });
      expect(comp.getMatchType()).to.eq('Match full query');
      comp.dashboardService.selectedFilters = () => ({ matchtype: 'or' });
      expect(comp.getMatchType()).to.eq('Match any term');
      comp.dashboardService.selectedFilters = () => ({ matchtype: 'semantic' });
      expect(comp.getMatchType()).to.eq('Match semantic query');
      comp.dashboardService.selectedFilters = () => ({ matchtype: 'and' });
      expect(comp.getMatchType()).to.eq('Match individual terms');
      comp.dashboardService.selectedFilters = originalSelectedFilters;

      // direct handlers
      comp.onSetMatchType('or');
      comp.setFilterOverlay(true);
      expect(comp.homeSearchService.showFiltersOverlay).to.eq(true);
      comp.setFilterOverlay(false);
      expect(comp.homeSearchService.showFiltersOverlay).to.eq(false);

      let advancedCalls = 0;
      let toolEvent: Event | null = null;
      let inputEvent: Event | null = null;
      let documentClickArgs: any[] = [];
      comp.homeSearchService.toggleAdvanceSettings = () => { advancedCalls += 1; };
      comp.homeSearchService.toggleAdvancedTools = (e: Event) => { toolEvent = e; };
      comp.homeSearchService.handleSearchInput = (e: Event) => { inputEvent = e; };
      comp.homeSearchService.handleDocumentClick = (...args: any[]) => { documentClickArgs = args; };

      comp.onAdvanceSettingToggle();
      expect(advancedCalls).to.eq(1);

      const toolEvt = new Event('click');
      comp.onToolToggle(toolEvt);
      expect(toolEvent).to.eq(toolEvt);

      const inputEvt = new Event('input');
      comp.onSearchInput(inputEvt);
      expect(inputEvent).to.eq(inputEvt);

      // onInsightToggleClick both branches
      const toggleEvt = {
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as MouseEvent;

      comp.homeInsightExpanded = false;
      comp['insightMoved'] = true;
      comp.onInsightToggleClick(toggleEvt);
      expect(comp['insightMoved']).to.eq(false);
      expect(comp.homeInsightExpanded).to.eq(false);

      comp.onInsightToggleClick(toggleEvt);
      expect(comp.homeInsightExpanded).to.eq(true);

      // pointer handlers
      const pointerTarget = {
        setPointerCapture: () => {},
        releasePointerCapture: () => {}
      } as unknown as HTMLElement;

      const downEvt = {
        pointerId: 101,
        clientY: 100,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerDown(downEvt);
      expect(comp.insightDragging).to.eq(true);
      expect(comp['insightPointerId']).to.eq(101);

      const wrongMoveEvt = {
        pointerId: 102,
        clientY: 140,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerMove(wrongMoveEvt);

      const moveEvt = {
        pointerId: 101,
        clientY: 140,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerMove(moveEvt);
      expect(comp['insightMoved']).to.eq(true);
      expect(comp.insightDragY).to.not.eq(null);

      const upEvt = {
        pointerId: 101,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerUp(upEvt);
      expect(comp['insightPointerId']).to.eq(null);
      expect(comp.insightDragging).to.eq(false);
      expect(comp.insightDragY).to.eq(null);

      const downEvt2 = {
        pointerId: 201,
        clientY: 90,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerDown(downEvt2);

      const wrongCancelEvt = {
        pointerId: 999,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerCancel(wrongCancelEvt);
      expect(comp['insightPointerId']).to.eq(201);

      const cancelEvt = {
        pointerId: 201,
        currentTarget: pointerTarget,
        preventDefault: () => {},
        stopPropagation: () => {}
      } as unknown as PointerEvent;
      comp.onInsightPointerCancel(cancelEvt);
      expect(comp['insightPointerId']).to.eq(null);
      expect(comp.insightDragging).to.eq(false);
      expect(comp.insightDragY).to.eq(null);

      // onDocumentClick path
      comp.filtersWrapperRef = { nativeElement: {} };
      comp.searchInputRef = { nativeElement: {} };
      const docEvt = new MouseEvent('click');
      comp.onDocumentClick(docEvt);
      expect(documentClickArgs[0]).to.eq(docEvt);
      expect(documentClickArgs[1]).to.eq(comp.filtersWrapperRef);
      expect(documentClickArgs[2]).to.eq(comp.searchInputRef);

      // onSearchSubmit path
      let blurred = false;
      comp.searchInputRef = { nativeElement: { blur: () => { blurred = true; } } };
      comp.searchQuery = 'intel';
      const navigateStub = cy.stub(comp['router'], 'navigate').returns(Promise.resolve(true) as any);
      comp.onSearchSubmit();
      expect(blurred).to.eq(true);
      expect(navigateStub).to.have.been.called;
    });
  });
});

describe('Orion Intelligence - Social Graph Coverage Boost', () => {
  const getNgComponent = (selector: string, componentName: string) =>
    cy.window().then((win) => {
      const host = win.document.querySelector(selector) as any;
      expect(host, `${selector} host`).to.exist;
      const ngApi = (win as any).ng;
      if (ngApi?.getComponent) return ngApi.getComponent(host) as any;
      const ctx = host.__ngContext__ as any[] | undefined;
      expect(ctx, `${componentName} ngContext`).to.exist;
      const comp = (ctx || []).find((x: any) => x && x.constructor?.name === componentName);
      expect(comp, `${componentName} instance`).to.exist;
      return comp as any;
    });

  const samplePlatform = (overrides: Record<string, any> = {}) => ({
    keyUsername: 'e2e-user',
    platform: 'Twitter',
    username: 'e2e_handle',
    url: 'https://x.com/e2e_handle',
    isSelected: true,
    status: 'active',
    allMetadata: { bio: 'E2E user', score: 10 },
    profileDetails: { real_name: 'E2E User', bio: 'bio' },
    posts: [
      { post_url: 'https://x.com/e2e/status/1', datetime: '2026-01-01', caption: 'c1', likes: '1', comments: '0', shares: '0', views: '1', media_type: 'image', media_url: '' },
      { post_url: 'https://x.com/e2e/status/2', datetime: '2026-01-02', caption: 'c2', likes: '2', comments: '0', shares: '0', views: '2', media_type: 'image', media_url: '' },
      { post_url: 'https://x.com/e2e/status/3', datetime: '2026-01-03', caption: 'c3', likes: '3', comments: '0', shares: '0', views: '3', media_type: 'image', media_url: '' },
      { post_url: 'https://x.com/e2e/status/4', datetime: '2026-01-04', caption: 'c4', likes: '4', comments: '0', shares: '0', views: '4', media_type: 'image', media_url: '' }
    ],
    images: [
      { image_url: 'https://example.com/1.jpg', thumbnail: 'https://example.com/1_t.jpg', title: '1', source: 'e2e' },
      { image_url: 'https://example.com/2.jpg', thumbnail: 'https://example.com/2_t.jpg', title: '2', source: 'e2e' },
      { image_url: 'https://example.com/3.jpg', thumbnail: 'https://example.com/3_t.jpg', title: '3', source: 'e2e' },
      { image_url: 'https://example.com/4.jpg', thumbnail: 'https://example.com/4_t.jpg', title: '4', source: 'e2e' },
      { image_url: 'https://example.com/5.jpg', thumbnail: 'https://example.com/5_t.jpg', title: '5', source: 'e2e' },
      { image_url: 'https://example.com/6.jpg', thumbnail: 'https://example.com/6_t.jpg', title: '6', source: 'e2e' },
      { image_url: 'https://example.com/7.jpg', thumbnail: 'https://example.com/7_t.jpg', title: '7', source: 'e2e' },
      { image_url: 'https://example.com/8.jpg', thumbnail: 'https://example.com/8_t.jpg', title: '8', source: 'e2e' },
      { image_url: 'https://example.com/9.jpg', thumbnail: 'https://example.com/9_t.jpg', title: '9', source: 'e2e' }
    ],
    followers_list: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'],
    following_list: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10', 'u11'],
    ...overrides
  });

  const visitSocialGraph = () => {
    cy.viewport(1440, 900);
    cy.intercept('GET', '**/api/social/session/tabs?graph_type=social*').as('socialTabs');
    cy.visit('/dashboard/social-graph');
    cy.wait('@socialTabs', { timeout: 30000 });
    cy.get('app-social-graph', { timeout: 20000 }).should('be.visible');
  };

  beforeEach(() => {
    cy.session('admin-session', () => {
      cy.loginAsAdmin();
    });
  });

  it('covers MetadataPopupComponent methods and load-more branches', () => {
    visitSocialGraph();
    getNgComponent('app-social-graph', 'SocialMapperComponent').then((mapper: any) => {
      mapper.state.selectedPlatformData.set(samplePlatform());
      mapper.state.isMetadataPopupVisible.set(true);
    });
    cy.get('app-metadata-popup', { timeout: 15000 }).should('exist');
    cy.get('app-metadata-popup > div.fixed.inset-0', { timeout: 15000 }).should('be.visible');

    getNgComponent('app-metadata-popup', 'MetadataPopupComponent').then((comp: any) => {
      const key = comp.getPlatformUniqueKey();
      expect(key).to.be.a('string').and.include('platform-');
      expect(comp.getMetadataEntries()).to.be.an('array');
      expect(comp.getProfileDetailEntries()).to.be.an('array');
      expect(comp.trackByKey(0, { key: 'k' })).to.eq('k');
      expect(comp.trackByUsername(0, 'u')).to.eq('u');
      expect(comp.getAccountUrl()).to.match(/^https?:\/\/|^#/);

      const closeSpy = cy.stub(comp.close, 'emit');
      comp.onClose();
      expect(closeSpy).to.have.been.called;

      const postsBefore = comp.displayPosts().length;
      comp.loadMorePosts();
      comp.loadMoreImages();
      comp.loadMoreFollowers();
      comp.loadMoreFollowing();
      const postsAfterFirstLoad = comp.displayPosts().length;
      comp.isLoadingMorePosts.set(true);
      comp.loadMorePosts(); // early-return branch
      expect(postsAfterFirstLoad).to.be.greaterThan(postsBefore);
      expect(comp.displayPosts().length).to.eq(postsAfterFirstLoad);

      const originalData = comp.data;
      comp.data = () => ({
        ...originalData(),
        allMetadata: null,
        profileDetails: null,
        posts: null,
        images: null,
        followers_list: null,
        following_list: null
      });
      expect(comp.getMetadataEntries()).to.deep.eq([]);
      expect(comp.getProfileDetailEntries()).to.deep.eq([]);
      comp.data = originalData;
    });

    cy.wait(1200);
    cy.get('app-metadata-popup').then(($el) => {
      if ($el.find('button:contains(\"Done\")').length) {
        cy.contains('app-metadata-popup button', 'Done').click({ force: true });
      }
    });
  });

  it('covers SummaryPlatformViewComponent helper/load branches', () => {
    visitSocialGraph();
    getNgComponent('app-social-graph', 'SocialMapperComponent').then((mapper: any) => {
      mapper.state.summaryPopupData.set({
        username: 'e2e-user',
        platforms: [
          samplePlatform(),
          samplePlatform({
            platform: 'Github',
            username: 'e2e-gh',
            url: 'https://github.com/e2e-gh',
            posts: [],
            images: [],
            followers_list: [],
            following_list: []
          })
        ]
      });
    });
    cy.get('app-profile-summary-popup', { timeout: 15000 }).should('exist');
    cy.get('app-profile-summary-popup > div.fixed.inset-0', { timeout: 15000 }).should('be.visible');
    cy.get('app-profile-summary-popup .group.flex.items-center.p-2.rounded-md.transition-colors.cursor-pointer').eq(1).click({ force: true });
    cy.get('app-summary-platform-view', { timeout: 15000 }).should('exist');

    getNgComponent('app-summary-platform-view', 'SummaryPlatformViewComponent').then((comp: any) => {
      const p = comp.platform();
      expect(p).to.exist;
      expect(comp.getPlatformUniqueKey(p)).to.include('platform-');
      expect(comp.getProfileDetailEntries(null)).to.deep.eq([]);
      expect(comp.getProfileDetailEntries(p)).to.be.an('array');
      expect(comp.getAccountUrl(p)).to.match(/^https?:\/\/|^#/);

      comp.loadMorePosts();
      comp.loadMoreImages();
      comp.loadMoreFollowers();
      comp.loadMoreFollowing();
      comp.isLoadingMoreImages.set(true);
      comp.loadMoreImages(); // early-return
      comp.isLoadingMoreImages.set(false);
    });

    cy.wait(1200);
    cy.get('app-profile-summary-popup button').filter(':has(i.bi-x-lg)').first().click({ force: true });
    cy.get('app-profile-summary-popup', { timeout: 10000 }).should('not.exist');
  });

  it('covers social context menu computed branches', () => {
    visitSocialGraph();
    getNgComponent('app-social-graph', 'SocialMapperComponent').then((mapper: any) => {
      const mkEvt = (x: number, y: number) =>
        new MouseEvent('contextmenu', { clientX: x, clientY: y }) as MouseEvent;

      mapper.state.onNodeRightClicked({ nodeId: 'user-john', event: mkEvt(20, 20) }, false);
      expect(mapper.state.contextMenuData()).to.deep.include({ nodeId: 'user-john', type: 'user' });

      mapper.state.onNodeRightClicked({ nodeId: 'platform-john|github|octo', event: mkEvt(1200, 600) }, false);
      expect(mapper.state.contextMenuData()).to.deep.include({ nodeId: 'platform-john|github|octo', type: 'platform' });

      mapper.state.onNodeRightClicked({ nodeId: 'group-john-github', event: mkEvt(1200, 600) }, false);
      expect(mapper.state.contextMenuData()).to.deep.include({ nodeId: 'group-john-github', type: 'group' });

      mapper.state.closeContextMenu();
      expect(mapper.state.contextMenuData()).to.eq(null);
    });
  });
});
