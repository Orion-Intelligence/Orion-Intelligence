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

  showFiltersOverlay: boolean = false;
  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router, public app_service: AppService,
    protected authService: AuthService, protected licenseService: LicenseService) {
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
    this.dashboardService.selectedFilters.set({
      ...this.dashboardService.selectedFilters(),
      matchtype: type
    });
    this.app_service.set('matchType', type);
  }

  onSearchSubmit(): void {
    this.searchInputRef?.nativeElement.blur();
    this.dashboardService.consolidatedCallbackModel = new ConsolidatedCallbackModel();
    const queryParams = {
      ...this.route.snapshot.queryParams,
      q: this.searchQuery || null
    };

    // if (this.isRoleAdmin) {
    //   this.router.navigate(['/dashboard/consolidated/all'], {
    //     queryParams,
    //     queryParamsHandling: 'merge'
    //   }).then();
    // } else {
    this.router.navigate(['/dashboard/profile/consolidated/all'], {
      queryParams,
      queryParamsHandling: 'merge'
    }).then();
    // }
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

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    const clickedInsideFilter =
      this.filtersWrapperRef?.nativeElement.contains(target);
    const clickedInput =
      this.searchInputRef?.nativeElement.contains(target);

    if (!clickedInsideFilter && !clickedInput) {
      this.setFilterOverlay(false);
    }
  }

  setFilterOverlay(newValue: boolean) {
    this.showFiltersOverlay = newValue;
  }

  onAdvanceSettingToggle() {
    this.app_service.set('advance_setting_toggle', !this.app_service.configData().localSettings.advance_setting_toggle);
    this.showFiltersOverlay = true;
  }

  onToolToggle(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const cfg = this.app_service.configData();
    cfg.localSettings.enable_advanced_tools = !cfg.localSettings.enable_advanced_tools;
    this.app_service.set('enable_advanced_tools', this.app_service.configData().localSettings.enable_advanced_tools);
    this.app_service.configData.set(cfg);
  }
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value?.trim();
    if (value && window.innerWidth < 460) {
      this.setFilterOverlay(false);
    }
  }
}
