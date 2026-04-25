import { Component, OnDestroy, OnInit, output } from '@angular/core';
import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, ExploitSubCategory, GeneralSubCategory, FeedSubCategory, SocialSubCategory, StealerlogsSubCategory, ScannerSubCategory, TenantSubCategory, ProfileSubCategory } from '../../../shared/constants/pages';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { DashboardSidebarItemsComponent } from './dashboard-sidebar-items/dashboard-sidebar-items.component';
import { SidebarSectionComponent } from './dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component';
import { GeneralCallbackModel } from '../../../shared/model/results/general/general.callback.model';
import { LeakCallbackModel } from '../../../shared/model/results/leak/leak.callback.model';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { SelectionStoreService } from '../../../services/dashboard/selection.service';
import { AppService } from '../../../services/core/app/app.service';
import { ScrollService } from '../../../shared/services/scroll.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { sidebarModeAnimation } from '../../../shared/animations/sidebar.mode.animation';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, RouterLink, AsyncPipe, DashboardSidebarItemsComponent, SidebarSectionComponent, TooltipDirective],
  templateUrl: './dashboard-sidebar.component.html',
  animations: [sidebarModeAnimation],
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
  private readonly closeForSubscriptionHandler = () => {
    if (this.sidebar_default) {
      this.onToggleSidebar(this.mobile_menu_status);
    }
  };

  sidebar_default = true;
  min_detected = false;
  mobile_menu_status = false;
  animationsDisabled = false;
  apiCategories = Object.values(ApiSubCategory);
  exploitCategories = Object.values(ExploitSubCategory);
  dumpCategories = Object.values(DumpSubCategory);
  newsCategories = Object.values(FeedSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  defacementCategories = Object.values(DefacementSubCategory);
  socialCategories = Object.values(SocialSubCategory);
  stealerlogsCategories = Object.values(StealerlogsSubCategory);
  scannerCategories = Object.values(ScannerSubCategory);
  tenantCategories = Object.values(TenantSubCategory);
  profileCategories = Object.values(ProfileSubCategory);
  category = Category;
  readonly menuToggle = output<undefined>();

  constructor(protected scrollService: ScrollService, protected dashboardService: DashboardService, protected selectionStore: SelectionStoreService, protected appService: AppService, private router: Router, protected authService: AuthService, protected licenseService: LicenseService) {
  }

  ngOnInit() {
    const hasSavedSidebarPreference = typeof window !== 'undefined' && localStorage.getItem('isSidebarOpen') !== null;
    this.sidebar_default = hasSavedSidebarPreference
      ? this.appService.getConfig().localSettings.isSidebarOpen
      : !(typeof window !== 'undefined' && window.innerWidth <= 900);
    if (typeof window !== 'undefined' && window.innerWidth < 800) {
      this.min_detected = hasSavedSidebarPreference;
    }
    this.handleProfileRoute(this.router.url);
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: NavigationEnd) => {
        this.handleProfileRoute(e.urlAfterRedirects);
      });
    window.addEventListener('resize', this.checkScreenWidth.bind(this));
    window.addEventListener('close-dashboard-sidebar', this.closeForSubscriptionHandler);
    this.checkScreenWidth();
  }

  private handleProfileRoute(url: string) {
    if (url.startsWith('/dashboard/profile/consolidated/') ||
          url.startsWith('/dashboard/profile/homepage') ||
          url.startsWith('/dashboard/profile/alerts/general') ||
          url.startsWith('/dashboard/profile/alerts')) {
      this.selectionStore.setSelectedSection('Profile');
      this.selectionStore.setSelectedOption('Homepage');
    }
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenWidth.bind(this));
    window.removeEventListener('close-dashboard-sidebar', this.closeForSubscriptionHandler);
  }

  checkScreenWidth() {
    const shouldStartCollapsed = window.innerWidth < 800;
    const isMobile = window.innerWidth < 600;
    this.animationsDisabled = isMobile;
    if (shouldStartCollapsed && !this.min_detected && this.sidebar_default) {
      this.min_detected = true;
      this.onToggleSidebar();
    }
    else if (!shouldStartCollapsed) {
      this.min_detected = false;
    }
  }

  onSectionSelected(section: Category) {
    if (this.selectionStore.getSelectedSection() === section) {
      this.selectionStore.setSelectedSection('Profile');
      this.selectionStore.setSelectedOption('Dashboard');
      this.router.navigateByUrl('/').then();
    }
    else {
      if (section !== Category.PROFILE) {
        this.dashboardService.clearResultCaches();
      }
      this.dashboardService.resetParams();
      this.selectionStore.setSelectedSection(section);
      let firstSubcategory: string | undefined;
      switch (section) {
        case Category.STRATEGIC:
          firstSubcategory = this.generalCategories[0];
          break;
        case Category.BREACH:
          firstSubcategory = this.leakCategories[0];
          break;
        case Category.API:
          firstSubcategory = this.apiCategories[0];
          break;
        case Category.DEFACEMENT:
          firstSubcategory = this.defacementCategories[0];
          break;
        case Category.DUMP:
          firstSubcategory = this.dumpCategories[0];
          break;
        case Category.FEED:
          firstSubcategory = this.newsCategories[0];
          break;
        case Category.TENANT:
          firstSubcategory = this.tenantCategories[0];
          break;
        case Category.SCANNER:
          firstSubcategory = this.scannerCategories[0];
          break;
        case Category.STEALERLOGS:
          firstSubcategory = this.stealerlogsCategories[0];
          break;
        case Category.PROFILE:
          firstSubcategory = this.getProfileCategories()[0];
          break;
      }
      if (firstSubcategory) {
        this.selectionStore.setSelectedOption(firstSubcategory);
      }
      if (!firstSubcategory && window.innerWidth <= 900 && this.sidebar_default) {
        this.onToggleSidebar();
      }
    }
    this.scrollService.clearSavedPosition();
    this.scrollService.scrollReportToTop();
  }

  onResetCallback() {
    this.dashboardService.generalCallbackModel = new GeneralCallbackModel();
    this.dashboardService.leakCallbackModel = new LeakCallbackModel();
  }

  onOptionSelected(option: string) {
    if (this.selectionStore.getSelectedSection() !== Category.PROFILE) {
      this.dashboardService.clearResultCaches();
    }
    this.dashboardService.resetParams();
    this.onResetCallback();
    this.selectionStore.setSelectedOption(option);
    if (window.innerWidth <= 900 && this.sidebar_default) {
      this.onToggleSidebar();
    }
    this.scrollService.clearSavedPosition();
    this.scrollService.scrollReportToTop();
  }

  onToggleSidebar(mobile_menu_status: boolean = false) {
    // TODO: The 'emit' function requires a mandatory void argument
    this.menuToggle.emit(undefined);
    this.sidebar_default = !this.sidebar_default;
    this.mobile_menu_status = mobile_menu_status;
  }

  canAccessNetworkIntel(): boolean {
    return this.isAdmin() || this.licenseService.canUseModule('osint_advanced');
  }

  canAccessSocialIntel(): boolean {
    return this.isAdmin() || (!this.isDemo() && this.licenseService.canUseModule('social_mapper'));
  }

  canAccessStandaloneDataCollection(): boolean {
    return this.canAccessNetworkIntel() || this.licenseService.canUseCtiGraph() || this.canAccessSocialIntel() || this.shouldShowWhistleBlowing() || this.isDemo();
  }

  canAccessWhistleBlowing(): boolean {
    return this.isAdmin() || !this.authService.getIsMobileDemo();
  }

  shouldShowWhistleBlowing(): boolean {
    return !!this.appService.getConfig().appSettings.home_header_whistle_blowing_allowed;
  }

  requestStandaloneSubscription(event: Event, accessAllowed: boolean) {
    if (!accessAllowed) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (accessAllowed) {
      return;
    }
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      window.dispatchEvent(new CustomEvent('close-dashboard-sidebar'));
    }
    this.dashboardService.showSubscription.set(true);
    if (this.authService.getIsMobileDemo()) {
      this.router.navigate(['/dashboard/strategic/all'], { queryParams: { page: 1 } }).then();
      return;
    }
    this.router.navigate(['/']).then();
  }

  getProfileCategories(): string[] {
    const categories = Object.values(ProfileSubCategory);
    const eventManagementEnabled = this.appService.userSessionData().tenant.eventManagementEnabled === true;
    const canAccessFeeder = this.licenseService.canUseModule('feeder');

    if (this.isAdmin()) {
      return categories.filter(c => c !== ProfileSubCategory.IOC &&
              c !== ProfileSubCategory.STATISTICS &&
              c !== ProfileSubCategory.TENANT_SETTINGS &&
              (canAccessFeeder || c !== ProfileSubCategory.FEEDER) &&
              (eventManagementEnabled || c !== ProfileSubCategory.EVENT_MANAGEMENT));
    }
    if (this.isMember() && this.licenseService.getLicenses().includes('maintainer')) {
      return categories.filter(c => c !== ProfileSubCategory.TENANT &&
              c !== ProfileSubCategory.SYSTEM_SETTINGS &&
              (canAccessFeeder || c !== ProfileSubCategory.FEEDER) &&
              (eventManagementEnabled || c !== ProfileSubCategory.EVENT_MANAGEMENT));
    }
    return categories.filter(c => c !== ProfileSubCategory.TENANT &&
          c !== ProfileSubCategory.SYSTEM_SETTINGS &&
          c !== ProfileSubCategory.EVENT_MANAGEMENT &&
          (canAccessFeeder || c !== ProfileSubCategory.FEEDER) &&
          c !== ProfileSubCategory.USERS &&
          c !== ProfileSubCategory.AUDITLOG &&
          c !== ProfileSubCategory.IOC &&
          c !== ProfileSubCategory.STATISTICS &&
          c !== ProfileSubCategory.TENANT_SETTINGS);
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
}
