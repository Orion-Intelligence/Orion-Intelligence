import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { PublicUserActivityItem, PublicUserActivityResponse } from '../../../sections/report/social-interactions/models/public-user-data.model';

@Component({
  selector: 'app-user-profile-activity',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile-activity.component.html',
})
export class UserProfileActivityComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apiService = inject(ApiService);

  isLoading = true;
  errorMessage = '';
  response: PublicUserActivityResponse | null = null;

  get profileImageUrl(): string {
    const userId = this.route.snapshot.paramMap.get('user_id') || '';
    return userId ? `/api/s/static/user/${userId}` : '/api/s/static/user/default';
  }

  constructor() {
    this.route.paramMap.subscribe(params => {
      const userId = params.get('user_id') || '';
      if (!userId) {
        this.response = null;
        this.errorMessage = 'User not found.';
        this.isLoading = false;
        return;
      }
      this.loadActivity(userId);
    });
  }

  openThread(item: PublicUserActivityItem): void {
    if (!item.route_path) {
      return;
    }
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/', ...item.route_path.split('/').filter(Boolean)], { queryParams: item.route_query })
    );
    window.open(url, '_blank', 'noopener');
  }

  trackByDocId(_: number, item: PublicUserActivityItem): string {
    return item.doc_id;
  }

  private loadActivity(userId: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.response = null;
    this.apiService.get<PublicUserActivityResponse>(`user/${userId}/activity`).subscribe({
      next: (response) => {
        this.response = response;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Unable to load user activity.';
        this.isLoading = false;
      },
    });
  }
}
