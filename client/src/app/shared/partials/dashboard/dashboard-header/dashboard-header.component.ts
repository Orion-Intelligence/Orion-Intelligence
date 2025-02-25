import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';
import {HeaderAdminDropdownComponent} from '../../header-admin-dropdown/header-admin-dropdown.component';
import { EventEmitter, Output } from '@angular/core';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, HeaderAdminDropdownComponent],
  templateUrl: './dashboard-header.component.html',
  styleUrl: './dashboard-header.component.css'
})
export class DashboardHeaderComponent {
  searchQuery: string = '';
  mSearchCallbackSaveSearch: string = 'safe';
  activeTab: string = 'results';  // Default active tab

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  @Output() menuClicked = new EventEmitter<void>();

  toggleMenu() {
    this.menuClicked.emit();
  }
}
