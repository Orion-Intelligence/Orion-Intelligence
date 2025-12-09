import { Component, } from '@angular/core';
import { HomeInsightComponent } from "../../../../pages/homepage/home-insight/home-insight.component";
import { HomepageComponent } from "../../../../pages/homepage/homepage.component";
import { AuthService } from '../../../../services/authetication/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sidebar-profile-homepage',
  imports: [HomeInsightComponent, HomepageComponent, NgIf],
  templateUrl: './sidebar-profile-homepage.component.html',
})
export class SidebarProfileHomepageComponent {
  constructor(protected authService: AuthService) {
  }
  isAdmin(): boolean {
    return this.authService.getRole() === 'admin';
  }
}
