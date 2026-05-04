import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AiToolRoutingService {
  constructor(private router: Router) {}

  getType(route = this.router.url): string {
    if (route.includes('/dashboard/strategic')) {
      return '/api/search/strategic';
    }
    return 'default';
  }
}
