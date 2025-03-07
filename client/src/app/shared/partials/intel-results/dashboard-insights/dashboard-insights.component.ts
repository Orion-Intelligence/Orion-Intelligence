import { Component, Input } from '@angular/core';
import { DashboardDataInsightComponent } from './dashboard-data-insight/dashboard-data-insight.component';
import { DashboardGeneralInsightsComponent } from './dashboard-general-insights/dashboard-general-insights.component';
import { Analytics } from './analytics.model';

@Component({
  selector: 'app-dashboard-insights',
  standalone: true,
  imports: [
    DashboardDataInsightComponent,
    DashboardGeneralInsightsComponent
  ],
  templateUrl: './dashboard-insights.component.html',
  styleUrl: './dashboard-insights.component.css'
})
export class DashboardInsightsComponent {

  @Input() analytics!: Analytics;
}
