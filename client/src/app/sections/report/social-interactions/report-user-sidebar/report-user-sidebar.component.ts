import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../shared/services/api.service';
import { PublicUserData } from '../models/public-user-data.model';

@Component({
  selector: 'app-report-user-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-user-sidebar.component.html',
})
export class ReportUserSidebarComponent {
  private readonly apiService = inject(ApiService);
  private readonly router = inject(Router);

  isOpen = false;
  hasOpened = false;
  isLoading = false;
  errorMessage = '';
  userData: PublicUserData | null = null;

  @Input() userId = '';

  get profileImageUrl(): string {
    return this.userId ? `/api/s/static/user/${this.userId}` : '/api/s/static/user/default';
  }

  open(userId: string): void {
    if (!userId) {
      return;
    }
    this.userId = userId;
    this.hasOpened = true;
    this.isOpen = true;
    window.requestAnimationFrame(() => this.loadUser());
  }

  closeSidebar(): void {
    this.isOpen = false;
    this.userId = '';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/api/s/static/user/default';
  }

  openDetails(): void {
    if (!this.userId) {
      return;
    }
    const userId = this.userId;
    this.closeSidebar();
    this.router.navigate(['/dashboard/profile/user', userId]);
  }

  private loadUser(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.userData = null;
    this.apiService.get<PublicUserData>(`user/${this.userId}/get`).subscribe({
      next: (response) => {
        this.userData = response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load user details.';
        this.isLoading = false;
      },
    });
  }
}
