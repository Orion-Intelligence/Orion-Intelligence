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
import { TranslatePipe } from '../../pipes/translate.pipe';
import { LANGUAGE_OPTIONS, LanguageOption } from '../../constants/shared-enums';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    NgOptimizedImage,
    TooltipDirective,
    NgClass,
    AlertNotificationComponent, TranslatePipe],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements AfterViewInit, OnDestroy {
  private scrollContainer: HTMLElement | null = null;
  private scrollHandler = () => {
    this.dropdownOpen.set(false);
    this.languageDropdownOpen.set(false);
  };

  protected readonly Date = Date;

  username = signal<string>('');
  role = signal<string>('');
  isNotificationOpen = signal<boolean>(false);
  profile_image: string = "";
  licences: string = '';
  dropdownOpen = signal(false);
  languageDropdownOpen = signal(false);
  selectedLanguage = signal('');
  languageOptions: LanguageOption[] = LANGUAGE_OPTIONS;
  readonly openPopup = output<undefined>();

  constructor(protected authService: AuthService, public router: Router, public dashboardService: DashboardService, public appService: AppService, protected licenseService: LicenseService, private apiService: ApiService) {
    this.username.set(this.appService.userSessionData()?.user?.username);
    this.role.set(this.appService.userSessionData()?.user?.role);
    effect(() => {
      if (this.dropdownOpen()) {
        this.onDropdownOpen();
      }
      const data = this.appService.userSessionData();
      this.username.set(data?.user?.username ?? '');
      this.role.set(data?.user?.role ?? '');
      this.selectedLanguage.set(this.getCurrentLanguage(data?.user?.preferences?.['language']));
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
    this.languageDropdownOpen.set(false);
    this.dropdownOpen.update(v => !v);
  }

  toggleLanguageDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.set(false);
    this.languageDropdownOpen.update(v => !v);
  }

  selectLanguage(language: string, event: Event) {
    event.stopPropagation();
    const selectedLanguage = this.getSupportedLanguage(language);
    const currentSession = this.appService.userSessionData();
    const preferences = {
      ...(currentSession.user.preferences || {}),
      language: selectedLanguage
    };
    this.selectedLanguage.set(selectedLanguage);
    this.appService.userSessionData.update(state => {
      if (!state) {
        return state;
      }
      return {
        ...state,
        user: {
          ...state.user,
          preferences
        }
      };
    });
    this.apiService.post('update/current/user', {
      username: currentSession.user.username,
      preferences
    }).subscribe({
      next: () => void 0,
      error: () => void 0
    });
    this.languageDropdownOpen.set(false);
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
    this.languageDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    const eventTargetElement = event.target as HTMLElement;
    if (!eventTargetElement.closest('.profile')) {
      this.dropdownOpen.set(false);
      this.languageDropdownOpen.set(false);
    }
  }

  openNotifications(): void {
    this.dropdownOpen.set(false);
    this.languageDropdownOpen.set(false);
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

  private getCurrentLanguage(userLanguage?: unknown): string {
    return this.getSupportedLanguage(userLanguage, this.getSystemLanguage());
  }

  private getSupportedLanguage(language: unknown, fallbackLanguage = this.getSystemLanguage()): string {
    const code = this.normalizeLanguage(language);
    if (this.isSupportedLanguage(code)) {
      return code;
    }
    const fallback = this.normalizeLanguage(fallbackLanguage);
    return this.isSupportedLanguage(fallback) ? fallback : 'en';
  }

  private getSystemLanguage(): string {
    const code = this.normalizeLanguage(this.appService.getConfig()?.appSettings?.language_allowed);
    return this.isSupportedLanguage(code) ? code : 'en';
  }

  private isSupportedLanguage(language: unknown): boolean {
    const code = this.normalizeLanguage(language);
    return this.languageOptions.some(option => option.code === code);
  }

  private normalizeLanguage(language: unknown): string {
    return typeof language === 'string' ? language.trim().toLowerCase() : '';
  }
}
