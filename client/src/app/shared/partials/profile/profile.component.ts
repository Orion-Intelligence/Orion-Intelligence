import { Component, HostListener, AfterViewInit, OnDestroy, signal, effect, output } from '@angular/core';
import { NgOptimizedImage, NgClass } from "@angular/common";
import { AuthService } from '../../../services/authetication/auth.service';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { AppService } from '../../../services/core/app/app.service';
import { ConfigSettings } from '../../model/app/config';
import { AlertNotificationComponent } from "../alert-notification/alert-notification.component";
import { LicenseService } from '../../../services/licenses/licenses.service';
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgOptimizedImage,
    TooltipDirective,
    NgClass,
    AlertNotificationComponent
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements AfterViewInit, OnDestroy {
  private scrollContainer: HTMLElement | null = null;
  private scrollHandler = () => {
    this.dropdownOpen.set(false);
  };

  protected readonly Date = Date;

  username = signal<string>('');
  role = signal<string>('');
  isNotificationOpen = signal<boolean>(false);
  profile_image: string = "";
  licences: string = '';
  dropdownOpen = signal(false);
  readonly openPopup = output<undefined>();

  constructor(protected authService: AuthService, public router: Router, public dashboardService: DashboardService, public appService: AppService, protected licenseService: LicenseService) {
    this.username.set(this.appService.userSessionData()?.user?.username);
    this.role.set(this.appService.userSessionData()?.user?.role);
    effect(() => {
      if (this.dropdownOpen()) {
        this.onDropdownOpen();
      }
      const data = this.appService.userSessionData();
      this.username.set(data?.user?.username ?? '');
      this.role.set(data?.user?.role ?? '');
    });
  }

  ngAfterViewInit(): void {
    this.scrollContainer = document.getElementById('dashboard-container');
    if (this.scrollContainer) {
      this.scrollContainer.addEventListener('scroll', this.scrollHandler, { passive: true });
    }
  }

  ngOnDestroy(): void {
    if (this.scrollContainer) {
      this.scrollContainer.removeEventListener('scroll', this.scrollHandler);
    }
  }

  onDropdownOpen() {
    const rawLicenses = this.appService.userSessionData().user.license;
    this.licences = rawLicenses.map(l => this.licenseService.getLicenseLabel(l)).join(', ');
    this.profile_image = this.appService.userSessionData().user.image || "";
  }

  isAdmin(): boolean {
    return this.licenseService.isAdmin();
  }

  isDemo(): boolean {
    return this.licenseService.isDemo();
  }

  isMember(): boolean {
    return this.licenseService.isMember();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  auditlog() {
    this.router.navigate(['/dashboard/profile/auditlog']).then();
  }

  manageIocs() {
    this.router.navigate(['/dashboard/profile/ioc']).then();
  }

  openAccountSettings() {
    this.router.navigate(['/dashboard/profile/system-settings']).then();
  }

  logout() {
    this.dashboardService.resetParams();
    this.dashboardService.clearCallback();
    this.appService.configData.set(new ConfigSettings({}, {}));
    this.authService.logout();
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    const eventTargetElement = event.target as HTMLElement;
    if (!eventTargetElement.closest('.profile')) {
      this.dropdownOpen.set(false);
    }
  }

  openNotifications(): void {
    this.isNotificationOpen.set(true);
  }

  closeNotifications(): void {
    this.isNotificationOpen.set(false);
  }

  getUnseenAlertCount(): number {
    const summary = this.appService.userSessionData().alert_summary;
    if (summary && typeof summary.unseen_total === 'number') {
      return summary.unseen_total;
    }
    const alerts = this.appService.userSessionData().alerts;
    return (Array.isArray(alerts) ? alerts : []).filter(alert => !alert.report_seen).length;
  }

  openSupportPopup() {
    // TODO: The 'emit' function requires a mandatory void argument
    this.openPopup.emit(undefined);
  }
}
