import {Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard-search-content-items',
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard-search-content-items.component.html',
  styleUrl: './dashboard-search-content-items.component.css'
})
export class DashboardSearchContentItemsComponent {
  @Input() selectedSection!: string;
}
