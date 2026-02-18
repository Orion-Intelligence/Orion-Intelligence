import { Component, HostListener, OnInit, AfterViewInit, OnDestroy, signal, effect, Output, EventEmitter } from '@angular/core';
import { NgIf, NgOptimizedImage, NgClass } from "@angular/common";
import { AuthService } from '../../../services/authetication/auth.service';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { AppService } from '../../../services/core/app/app.service';
import { ConfigSettings } from '../../model/app/config';
import { AppStorageService } from '../../../services/core/app/app-storage.service';
import { AlertNotificationComponent } from "../alert-notification/alert-notification.component";
import { LicenseService } from '../../../services/licenses/licenses.service';
import { NgbCarouselModule } from "@ng-bootstrap/ng-bootstrap";


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgOptimizedImage,
    NgIf,
    TooltipDirective,
    NgClass,
    AlertNotificationComponent,
    NgbCarouselModule
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  username = signal<string>('');
  role = signal<string>('');
  isNotificationOpen = signal<boolean>(false);

  profile_image: string = "";
  licences: string = '';
  dropdownOpen = signal(false);
  isDarkTheme = true;
  @Output() openPopup = new EventEmitter<void>();


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
    const rawLicenses = this.appService.userSessionData().user.license;
    this.licences = rawLicenses.map(l => this.licenseService.getLicenseLabel(l)).join(', ');
    this.profile_image = this.appService.userSessionData().user.image || ""
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
    const currentRole = this.appService.userSessionData().user.role;
    return currentRole === 'admin';
  }
  isDemo(): boolean {
    const currentRole = this.appService.userSessionData().user.role;
    return currentRole === 'demo';
  }
  isMember(): boolean {
    const currentRole = this.appService.userSessionData().user.role;
    return currentRole === 'member';
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
    this.router.navigate(['/dashboard/profile/account']).then();
  }
  changePassword() {
    this.logout();
    this.router.navigate(['/reset']).then();
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
    this.isNotificationOpen.set(true);
  }
  closeNotifications(): void {
    this.isNotificationOpen.set(false);
  }
  getUnseenAlertCount(): number {
    return this.appService.userSessionData().alerts.filter(alert => !alert.report_seen).length;
  }
  openSupportPopup() {
    this.openPopup.emit();
  }

  protected readonly Date = Date;
}
