import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SidebarUserFeederStatisticsComponent } from "../sidebar-user-feeder-statistics/sidebar-user-feeder-statistics.component";
@Component({
  selector: 'app-sidebar-user-statistics',
  imports: [SidebarUserFeederStatisticsComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sidebar-user-statistics.component.html',
})
export class SidebarUserStatisticsComponent {
  readonly templateOnly = true;
}
