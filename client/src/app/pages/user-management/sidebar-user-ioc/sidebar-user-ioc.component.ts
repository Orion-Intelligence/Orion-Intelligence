import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { TenantModel } from '../../../shared/model/tenant/tenant.model';
import { ApiService } from '../../../shared/services/api.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { CommonModule, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { search_filter_labels } from '../../../shared/constants/shared-enums';
import { AppService } from '../../../services/core/app/app.service';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ConfirmationPopupComponent } from "../../../shared/partials/confirmation-popup/confirmation-popup.component";
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { getFirstFileFromInputEvent, readFileAsText } from '../../../shared/utils/file-input.util';
import { downloadIocCsvTemplate, IOC_CSV_MAX_FILE_SIZE_BYTES, isCsvFile, mergeIocCsvValues, parseIocCsv } from '../../../shared/utils/ioc-csv.util';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';

@Component({
  selector: 'app-sidebar-user-ioc',
  imports: [NgClass, CommonModule, FormsModule, TooltipDirective, ConfirmationPopupComponent, TranslatePipe],
  templateUrl: './sidebar-user-ioc.component.html',
})
export class SidebarUserIocComponent implements OnInit {
  onboardingData!: TenantModel;
  showLeftFade = false;
  showRightFade = false;
  selectedCategoryId = '';
  iocSearchText: string = '';
  categories: Record<string, string[]> = {};
  isConfirmationOpen: boolean = false;
  isIocCsvUploading = false;
  @ViewChild('categoryScroll', { static: false }) categoryScroll!: ElementRef;

  constructor(protected apiService: ApiService, public authService: AuthService, public appService: AppService, private messageNotificationService: MessageNotificationService) { }

  ngOnInit(): void {
    const search_filter_keys = Object.keys(search_filter_labels);
    const backendData = this.appService.tenantData();

    if (backendData?.iocs) {
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
      ioc.name.toLowerCase().includes(search))
  }

  onCategoryClick(categoryId: string): void {
    this.selectedCategoryId = categoryId;
  }

  addIoc(value: string): void {
    if (!value.trim() || !this.selectedCategoryId) {
      return;
    }

    const category = this.onboardingData?.iocs.find(c => c.ioc_id === this.selectedCategoryId);
    if (category && !category.values.includes(value.trim())) {
      category.values.push(value.trim());
    }
    this.update()
  }

  onIocCsvSelected(event: Event): void {
    const selectedFile = getFirstFileFromInputEvent(event);
    if (!selectedFile) {
      return;
    }

    selectedFile.input.value = '';

    if (!isCsvFile(selectedFile.file)) {
      this.messageNotificationService.show('Only CSV files are allowed.');
      return;
    }

    if (selectedFile.file.size > IOC_CSV_MAX_FILE_SIZE_BYTES) {
      this.messageNotificationService.show('IOC CSV file size must be 1 MB or less.');
      return;
    }

    this.isIocCsvUploading = true;
    void readFileAsText(selectedFile.file)
      .then((content) => {
        try {
          const parsedCsv = parseIocCsv(content);
      const addedCount = mergeIocCsvValues(this.onboardingData?.iocs ?? [], parsedCsv);

      if (addedCount === 0) {
        this.isIocCsvUploading = false;
        this.messageNotificationService.show('No new IOC values found in the uploaded file.');
        return;
      }

      if (!this.selectedCategoryId && this.onboardingData?.iocs?.length) {
        this.selectedCategoryId = this.onboardingData.iocs[0].ioc_id;
      }

      this.messageNotificationService.show(`${addedCount} IOC value${addedCount === 1 ? '' : 's'} imported.`, 'success');
      this.update();
        }
        catch(error) {
          this.isIocCsvUploading = false;
          this.messageNotificationService.show(error instanceof Error ? error.message : 'Failed to import IOC CSV file.');
        }
      })
      .finally(() => {
        this.isIocCsvUploading = false;
      });
  }

  downloadIocTemplate(): void {
    downloadIocCsvTemplate();
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
      next: () => void 0,
      error: (_err) => void 0,
    });
  }

  setIocLocal() {
    this.categories = {};
    this.onboardingData?.iocs.forEach(ioc => {
      this.categories[ioc.ioc_id] = ioc.values;
    });
    this.appService.set('entityfilterCategories', this.categories);
  }

  clearAllIocs(value: boolean): void {
    if (value) {
      if (this.onboardingData?.iocs) {
        this.onboardingData.iocs.forEach(ioc => {
          ioc.values = [];
        });
      }

      this.setIocLocal();

      const filteredOnboardingData: TenantModel = {
        name: this.onboardingData?.name || '',
        iocs: []
      };

      this.appService.tenantData.set({ ...filteredOnboardingData });
      this.apiService.post('update/tenants', filteredOnboardingData).subscribe({
        next: () => {
          // State is updated optimistically above.
        },
        error: (_err) => {
          // Ignore API errors and keep the local reset.
        },
      });
      this.isConfirmationOpen = false;
    }
    else {
      this.isConfirmationOpen = false;
    }
  }

  openConfirmationPopup() {
    this.isConfirmationOpen = true;
  }

  isLightTheme(): boolean {
    return document.body.classList.contains('light-theme');
  }
}
