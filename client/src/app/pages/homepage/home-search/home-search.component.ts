import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {DashboardService} from '../../../services/dashboard/dashboard.service';
import {ConsolidatedCallbackModel} from '../../../shared/model/results/consolidated/consolidated.callback.model';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent {
  searchQuery = '';

  constructor(public dashboardService: DashboardService, private route: ActivatedRoute, private router: Router) {
  }

  onSearchSubmit(): void {
    this.dashboardService.consolidatedCallbackModel = new ConsolidatedCallbackModel();
    const queryParams = {
      ...this.route.snapshot.queryParams,
      q: this.searchQuery || null
    };

    this.router.navigate(['/dashboard/consolidated/all'], {
      queryParams,
      queryParamsHandling: 'merge'
    }).then();
  }
}
