import {ChangeDetectorRef, Component, Input, OnChanges} from '@angular/core';
import {ResultSectionComponent} from './result-section/result-section.component';
import {ResultListComponent} from './result-list/result-list.component';
import {CommonModule} from '@angular/common';
import {ResultItemModel} from '../../../../../model/intel-results/result-item/result.item.model';
import {last} from 'rxjs';
import {fadeInDashboardItem} from '../../../../../animations/dashboard.item.animation';
import {ResultHelperService} from '../../../../../services/helper.service';

@Component({
  selector: 'app-result-panel',
  templateUrl: './dashboard-result.component.html',
  imports: [ResultListComponent, CommonModule, ResultSectionComponent],
  animations: [fadeInDashboardItem],
})
export class DashboardResultComponent implements OnChanges {

  constructor(
    private cdr: ChangeDetectorRef,
    private resultHelperService: ResultHelperService
  ) {
  }

  downloadCSV() {
    this.resultHelperService.downloadAsCSV(this.resultItem);
  }

  printPage() {
    this.resultHelperService.printPage();
  }

  shareResult() {
    this.resultHelperService.shareResult(this.resultItem?.m_url || '');
  }

  @Input() resultItem: ResultItemModel | null = null;

  arrayKeys: string[] = [];
  listItems = []
  activeTab: string = "";
  content = ""


  ngOnChanges(): void {
    if (this.resultItem) {
      this.content = this.resultItem.m_content;
      this.arrayKeys = [];
      if (this.resultItem.m_section && this.resultItem.m_section.length > 0) {
        this.arrayKeys.push("m_section");
      }
      if (this.resultItem.m_content && this.resultItem.m_content.trim() !== '') {
        this.arrayKeys.push("m_content");
      }
      Object.keys(this.resultItem).forEach(key => {
        const value = (this.resultItem as any)[key];
        if (Array.isArray(value) && value.length > 0 && key !== "m_section") {
          this.arrayKeys.push(key);
        }
      });
    }
  }

  setActiveTab(tab: string) {
    if (this.activeTab === tab) {
      this.activeTab = '';
      this.listItems = [];
      return;
    }
    this.activeTab = tab;
    if (this.resultItem && Array.isArray((this.resultItem as any)[tab])) {
      this.listItems = (this.resultItem as any)[tab];
    } else {
      this.listItems = [];
    }
    this.cdr.detectChanges();
  }

  getStatusText(dateString?: string): string {
    if (!dateString) return "Inactive";
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 5) {
      return "Active";
    } else if (diffInDays <= 10) {
      return "Idle";
    } else {
      return "Inactive";
    }
  }

  isWithinDays(dateString: string = '', days: number): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= days;
  }

  protected readonly last = last;
}
