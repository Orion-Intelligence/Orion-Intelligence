import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-dashboard-side-bar',
  templateUrl: './dashboard-side-bar.component.html',
  imports: [
    NgOptimizedImage
  ],
  styleUrls: ['./dashboard-side-bar.component.css']
})
export class DashboardSideBarComponent {
  activeDropdown: string = ''; // Track active dropdown

  toggleDropdown(menu: string) {
    this.activeDropdown = this.activeDropdown === menu ? '' : menu;
  }

  menuItems = [
    { name: 'Home', icon: 'search_side_nav_home_icon.svg', link: '#' },
    {
      name: 'General Intelligence',
      icon: 'search_side_general_intelligence_icon.svg',
      dropdown: true,
      subItems: [
        { name: 'Dashboard', link: '#' },
        { name: 'Add Client', link: '#' },
        { name: 'Update Client', link: '#' }
      ]
    },
    {
      name: 'Monitor',
      icon: 'search_side_monitor_icon.svg',
      dropdown: true,
      subItems: [
        { name: 'Dashboard', link: '#' },
        { name: 'Add Client', link: '#' },
        { name: 'Update Client', link: '#' }
      ]
    },
    { name: 'Live APIs', icon: 'search_side_live_api_icon.svg', link: '#' },
    { name: 'Email', icon: 'search_side_email_icon.svg', link: '#' }
  ];
}
