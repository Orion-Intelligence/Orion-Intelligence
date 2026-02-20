import { Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { SearchFiltersComponent } from "../search-filters/search-filters.component";
import { AppService } from '../../../services/core/app/app.service';
import { HomeInsightComponent } from "../home-insight/home-insight.component";
import { AuthService } from '../../../services/authetication/auth.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { HomeSearchService } from '../../../services/home_search/home.search.service';
import { WorldHeatmapComponent } from "../world-heatmap/world-heatmap.component";
@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule, SearchFiltersComponent, HomeInsightComponent, WorldHeatmapComponent],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent implements OnInit {
  @Input() isRoleAdmin: boolean = true;
  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;
  searchQuery = '';
  selectedSearchBy = 'Match any term';
  homeInsightExpanded = false;

  public insightDragging = false;
  public insightDragY: number | null = null;

  private insightPointerId: number | null = null;
  private insightStartY = 0;
  private insightStartOffset = 0;
  private insightMoved = false;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router, public app_service: AppService, protected authService: AuthService, protected licenseService: LicenseService, protected homeSearchService: HomeSearchService) {
  }

  ngOnInit(): void {
    const cfg = this.app_service.configData();
    const matchtype = cfg.localSettings.matchType;
    this.onSetMatchType(matchtype);
  }

  onSetMatchType(type: string) {
    this.homeSearchService.setMatchType(type);
  }

  onSearchSubmit(): void {
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
    const matchtype = this.dashboardService.selectedFilters()["matchtype"];
    if (matchtype === "full") {
      return "Match full query";
    }
    else if (matchtype === "or") {
      return "Match any term";
    }
    else if (matchtype === "semantic") {
      return "Match semantic query";
    }
    else {
      return "Match individual terms";
    }
  }

  setFilterOverlay(newValue: boolean) {
    this.homeSearchService.showFiltersOverlay = newValue;
  }

  onAdvanceSettingToggle() {
    this.homeSearchService.toggleAdvanceSettings();
  }

  onToolToggle(event: Event) {
    this.homeSearchService.toggleAdvancedTools(event);
  }

  onSearchInput(event: Event) {
    this.homeSearchService.handleSearchInput(event);
  }

  onInsightToggleClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.insightMoved) {
      this.insightMoved = false;
      return;
    }
    this.homeInsightExpanded = !this.homeInsightExpanded;
  }

  onInsightPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    el.setPointerCapture(event.pointerId);
    this.insightDragging = true;
    this.insightMoved = false;
    this.insightPointerId = event.pointerId;
    this.insightStartY = event.clientY;
    const max = Math.round(window.innerHeight * 0.30);
    this.insightStartOffset = this.homeInsightExpanded ? -max : 0;
    this.insightDragY = this.insightStartOffset;
  }

  onInsightPointerMove(event: PointerEvent): void {
    if (!this.insightDragging || this.insightPointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const max = Math.round(window.innerHeight * 0.30);
    const dy = event.clientY - this.insightStartY;
    if (Math.abs(dy) > 3) {
      this.insightMoved = true;
    }
    const next = this.insightStartOffset + dy;
    this.insightDragY = Math.max(-max, Math.min(0, next));
  }

  onInsightPointerUp(event: PointerEvent): void {
    if (this.insightPointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    try {
      el.releasePointerCapture(event.pointerId);
    }
    catch {
    }
    const max = Math.round(window.innerHeight * 0.30);
    const mid = -max / 2;
    const y = this.insightDragY ?? (this.homeInsightExpanded ? -max : 0);
    this.homeInsightExpanded = y <= mid;
    this.insightPointerId = null;
    this.insightDragging = false;
    this.insightDragY = null;
  }

  onInsightPointerCancel(event: PointerEvent): void {
    if (this.insightPointerId !== event.pointerId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    try {
      el.releasePointerCapture(event.pointerId);
    }
    catch {
    }
    this.insightPointerId = null;
    this.insightDragging = false;
    this.insightDragY = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.homeSearchService.handleDocumentClick(event, this.filtersWrapperRef, this.searchInputRef);
  }
}
