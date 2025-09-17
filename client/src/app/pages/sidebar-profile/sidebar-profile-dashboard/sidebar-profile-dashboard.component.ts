import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-sidebar-profile-dashboard',
  imports: [FormsModule, CommonModule, RouterOutlet],
  templateUrl: './sidebar-profile-dashboard.component.html'
})
export class SidebarProfileDashboardComponent implements OnInit {
  searchQuery = '';
  constructor(private router: Router, private route: ActivatedRoute,) {
  }
  ngOnInit(): void {
  }
}
