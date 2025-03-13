import { Component, Input } from '@angular/core';
import { DataInsightComponent } from './data-insight/data-insight.component';
import { GeneralInsightsComponent } from './general-insights/general-insights.component';
import { Analytics } from '../../model/analytics/analytics.model';

@Component({
  selector: 'app-insights',
  standalone: true,
  imports: [
    DataInsightComponent,
    GeneralInsightsComponent
  ],
  templateUrl: './insights.component.html'
})
export class InsightsComponent {

  @Input() analytics!: Analytics;
}
