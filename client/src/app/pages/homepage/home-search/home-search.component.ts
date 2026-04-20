import { Component, ElementRef, HostListener, OnInit, ViewChild, input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';
import { AppService } from '../../../services/core/app/app.service';
import { HomeInsightComponent } from '../home-insight/home-insight.component';
import { AuthService } from '../../../services/authetication/auth.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { HomeSearchService } from '../../../services/home_search/home.search.service';
import { WorldHeatmapComponent } from '../world-heatmap/world-heatmap.component';
import { DemoTourComponent } from "../../demo-tour/demo-tour/demo-tour.component";

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule, SearchFiltersComponent, HomeInsightComponent, WorldHeatmapComponent, DemoTourComponent],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent implements OnInit {
  private readonly allowedTabs = ['IOCs', 'Deep Search', 'Network Intelligence'];
  private insightPointerId: number | null = null;
  private insightStartY = 0;
  private insightStartOffset = 0;
  private insightMoved = false;
  private suppressInsightClick = false;
  private insightMax = 0;
  private removeWindowListeners: (() => void) | null = null;

  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;
  @ViewChild('matchTypeDropdown', { static: false }) matchTypeDropdownRef?: ElementRef<HTMLDetailsElement>;
  searchQuery = '';
  selectedSearchBy = 'Match any term';
  homeInsightExpanded = false;
  public insightDragging = false;
  public insightDragY: number | null = null;
  insightTranslateY = 0;
  selectedTab='IOCs';
  readonly isRoleAdmin = input<boolean>(true);
  readonly hideToolsSection = input<boolean>(false);
  readonly hideHeatmapAndAnalytics = input<boolean>(false);
  readonly compactLayout = input<boolean>(false);

  constructor( public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router, public app_service: AppService, protected authService: AuthService, protected licenseService: LicenseService, protected homeSearchService: HomeSearchService ) {}

  ngOnInit(): void {
    const cfg = this.app_service.configData();
    const matchtype = cfg.localSettings.matchType;
    this.onSetMatchType(matchtype);
    this.computeInsightMax();
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (typeof tab === 'string' && this.allowedTabs.includes(tab)) {
        this.selectTab(tab);
      }
      else{
        this.selectTab("IOCs");
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.computeInsightMax();
  }

  private computeInsightMax() {
    this.insightMax = Math.round(window.innerHeight * 0.30);
    this.refreshInsightTransformClass();
  }

  private getInsightTransform(): string {
    const max = this.insightMax || Math.round(window.innerHeight * 0.30);
    const y = this.insightDragging
      ? (this.insightDragY ?? (this.homeInsightExpanded ? -max : 0))
      : (this.homeInsightExpanded ? -max : 0);
    return `translate3d(0, ${y}px, 0)`;
  }

  private refreshInsightTransformClass(): void {
    const transform = this.getInsightTransform();
    const match = /,\s*(-?\d+)px,/.exec(transform);
    const y = match ? Number(match[1]) : 0;
    this.insightTranslateY = Math.max(0, Math.min(600, Math.round(Math.abs(Math.min(0, y)))));
  }

  onSetMatchType(type: string) {
    this.homeSearchService.setMatchType(type);
  }

  onSearchSubmit(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.searchInputRef?.nativeElement.blur();
    this.dashboardService.consolidatedCallbackModel = new ConsolidatedCallbackModel();
    const queryParams = {
      ...this.route.snapshot.queryParams,
      q: this.searchQuery || null
    };
    this.router.navigate(['/dashboard/profile/consolidated/all'], {
      queryParams,
      queryParamsHandling: 'merge'
    }).then();
  }

  getMatchType() {
    const matchtype = this.dashboardService.selectedFilters()['matchtype'];
    if (matchtype === 'full') {
      return 'Match full query';
    }
    if (matchtype === 'or') {
      return 'Match any term';
    }
    if (matchtype === 'semantic') {
      return 'Match semantic query';
    }
    return 'Match individual terms';
  }

  setFilterOverlay(newValue: boolean) {
    this.homeSearchService.showFiltersOverlay = newValue;
  }

  onAdvanceSettingToggle() {
    this.homeSearchService.toggleAdvanceSettings();
  }

  onToolToggle(event: Event) {
    this.closeMatchTypeDropdown();
    this.homeSearchService.closeOverlay();
    this.homeSearchService.toggleAdvancedTools(event);
  }

  onSearchInput(event: Event) {
    this.homeSearchService.handleSearchInput(event);
  }

  clearSearchInput(): void {
    this.searchQuery = '';
    const inputElement = this.searchInputRef?.nativeElement as HTMLInputElement | undefined;
    if (inputElement) {
      inputElement.value = '';
      inputElement.focus();
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  closeMatchTypeDropdown(): void {
    const dropdownElement = this.matchTypeDropdownRef?.nativeElement;
    if (dropdownElement?.open) {
      dropdownElement.open = false;
    }
  }

  onInsightToggleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.suppressInsightClick) {
      this.suppressInsightClick = false;
      return;
    }
    if (this.insightDragging || this.insightMoved) {
      this.insightMoved = false;
      return;
    }
    this.homeInsightExpanded = !this.homeInsightExpanded;
    this.refreshInsightTransformClass();
  }

  onInsightPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.computeInsightMax();
    const max = this.insightMax;

    const currentTargetElement = event.currentTarget as HTMLElement;
    try {
      currentTargetElement.setPointerCapture(event.pointerId);
    }
    catch {
      // Ignore pointer-capture failures on unsupported targets.
    }

    this.insightDragging = true;
    this.insightMoved = false;
    this.suppressInsightClick = false;
    this.insightPointerId = event.pointerId;

    this.insightStartY = event.clientY;
    this.insightStartOffset = this.homeInsightExpanded ? -max : 0;
    this.insightDragY = this.insightStartOffset;
    this.refreshInsightTransformClass();

    this.attachWindowPointerListeners();
  }

  private attachWindowPointerListeners() {
    this.detachWindowPointerListeners();

    const move = (e: PointerEvent) => {
      this.onInsightPointerMove(e); 
    };
    const up = (e: PointerEvent) => {
      this.onInsightPointerUp(e); 
    };
    const cancel = (e: PointerEvent) => {
      this.onInsightPointerCancel(e); 
    };

    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', up, { passive: false });
    window.addEventListener('pointercancel', cancel, { passive: false });

    this.removeWindowListeners = () => {
      window.removeEventListener('pointermove', move as any);
      window.removeEventListener('pointerup', up as any);
      window.removeEventListener('pointercancel', cancel as any);
      this.removeWindowListeners = null;
    };
  }

  private detachWindowPointerListeners() {
    if (this.removeWindowListeners) {
      this.removeWindowListeners();
    }
  }

  onInsightPointerMove(event: PointerEvent): void {
    if (!this.insightDragging || this.insightPointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const max = this.insightMax || Math.round(window.innerHeight * 0.30);
    const dy = event.clientY - this.insightStartY;

    if (Math.abs(dy) > 3) {
      this.insightMoved = true;
    }

    const next = this.insightStartOffset + dy;
    this.insightDragY = Math.max(-max, Math.min(0, next));
    this.refreshInsightTransformClass();
  }

  onInsightPointerUp(event: PointerEvent): void {
    if (this.insightPointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const max = this.insightMax || Math.round(window.innerHeight * 0.30);
    const mid = -max / 2;
    const y = this.insightDragY ?? (this.homeInsightExpanded ? -max : 0);

    if (this.insightMoved) {
      this.homeInsightExpanded = y <= mid;
    }
    else {
      this.homeInsightExpanded = !this.homeInsightExpanded;
    }

    this.suppressInsightClick = true;
    this.insightMoved = false;
    this.insightPointerId = null;
    this.insightDragging = false;
    this.insightDragY = null;
    this.refreshInsightTransformClass();

    this.detachWindowPointerListeners();
  }

  onInsightPointerCancel(event: PointerEvent): void {
    if (this.insightPointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    this.insightPointerId = null;
    this.insightDragging = false;
    this.insightDragY = null;
    this.suppressInsightClick = true;
    this.insightMoved = false;
    this.refreshInsightTransformClass();

    this.detachWindowPointerListeners();
  }

  selectTab(tab:string){
    this.selectedTab=tab;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab },
      queryParamsHandling: 'merge',
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.homeSearchService.handleDocumentClick(event, this.filtersWrapperRef, this.searchInputRef);
    const target = event.target as Node | null;
    const detailsEl = this.matchTypeDropdownRef?.nativeElement;
    if (detailsEl && target && !detailsEl.contains(target)) {
      detailsEl.open = false;
    }
  }
}
