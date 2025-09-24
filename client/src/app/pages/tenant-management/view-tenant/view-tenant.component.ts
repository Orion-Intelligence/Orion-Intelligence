import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../shared/services/api.service';
import { HttpHeaders } from '@angular/common/http';
import { NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../shared/model/tenant/tenant.model';

@Component({
  selector: 'app-view-tenant',
  imports: [NgFor, FormsModule],
  templateUrl: './view-tenant.component.html'
})
export class ViewTenantComponent implements OnInit {
  users: User[] = [];
  constructor(public apiService: ApiService,) {
  }
  ngOnInit(): void {
    const headers = new HttpHeaders({});
    this.apiService.post<User[]>('users', headers).subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (err) => {
        console.error('Failed to load users', err);
      },
    });
  }

  updateUser(user: User) {
    this.apiService.post('updateUser', user).subscribe({
      next: () => {
        console.log('User updated successfully');
      },
      error: (err) => {
        console.error('Failed to update user', err);
      },
    });
  }

}
