import { Component, ElementRef, HostListener, OnInit, OnDestroy, NgZone, ViewChild, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { SearchFiltersComponent } from '../search-filters/search-filters.component';
import { AppService } from '../../../services/core/app/app.service';
import { HomeInsightComponent } from '../home-insight/home-insight.component';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { HomeSearchService } from '../../../shared/partials/result/services/home.search.service';
import { WorldHeatmapComponent } from '../world-heatmap/world-heatmap.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule, RouterLink, SearchFiltersComponent, HomeInsightComponent, WorldHeatmapComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './home-search.component.html',
  styleUrls: ['./home-search.component.css'],
})
export class HomeSearchComponent implements OnInit, OnDestroy {
  private insightPointerId: number | null = null;
  private insightStartY = 0;
  private insightStartOffset = 0;
  private insightMoved = false;
  private suppressInsightClick = false;
  private insightMax = 0;
  private insightFrame: number | null = null;
  private insightCaptureTarget: HTMLElement | null = null;
  private removeWindowListeners: (() => void) | null = null;
  private insightTranslateY = 0;

  protected readonly tabs = ['IOCs', 'Deep Search', 'Network Intelligence', 'Geo Fencing'];

  @ViewChild('insightPanel') insightPanelRef?: ElementRef<HTMLElement>;
  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('matchTypeDropdown', { static: false }) matchTypeDropdownRef?: ElementRef<HTMLDetailsElement>;
  searchQuery = '';
  selectedSearchBy = 'Match any term';
  homeInsightExpanded = false;
  public insightDragging = false;
  public insightDragY: number | null = null;
  selectedTab='IOCs';
  readonly isRoleAdmin = input<boolean>(true);
  readonly hideToolsSection = input<boolean>(false);
  readonly hideHeatmapAndAnalytics = input<boolean>(false);
  readonly compactLayout = input<boolean>(false);

  constructor( public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router, public app_service: AppService, protected licenseService: LicenseService, protected homeSearchService: HomeSearchService, private zone: NgZone ) {}

  ngOnInit(): void {
    const cfg = this.app_service.configData();
    const matchtype = cfg.localSettings.matchType;
    this.onSetMatchType(matchtype);
    this.computeInsightMax();
    this.route.queryParams.subscribe(params => {
      const tab = params.tab;
      if (typeof tab === 'string' && this.tabs.includes(tab)) {
        this.selectedTab = tab;
      }
      else{
        this.selectedTab = "IOCs";
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelInsightFrame();
    this.detachWindowPointerListeners();
    this.releaseInsightPointer();
  }

  @HostListener('window:resize')
  onResize() {
    if (this.insightDragging) {
      this.finishInsightDrag();
    }
    this.computeInsightMax();
  }

  private computeInsightMax() {
    this.insightMax = Math.min(600, Math.round(window.innerHeight * 0.30));
    this.renderInsightPosition(this.homeInsightExpanded ? -this.insightMax : 0);
  }

  private renderInsightPosition(y: number): void {
    const next = Math.round(Math.max(0, Math.min(this.insightMax, -y)));
    // Keep drag frames local to the panel; do not recheck the map and analytics.
    this.insightPanelRef?.nativeElement.classList.replace(`ui-translate-y-neg-${this.insightTranslateY}`, `ui-translate-y-neg-${next}`);
    this.insightTranslateY = next;
  }

  private cancelInsightFrame(): void {
    if (this.insightFrame !== null) {
      window.cancelAnimationFrame(this.insightFrame);
      this.insightFrame = null;
    }
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
    const matchtype = this.dashboardService.selectedFilters().matchtype;
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
    const inputElement = this.searchInputRef?.nativeElement;
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
    // A pointer release already settles the panel. Keyboard clicks still toggle it.
    if (this.suppressInsightClick && event.detail !== 0) {
      this.suppressInsightClick = false;
      return;
    }
    this.suppressInsightClick = false;
    if (this.insightDragging) {
      return;
    }
    this.homeInsightExpanded = !this.homeInsightExpanded;
    this.renderInsightPosition(this.homeInsightExpanded ? -this.insightMax : 0);
  }

  onInsightPointerDown(event: PointerEvent): void {
    const target = event.currentTarget;
    const panel = this.insightPanelRef?.nativeElement;
    if (event.button !== 0 || !event.isPrimary || this.insightPointerId !== null ||
        !(target instanceof HTMLElement) || !panel) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    target.focus({ preventScroll: true });
    this.insightMax = Math.min(600, Math.round(window.innerHeight * 0.30));

    // Grabbing during a snap must start at its visible position, not its destination.
    const transform = window.getComputedStyle(panel).transform;
    const visibleY = transform === 'none' ? 0 : new DOMMatrixReadOnly(transform).m42;
    this.insightStartOffset = Math.max(-this.insightMax, Math.min(0, visibleY));
    this.insightStartY = event.clientY;
    this.insightDragY = this.insightStartOffset;
    this.insightDragging = true;
    this.insightMoved = false;
    this.suppressInsightClick = false;
    this.insightPointerId = event.pointerId;
    this.insightCaptureTarget = target;
    panel.classList.add('is-dragging');
    this.renderInsightPosition(this.insightStartOffset);

    try {
      target.setPointerCapture(event.pointerId);
    }
    catch {
      // Window listeners also cover browsers that cannot capture this pointer.
    }
    this.attachWindowPointerListeners();
  }

  private attachWindowPointerListeners(): void {
    this.detachWindowPointerListeners();
    this.zone.runOutsideAngular(() => {
      const move = (event: PointerEvent) => {
        this.onInsightPointerMove(event);
      };
      const up = (event: PointerEvent) => {
        this.zone.run(() => {
          this.onInsightPointerUp(event);
        });
      };
      const cancel = (event: PointerEvent) => {
        this.zone.run(() => {
          this.onInsightPointerCancel(event);
        });
      };
      const blur = () => {
        this.zone.run(() => {
          this.finishInsightDrag();
        });
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up, { passive: false });
      window.addEventListener('pointercancel', cancel, { passive: false });
      window.addEventListener('blur', blur);
      this.removeWindowListeners = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', cancel);
        window.removeEventListener('blur', blur);
        this.removeWindowListeners = null;
      };
    });
  }

  private detachWindowPointerListeners(): void {
    this.removeWindowListeners?.();
  }

  private releaseInsightPointer(): void {
    const pointerId = this.insightPointerId;
    this.insightPointerId = null;
    if (pointerId !== null && this.insightCaptureTarget?.hasPointerCapture(pointerId)) {
      this.insightCaptureTarget.releasePointerCapture(pointerId);
    }
    this.insightCaptureTarget = null;
  }

  onInsightPointerMove(event: PointerEvent): void {
    if (!this.insightDragging || this.insightPointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const dy = event.clientY - this.insightStartY;
    if (Math.abs(dy) > 3) {
      this.insightMoved = true;
    }
    this.insightDragY = Math.max(-this.insightMax, Math.min(0, this.insightStartOffset + dy));
    if (this.insightFrame === null) {
      this.insightFrame = window.requestAnimationFrame(() => {
        this.insightFrame = null;
        this.renderInsightPosition(this.insightDragY ?? this.insightStartOffset);
      });
    }
  }

  onInsightPointerUp(event: PointerEvent): void {
    if (this.insightPointerId !== event.pointerId) {
      return;
    }
    // Include the release coordinate even if its last move has not painted yet.
    this.onInsightPointerMove(event);
    this.homeInsightExpanded = this.insightMoved
      ? (this.insightDragY ?? 0) <= -this.insightMax / 2
      : !this.homeInsightExpanded;
    this.finishInsightDrag();
  }

  onInsightPointerCancel(event: PointerEvent): void {
    if (this.insightPointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.finishInsightDrag();
  }

  private finishInsightDrag(): void {
    this.cancelInsightFrame();
    this.renderInsightPosition(this.insightDragY ?? this.insightStartOffset);
    const panel = this.insightPanelRef?.nativeElement;
    // Commit the final drag frame before restoring the settling transition.
    if (panel) {
      void panel.offsetHeight;
      panel.classList.remove('is-dragging');
    }
    this.insightDragging = false;
    this.insightDragY = null;
    this.insightMoved = false;
    this.suppressInsightClick = true;
    this.detachWindowPointerListeners();
    this.releaseInsightPointer();
    this.renderInsightPosition(this.homeInsightExpanded ? -this.insightMax : 0);
  }

  canViewSocialIntel(): boolean {
    return this.licenseService.isAdmin() || (!this.licenseService.isDemo() && this.licenseService.canUseModule('social_mapper'));
  }

  async selectTab(tab:string){
    this.selectedTab=tab;
    await this.router.navigate([], {
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
