import { Component } from '@angular/core';
import { NgOptimizedImage, NgClass } from '@angular/common';
import { EventEmitter, Output } from '@angular/core';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';
import {Pages} from '../../../../constants/pages';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgClass
  ],
  templateUrl: './dashboard-sidebar.component.html',
  styleUrls: ['./dashboard-sidebar.component.css']
})
export class DashboardSidebarComponent {
  activeDropdown: string = 'general_intelligence';
  selectedType: string = 'all';

  constructor(private dashboardService: DashboardService) {
  }

  toggleDropdown(item: string) {
    this.activeDropdown = this.activeDropdown === item ? '' : item;
  }

  @Output() menuClosed = new EventEmitter<void>();

  closeMenu() {
    this.menuClosed.emit();
  }

  selectSection(section: string) {
    if(section==this.Pages.GENERAL_INTELLIGENCE){
      this.selectedType = "all";
    }
    else if(section==this.Pages.API){
      this.selectedType = "email";
    }else {
      this.selectedType = "";
    }
    this.updateCurrentPage(section);
    this.onTypeSelected(this.selectedType)
  }

  updateCurrentPage(page: string) {
    this.dashboardService.updatePage(page);
  }

  onTypeSelected(type: string) {
    this.selectedType = type;
    this.dashboardService.searchGeneralParamModel.pSearchParamType = type;
    this.dashboardService.fetchGeneralResults().subscribe();
  }

  protected readonly Pages = Pages;

  onLeakSelected() {
    this.dashboardService.fetchLeakResults().subscribe();
  }
}
