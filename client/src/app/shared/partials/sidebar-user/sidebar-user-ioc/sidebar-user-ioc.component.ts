import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TenantModel } from '../../../model/tenant/tenant.model';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { search_filter_labels } from '../../../constants/shared-enums';
import { AppService } from '../../../../services/core/app/app.service';
import { Router } from '@angular/router';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-sidebar-user-ioc',
  imports: [NgIf, NgFor, CommonModule, FormsModule, TooltipDirective],
  templateUrl: './sidebar-user-ioc.component.html',
})
export class SidebarUserIocComponent implements OnInit {
  onboardingData!: TenantModel;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  iocSearchText: string = '';
  categories: Record<string, string[]> = {};
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;
  constructor(private router: Router, protected apiService: ApiService, public authService: AuthService, public appService: AppService) { }
  ngOnInit(): void {
    const search_filter_keys = Object.keys(search_filter_labels);
    const backendData = this.appService.tenantData();

    if (backendData && backendData.iocs) {
      this.onboardingData = {
        name: backendData.name,
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
    }
  }
  get filteredIocs() {
    const search = this.iocSearchText?.toLowerCase() || '';
    return (this.onboardingData?.iocs || []).filter(ioc =>
      ioc.name.toLowerCase().includes(search)
    )
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
    this.update()
  }
  removeIoc(iocId: string, value: string): void {
    const ioc = this.onboardingData?.iocs.find(i => i.ioc_id === iocId);
    if (ioc) {
      ioc.values = ioc.values.filter(v => v !== value);
    }
    this.update()
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
  update() {
    const filteredOnboardingData: TenantModel = {
      name: this.onboardingData?.name || '',
      iocs: this.onboardingData?.iocs.filter(ioc => ioc.values && ioc.values.length > 0) || []
    };
    this.setIocLocal();
    this.appService.tenantData.set({ ...filteredOnboardingData });
    this.apiService.post('update/tenants', filteredOnboardingData).subscribe({
      next: () => {
        this.appService.setOnboardingStatus(true);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || 'Onboarding failed');
      },
    });
  }
  goBack() {
    this.router.navigate(['/dashboard']).then();
  }
  setIocLocal() {
    this.categories = {};
    this.onboardingData?.iocs.forEach(ioc => {
      this.categories[ioc.ioc_id] = ioc.values;
    });
    this.appService.set('entityfilterCategories', this.categories);
  }
}
