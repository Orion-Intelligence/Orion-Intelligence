import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { SearchFiltersComponent } from "../search-filters/search-filters.component";
import { HomeInsightComponent } from "../home-insight/home-insight.component";
import { SettingsService } from '../../../services/settings/settings.service';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule, SearchFiltersComponent, HomeInsightComponent],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent implements OnInit {
  searchQuery = '';

  showFiltersOverlay: boolean = false;
  advanceSettingToggle: boolean = true;
  @ViewChild('filtersWrapper', { static: false }) filtersWrapperRef!: ElementRef;
  @ViewChild('searchInput', { static: false }) searchInputRef!: ElementRef;

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router, private settingsService: SettingsService) {
  }
  ngOnInit(): void {
    this.advanceSettingToggle = this.settingsService.get('advanceSettingToggle', true) ?? true;
  }

  onSearchSubmit(): void {
    this.dashboardService.consolidatedCallbackModel = new ConsolidatedCallbackModel();
    const queryParams = {
      ...this.route.snapshot.queryParams,
      q: this.searchQuery || null
    };

    this.router.navigate(['/dashboard/consolidated/all'], {
      queryParams,
      queryParamsHandling: 'merge'
    }).then();
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
    this.advanceSettingToggle = !this.advanceSettingToggle;
    this.settingsService.set('advanceSettingToggle', this.advanceSettingToggle);
    this.showFiltersOverlay = true;
  }
}
