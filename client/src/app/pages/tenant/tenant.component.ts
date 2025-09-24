import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, CommonModule } from '@angular/common';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { TenantModel } from '../../shared/model/tenant/tenant.model';
import { search_filter_labels } from '../../shared/constants/shared-enums';
import { AuthService } from '../../services/authetication/auth.service';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../../services/core/app/app.service';

@Component({
  selector: 'app-tenant',
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, FormsModule, CommonModule, HeaderComponent],
  templateUrl: './tenant.component.html'
})
export class TenantComponent implements OnInit {
  onboardingData: TenantModel = {
    companyName: '',
    iocs: []
  };
  currentStep = 1;
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  iocSearchText: string = '';
  categories: Record<string, string[]> = {};

  constructor(private router: Router, public auth_service: AuthService, public apiService: ApiService, public appService: AppService) {
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
    if (!value.trim() || !this.selectedCategoryId) return;

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
    return this.onboardingData.iocs.filter(ioc =>
      ioc.name.toLowerCase().includes(this.iocSearchText.toLowerCase())
    );
  }
  confirm() {
    const filteredOnboardingData: TenantModel = {
      companyName: this.onboardingData.companyName,
      iocs: this.onboardingData.iocs.filter(ioc => ioc.values && ioc.values.length > 0)
    };
    this.categories = {};
    this.onboardingData.iocs.forEach(ioc => {
      this.categories[ioc.ioc_id] = ioc.values;
    });
    this.appService.set('entityfilterCategories', this.categories);

    this.apiService.post('createTenant', filteredOnboardingData).subscribe({
      next: () => {
        this.auth_service.setOnboarding(true);
        this.router.navigate(['/dashboard']).then();
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || 'Onboarding failed');
      },
    });
  }
}
