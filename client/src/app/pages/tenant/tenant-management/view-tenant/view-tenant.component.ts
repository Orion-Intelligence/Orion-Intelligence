
import {Component, OnInit} from '@angular/core';
import {ApiService} from '../../../../shared/services/api.service';
import {HttpHeaders} from '@angular/common/http';
import {NgFor, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {User} from '../../../../shared/model/tenant/tenant.model';
import {fadeInDashboardItem} from '../../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-view-tenant',
  imports: [NgFor, NgIf, FormsModule],
  animations: [fadeInDashboardItem],
  templateUrl: './view-tenant.component.html'
})
export class ViewTenantComponent implements OnInit {
  users: User[] = [];
  isLoading = true;

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
}
