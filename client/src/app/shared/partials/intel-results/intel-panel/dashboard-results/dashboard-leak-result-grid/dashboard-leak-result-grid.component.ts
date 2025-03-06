import {Component, Input} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';
import {Suggestion} from '../../../../../model/intel-results/general/search_general_callback_model';

@Component({
  selector: 'app-dashboard-leak-result-grid', imports: [NgForOf],
  templateUrl: './dashboard-leak-result-grid.component.html',
})
export class DashboardLeakResultGridComponent {
  @Input() suggestion!: Suggestion | undefined;

  constructor(public dashboardService:DashboardService) {
  }
}
