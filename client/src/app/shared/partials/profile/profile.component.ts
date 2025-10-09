import { Component, HostListener, OnInit, AfterViewInit, OnDestroy, signal, effect, } from '@angular/core';
import { AsyncPipe, NgIf, NgOptimizedImage, NgClass } from "@angular/common";
import { AuthService } from '../../../services/authetication/auth.service';
import { Observable } from 'rxjs';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { Router } from '@angular/router';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { AppService } from '../../../services/core/app/app.service';
import { ConfigSettings } from '../../model/app/config';
import { AppStorageService } from '../../../services/core/app/app-storage.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    NgOptimizedImage,
    NgIf,
    TooltipDirective,
    NgClass
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit, AfterViewInit, OnDestroy {
  username$: Observable<string | null>;
  role$: Observable<string | null>;

  currentImageUrl: any;
  profileMail: string = '';
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
    private appStorage: AppStorageService
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
    this.profileMail = this.appService.userProfile().email;
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
    this.router.navigate(['/dashboard/profile/settings']);
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
}
