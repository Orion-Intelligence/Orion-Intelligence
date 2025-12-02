import { Component, HostListener, OnInit, AfterViewInit, OnDestroy, signal, effect, } from '@angular/core';
import { AsyncPipe, NgIf, NgOptimizedImage, NgClass } from "@angular/common";
import { AuthService } from '../../../services/authetication/auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { AppService } from '../../../services/core/app/app.service';
import { ConfigSettings } from '../../model/app/config';
import { AppStorageService } from '../../../services/core/app/app-storage.service';
import { AlertNotificationComponent } from "../alert-notification/alert-notification.component";
import { LicenseService } from '../../../services/licenses/licenses.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    NgOptimizedImage,
    NgIf,
    TooltipDirective,
    NgClass,
    AlertNotificationComponent
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  username$: Observable<string | null>;
  role$: Observable<string | null>;
  isNotificationOpen$ = new BehaviorSubject<boolean>(false);

  currentImageUrl: any;
  licences: string = '';
  dropdownOpen = signal(false);
  isDarkTheme = true;

  private scrollContainer: HTMLElement | null = null;
  private scrollHandler = () => {
    this.dropdownOpen.set(false);
  };

  constructor(
    protected authService: AuthService,
    public router: Router,
    public dashboardService: DashboardService,
    public appService: AppService,
    private appStorage: AppStorageService,
    protected licenseService: LicenseService
  ) {
    this.username$ = this.authService.getUsername$();
    this.role$ = this.authService.getRole$();
    effect(() => {
      if (this.dropdownOpen()) {
        this.onDropdownOpen();
      }
    });
  }

  ngOnInit(): void {
    const storedTheme = this.appStorage.getTheme();
    if (storedTheme === 'dark-theme') {
      this.isDarkTheme = true;
    } else if (storedTheme === 'light-theme') {
      this.isDarkTheme = false;
    }
    this.applyTheme();
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
    this.currentImageUrl = this.appService.profileImageUrl();
    const rawLicenses = this.authService.getLicenses();
    this.licences = rawLicenses.map(l => this.getLicenseLabel(l)).join(', ');
  }
  getLicenseLabel(name: string): string {
    const labels: Record<string, string> = {
      free: 'Free',
      osint_basic: 'OSINT Basic',
      osint_advanced: 'OSINT Advanced',
      pentester: 'Pentester',
      maintainer: 'Maintainer',
      enterprise: 'Enterprise'
    };

    return labels[name] ?? name;
  }

  toggleThemeByClick() {
    this.isDarkTheme = !this.isDarkTheme;
    const theme = this.isDarkTheme ? 'dark-theme' : 'light-theme';
    this.appStorage.setTheme(theme);
    this.applyTheme();
  }

  applyTheme() {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(this.isDarkTheme ? 'dark-theme' : 'light-theme');
  }

  isAdmin(): boolean {
    const currentRole = this.authService.getRole();
    return currentRole === 'admin';
  }
  isDemo(): boolean {
    const currentRole = this.authService.getRole();
    return currentRole === 'demo';
  }
  isProfile(): boolean {
    const currentRole = this.authService.getRole();
    return currentRole === 'profile';
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.update(v => !v);
  }

  auditlog() {
    this.router.navigate(['/dashboard/profile/auditlog']);
  }
  manageIocs() {
    this.router.navigate(['/dashboard/profile/ioc']);
  }
  openAccountSettings() {
    this.router.navigate(['/dashboard/profile/account']);
  }
  changePassword() {
    this.logout();
    this.router.navigate(['/forgot']);
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
    const target = event.target as HTMLElement;
    if (!target.closest('.profile')) {
      this.dropdownOpen.set(false);
    }
  }

  openNotifications(): void {
    this.isNotificationOpen$.next(true);
  }
  closeNotifications(): void {
    this.isNotificationOpen$.next(false);
  }
  getUnseenAlertCount(): number {
    return this.appService.userProfile().alerts.filter(alert => !alert.report_seen).length;
  }

}
