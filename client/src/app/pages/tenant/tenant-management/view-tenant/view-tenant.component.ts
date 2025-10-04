
import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../shared/services/api.service';
import { HttpHeaders } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../shared/model/tenant/tenant.model';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-view-tenant',
  imports: [NgFor, FormsModule, CommonModule],
  animations: [fadeInDashboardItem],
  templateUrl: './view-tenant.component.html'
})
export class ViewTenantComponent implements OnInit {
  users: User[] = [];
  isLoading = true;
  selectedUserId: string | null = null;



  constructor(public apiService: ApiService,) {
  }

  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<User[]>('users', headers).subscribe({
      next: (data) => {
        this.users = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.isLoading = false;
      },
    });
  }
  toggleMenu(user: User) {
    this.selectedUserId = this.selectedUserId === user.username ? null : user.username;
  }

  getRoleLabel(role: User['role']): string {
    switch (role) {
      case 'admin': return 'Admin';
      case 'crawler': return 'Crawler';
      case 'demo': return 'Demo';
      case 'profile': return 'Profile';
      default: return '';
    }
  }
  updateUser(user: User) {
    this.isLoading = true;
    this.apiService.post('update/user', user).subscribe({
      next: () => {
        this.isLoading = false;
        console.log('User updated successfully');
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Failed to update user', err);
      },
    });
  }
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu')) {
      this.selectedUserId = null;
    }
  }
}
