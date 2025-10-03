import { Injectable } from '@angular/core';
import {AuthService} from '../authetication/auth.service';
import {trialTime} from '../../shared/constants/shared-enums';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  constructor(private authService: AuthService) {}

  public isAdminOrSubscription(): boolean {
    return this.checkAdmin() || this.checkSubscription() || this.getTrialDaysLeft() > 0;
  }

  public checkSubscription(): boolean {
    return this.authService.getSubscriptionStatus();
  }

  public checkAdmin(): boolean {
    const role = this.authService.getRole();
    return role === 'admin';
  }

  public getTrialDaysLeft(): number {
    const verifyDate = this.authService.getVerificationDate();
    if (!verifyDate) return 0;

    const expiry = new Date(verifyDate);
    expiry.setDate(expiry.getDate() + trialTime);
    const now = new Date();

    if (expiry <= now) return 0;

    const diffMs = expiry.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }
}
