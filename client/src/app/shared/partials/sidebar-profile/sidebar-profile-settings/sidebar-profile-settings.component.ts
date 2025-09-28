import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TenantModel } from '../../../model/tenant/tenant.model';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { HttpHeaders } from '@angular/common/http';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { search_filter_labels } from '../../../constants/shared-enums';
import { AppService } from '../../../../services/core/app/app.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-sidebar-profile-settings',
  imports: [NgIf, NgFor, CommonModule, FormsModule],
  templateUrl: './sidebar-profile-settings.component.html',
})
export class SidebarProfileSettingsComponent implements OnInit {
  onboardingData?: TenantModel;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  addedIocs: { [key: string]: string[] } = {};
  iocSearchText: string = '';
  categories: Record<string, string[]> = {};
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;
  constructor(private router: Router, protected apiService: ApiService, public authService: AuthService, public appService: AppService) { }
  ngOnInit(): void {
    const search_filter_keys = Object.keys(search_filter_labels);
    const token = this.authService.getToken()
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.apiService.post<TenantModel>('get/tenant', {})
      .subscribe({
        next: (backendData) => {
          this.onboardingData = {
            companyName: backendData.companyName,
            iocs: Array.from(search_filter_keys).map(key => {
              const backendIoc = backendData.iocs.find(i => i.ioc_id === key);
              return {
                ioc_id: key,
                name: search_filter_labels[key] || key,
                values: backendIoc ? backendIoc.values : []
              };
            })
          };
          this.selectedCategoryId = this.onboardingData?.iocs[0]?.ioc_id;
          this.setIocLocal();
        },
        error: (err) => {
          console.error('Error fetching onboarding:', err);
        }
      });
  }
  get filteredIocs() {
    const search = this.iocSearchText?.toLowerCase() || '';
    const iocs = (this.onboardingData?.iocs || []).filter(ioc =>
      ioc.name.toLowerCase().includes(search)
    );
    return iocs
  }
  onCategoryClick(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  addIoc(value: string): void {
    if (!value.trim() || !this.selectedCategoryId) return;

    const category = this.onboardingData?.iocs.find(c => c.ioc_id === this.selectedCategoryId);
    if (category && !category.values.includes(value.trim())) {
      category.values.push(value.trim());
    }
  }
  removeIoc(iocId: string, value: string): void {
    const ioc = this.onboardingData?.iocs.find(i => i.ioc_id === iocId);
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
  hasIocsWithValues(): boolean {
    return this.onboardingData?.iocs?.some(ioc => ioc.values.length > 0) ?? false;
  }
  save_data() {
    const filteredOnboardingData: TenantModel = {
      companyName: this.onboardingData?.companyName || '',
      iocs: this.onboardingData?.iocs.filter(ioc => ioc.values && ioc.values.length > 0) || []
    };
    this.setIocLocal();
    const token = this.authService.getToken()
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.apiService.post('update/tenant', filteredOnboardingData).subscribe({
      next: () => {
        this.authService.setOnboarding(true);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || 'Onboarding failed');
      },
    });
  }
  setIocLocal() {
    this.categories = {};
    this.onboardingData?.iocs.forEach(ioc => {
      this.categories[ioc.ioc_id] = ioc.values;
    });
    this.appService.set('entityfilterCategories', this.categories);
  }
}
