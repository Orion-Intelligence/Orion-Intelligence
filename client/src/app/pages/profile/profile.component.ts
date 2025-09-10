import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { OnboardingModel } from '../../shared/model/onboarding/onbording.model';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../services/authetication/auth.service';
import { HttpHeaders } from '@angular/common/http';
import { NgIf, NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { search_filter_keys, search_filter_labels } from '../../shared/constants/shared-enums';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [NgIf, NgFor, CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  onboardingData?: OnboardingModel;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  addedIocs: { [key: string]: string[] } = {};
  iocSearchText: string = '';
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;
  constructor(private router: Router, protected apiService: ApiService, public authService: AuthService) { }
  ngOnInit(): void {
    const token = this.authService.getToken()
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    this.apiService.post<OnboardingModel>('getOnboarding', { headers })
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
          this.selectedCategoryId = this.onboardingData?.iocs[0].ioc_id;
          console.log('Onboarding data received:', backendData);
        },
        error: (err) => {
          console.error('Error fetching onboarding:', err);
        }
      });
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
    const filteredOnboardingData: OnboardingModel = {
      companyName: this.onboardingData?.companyName || '',
      iocs: this.onboardingData?.iocs.filter(ioc => ioc.values && ioc.values.length > 0) || []
    };
    const token = this.authService.getToken()
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.apiService.post('updateOnboarding', filteredOnboardingData, { headers }).subscribe({
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
}
