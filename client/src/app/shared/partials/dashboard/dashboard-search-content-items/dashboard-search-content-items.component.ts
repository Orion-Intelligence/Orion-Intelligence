import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DashboardApiComponent} from '../intel-panel/dashboard-api/dashboard-api.component';
import {DashboardGeneralComponent} from '../intel-panel/dashboard-general/dashboard-general.component';
import {DashboardLeakComponent} from '../intel-panel/dashboard-leak/dashboard-leak.component';
import {DashboardMonitorComponent} from '../intel-panel/dashboard-monitor/dashboard-monitor.component';

@Component({
  selector: 'app-dashboard-search-content-items',
  imports: [
    CommonModule,
    DashboardApiComponent,
    DashboardGeneralComponent,
    DashboardLeakComponent,
    DashboardMonitorComponent
  ],
  templateUrl: './dashboard-search-content-items.component.html',
  styleUrl: './dashboard-search-content-items.component.css'
})
export class DashboardSearchContentItemsComponent {
  @Input() selectedSection!: string;
}
