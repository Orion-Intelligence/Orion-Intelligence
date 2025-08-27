import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor, NgSwitch, NgSwitchCase, CommonModule } from '@angular/common';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { OnboardingModel } from '../../shared/model/onboarding/onbording.model';
import { search_filter_keys, search_filter_labels } from '../../shared/constants/shared-enums';

@Component({
  selector: 'app-onboarding',
  imports: [NgIf, NgFor, NgSwitch, NgSwitchCase, FormsModule, CommonModule, HeaderComponent],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
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


  addedIocs: { [key: string]: string[] } = {
  };
  ngOnInit(): void {
    this.initializeIOCs();
  }
  private initializeIOCs(): void {
    this.onboardingData.iocs = Array.from(search_filter_keys).map(key => ({
      id: key,
      name: search_filter_labels[key] || key,
      values: []
    }));
  }
  onCategoryClick(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  addIoc(value: string): void {
    if (!value.trim() || !this.selectedCategoryId) return;

    const category = this.onboardingData.iocs.find(c => c.id === this.selectedCategoryId);
    if (category && !category.values.includes(value.trim())) {
      category.values.push(value.trim());
    }
  }
  removeIoc(iocId: string, value: string): void {
    const ioc = this.onboardingData.iocs.find(i => i.id === iocId);
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
  confirm() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }
}
