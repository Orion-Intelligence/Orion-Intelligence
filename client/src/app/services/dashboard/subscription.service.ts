import {Injectable} from '@angular/core';
import {AuthService} from '../authetication/auth.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  constructor(private authService: AuthService) {
  }

  public accountExpirable(): boolean {
    return this.authService.getRole()!="profile" || this.checkSubscription();
  }

  public checkSubscription(): boolean {
    return this.authService.getSubscriptionStatus();
  }

  public isDemo(): boolean {
    const role = this.authService.getRole();
    return role === 'demo';
  }

  public checkAdmin(): boolean {
    const role = this.authService.getRole();
    return role === 'admin';
  }

  public getTrialDaysLeft(): number {
    const verifyDate = this.authService.getVerificationDate();
    if (!verifyDate) return 0;

    const expiry = new Date(verifyDate);
    expiry.setMonth(expiry.getMonth() + 1); // 1-month trial
    const now = new Date();

    const diffMs = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }
}
