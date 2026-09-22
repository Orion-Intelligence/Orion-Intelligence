import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HomeInsightComponent } from "../../homepage/home-insight/home-insight.component";
@Component({
  selector: 'app-sidebar-user-statistics',
  imports: [HomeInsightComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sidebar-user-statistics.component.html',
})
export class SidebarUserStatisticsComponent {
  readonly templateOnly = true;
}
