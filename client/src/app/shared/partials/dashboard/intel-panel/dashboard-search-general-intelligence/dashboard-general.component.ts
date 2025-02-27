import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {DashboardService} from '../../../../../services/dashboard/dashboard.service';
import {FormsModule} from '@angular/forms';
import {HeaderProfileDropdownComponent} from '../../../header-profile-dropdown/header-profile-dropdown.component';
import {take} from 'rxjs';

@Component({
  selector: 'app-dashboard-general',
  standalone: true,
  imports: [CommonModule, FormsModule, NgOptimizedImage],
  templateUrl: './dashboard-general.component.html',
  styleUrls: ['./dashboard-general.component.css']
})
export class DashboardGeneral {

  searchQuery: string = '';

  constructor(public dashboardService: DashboardService) {
    if (this.dashboardService.searchGeneralCallbackModel?.Result?.length > 0) {
      console.log(this.dashboardService.searchGeneralCallbackModel.Result[0].m_content);
    } else {
      console.log('searchGeneralCallbackModel is undefined or Result array is empty');
    }
    this.dashboardService.searchQuery$.pipe(take(1)).subscribe(query => {
      this.searchQuery = query;
    });
  }

  items = Array.from({length: 10}).map((_, i) => ({
    header: `Header ${i + 1}`,
    description: `Description ${i + 1}`,
    url: `https://example.com/page${i + 1}`,
    publishedOn: `2025-02-${10 + i}`,
    network: `Network ${i + 1}`,
    updatedOn: `2025-02-${15 + i}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
  }));

  onSearchSubmit(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.dashboardService.searchGeneralParamModel.q = this.searchQuery.trim()
      this.dashboardService.fetchGeneralResults().subscribe();
    }
  }

}
