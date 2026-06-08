import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';
import { TenantModel, TenantStatusValues } from '../../shared/model/tenant/tenant.model';
import { search_filter_labels } from '../../shared/constants/shared-enums';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../../services/core/app/app.service';
import { TooltipDirective } from '../../shared/directive/tooltip-directive.directive';
import { ConfirmationPopupComponent } from '../../shared/partials/confirmation-popup/confirmation-popup.component';
import { HeaderComponent } from '../../shared/partials/header/login-header/header.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-tenant',
  imports: [FormsModule, CommonModule, TooltipDirective, ConfirmationPopupComponent, NgClass, HeaderComponent, TranslatePipe],
  templateUrl: './tenant.component.html'
})
export class TenantComponent implements OnInit {
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;
  onboardingData: TenantModel = { id: '', name: '', iocs: [], phone: '', country: '', city: '', postal_code: '' };
  currentStep = 1;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  isConfirmationOpen: boolean = false;
  iocSearchText: string = '';
  categories: Record<string, string[]> = {};

  constructor(private router: Router, public apiService: ApiService, public appService: AppService) {
  }

  ngOnInit(): void {
    this.initializeIOCs();
  }

  private initializeIOCs(): void {
    const search_filter_keys = Object.keys(search_filter_labels);
    this.onboardingData.iocs = Array.from(search_filter_keys).map(key => ({
      ioc_id: key,
      name: search_filter_labels[key] || key,
      values: []
    }));
    this.selectedCategoryId = this.onboardingData.iocs[0]?.ioc_id;
  }

  onCategoryClick(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  addIoc(value: string): void {
    if (!value.trim() || !this.selectedCategoryId) {
      return;
    }
    const category = this.onboardingData.iocs.find(c => c.ioc_id === this.selectedCategoryId);
    if (category && !category.values.includes(value.trim())) {
      category.values.push(value.trim());
    }
  }

  removeIoc(iocId: string, value: string): void {
    const ioc = this.onboardingData.iocs.find(i => i.ioc_id === iocId);
    if (ioc) {
      ioc.values = ioc.values.filter(v => v !== value);
    }
  }

  scrollLeft() {
    this.categoryScroll.nativeElement.scrollBy({ left: -250, behavior: 'smooth' });
  }

  scrollRight() {
    this.categoryScroll.nativeElement.scrollBy({ left: 250, behavior: 'smooth' });
  }

  goNext() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  goBack() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  hasIocsWithValues(): boolean {
    return this.onboardingData?.iocs?.some(ioc => ioc.values.length > 0) ?? false;
  }

  getFilteredIocs() {
    if (!this.iocSearchText) {
      return this.onboardingData.iocs;
    }
    return this.onboardingData.iocs.filter(ioc => ioc.name.toLowerCase().includes(this.iocSearchText.toLowerCase()));
  }

  confirm() {
    const filteredOnboardingData: TenantModel = {
      name: this.onboardingData.name,
      status: TenantStatusValues.ACTIVE,
      iocs: this.onboardingData.iocs.filter(ioc => ioc.values && ioc.values.length > 0)
    };
    this.categories = {};
    this.onboardingData.iocs.forEach(ioc => {
      this.categories[ioc.ioc_id] = ioc.values;
    });
    this.appService.set('entityfilterCategories', this.categories);
    this.apiService.post<any>('update/tenants', filteredOnboardingData).subscribe({
      next: (res) => {
        this.appService.userSessionData.update(state => {
          if (!state) {
            return state;
          }
          const updated = {
            ...state,
            tenant: res.tenant ?? state.tenant,
            alerts: res.alerts ?? state.alerts
          };
          this.appService.tenantData.set({
            name: (res.tenant?.name ?? this.appService.tenantData().name) || '',
            iocs: (res.tenant?.iocs ?? this.appService.tenantData().iocs) || []
          });
          this.appService.setOnboardingStatus(false);
          this.router.navigate(['/dashboard']).then();
          return updated;
        });
      },
    });
  }

  clearAllIocs(value: boolean): void {
    if (value) {
      if (this.onboardingData?.iocs) {
        this.onboardingData.iocs.forEach(ioc => {
          ioc.values = [];
        });
      }
      const filteredOnboardingData: TenantModel = {
        name: this.onboardingData?.name || '',
        iocs: []
      };
      this.appService.tenantData.set({ ...filteredOnboardingData });
      this.isConfirmationOpen = false;
    }
    else {
      this.isConfirmationOpen = false;
    }
  }

  openConfirmationPopup() {
    this.isConfirmationOpen = true;
  }
}
