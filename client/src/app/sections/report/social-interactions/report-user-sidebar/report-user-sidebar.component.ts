import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
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

  isOpen = false;
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
    this.isOpen = true;
    this.loadUser();
  }

  closeSidebar(): void {
    this.isOpen = false;
    this.userId = '';
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = '/api/s/static/user/default';
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
