import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, CommonModule } from '@angular/common';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { OnboardingModel } from '../../shared/model/onboarding/onbording.model';
import { search_filter_keys, search_filter_labels } from '../../shared/constants/shared-enums';
import { AuthService } from '../../services/authetication/auth.service';
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';
import { ApiService } from '../../shared/services/api.service';
import { AppService } from '../../services/core/app/app.service';

@Component({
  selector: 'app-onboarding',
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, FormsModule, CommonModule, HeaderComponent],
  templateUrl: './onboarding.component.html'
})
export class OnboardingComponent implements OnInit {
  onboardingData: OnboardingModel = {
    companyName: '',
    iocs: []
  };
  currentStep = 1;
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  addedIocs: { [key: string]: string[] } = {};
  iocSearchText: string = '';

  constructor(private router: Router, public auth_service: AuthService, public apiService: ApiService, public appService: AppService) {
  }
  ngOnInit(): void {
    this.initializeIOCs();
  }
  private initializeIOCs(): void {
    this.onboardingData.iocs = Array.from(search_filter_keys).map(key => ({
      ioc_id: key,
      name: search_filter_labels[key] || key,
      values: []
    }));
    this.selectedCategoryId = this.onboardingData.iocs[0].ioc_id;
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
    const filteredOnboardingData: OnboardingModel = {
      companyName: this.onboardingData.companyName,
      iocs: this.onboardingData.iocs.filter(ioc => ioc.values && ioc.values.length > 0)
    };
    const token = this.auth_service.getToken()
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.apiService.post('createOnboarding', filteredOnboardingData, { headers }).subscribe({
      next: () => {
        this.auth_service.setOnboarding(true);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || 'Onboarding failed');
      },
    });
  }
}
