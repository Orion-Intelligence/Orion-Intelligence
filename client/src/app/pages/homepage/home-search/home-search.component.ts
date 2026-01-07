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

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule, SearchFiltersComponent, HomeInsightComponent],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent implements OnInit {
  @Input() isRoleAdmin: boolean = true;
  searchQuery = '';
  selectedSearchBy = 'Match any term';
  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router, public app_service: AppService,
    protected authService: AuthService, protected licenseService: LicenseService, protected homeSearchService: HomeSearchService) {
  }

  ngOnInit(): void {
    const cfg = this.app_service.configData();
    const matchtype = cfg.localSettings.matchType;
    this.onSetMatchType(matchtype)
    // if (!this.isRoleAdmin) {
    //   this.onSearchSubmit();
    // }
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
    } else if (matchtype === "or") {
      return "Match any term";
    } else if (matchtype === "semantic") {
      return "Match semantic query";
    } else {
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
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.homeSearchService.handleDocumentClick(
      event,
      this.filtersWrapperRef,
      this.searchInputRef
    );
  }
}
