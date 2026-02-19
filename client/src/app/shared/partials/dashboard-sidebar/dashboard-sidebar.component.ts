import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AsyncPipe, NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { ApiSubCategory, BreachSubCategory, Category, DefacementSubCategory, DumpSubCategory, ExploitSubCategory, GeneralSubCategory, FeedSubCategory, SocialSubCategory, StealerlogsSubCategory, ScannerSubCategory, TenantSubCategory, ProfileSubCategory, DiscussionSubCategory } from '../../constants/pages';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { DashboardSidebarItemsComponent } from './dashboard-sidebar-items/dashboard-sidebar-items.component';
import { SidebarSectionComponent } from './dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component';
import { GeneralCallbackModel } from '../../model/results/general/general.callback.model';
import { LeakCallbackModel } from '../../model/results/leak/leak.callback.model';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { SelectionStoreService } from '../../../services/dashboard/selection.service';
import { AppService } from '../../../services/core/app/app.service';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';
import { ScrollService } from '../../services/scroll.service';
import { AuthService } from '../../../services/authetication/auth.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
@Component({
    selector: 'app-dashboard-sidebar',
    standalone: true,
    imports: [NgOptimizedImage, NgClass, NgIf, RouterLink, AsyncPipe, DashboardSidebarItemsComponent, SidebarSectionComponent, TooltipDirective],
    templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
    @Output()
    menuToggle = new EventEmitter<void>();
    sidebar_default = true;
    min_detected = false;
    mobile_menu_status = false;
    apiCategories = Object.values(ApiSubCategory);
    exploitCategories = Object.values(ExploitSubCategory);
    dumpCategories = Object.values(DumpSubCategory);
    newsCategories = Object.values(FeedSubCategory);
    generalCategories = Object.values(GeneralSubCategory);
    leakCategories = Object.values(BreachSubCategory);
    discussionCategories = Object.values(DiscussionSubCategory);
    defacementCategories = Object.values(DefacementSubCategory);
    socialCategories = Object.values(SocialSubCategory);
    stealerlogsCategories = Object.values(StealerlogsSubCategory);
    scannerCategories = Object.values(ScannerSubCategory);
    tenantCategories = Object.values(TenantSubCategory);
    profileCategories = Object.values(ProfileSubCategory);
    category = Category;
    constructor(protected scrollService: ScrollService, protected dashboardService: DashboardService, protected selectionStore: SelectionStoreService, protected appService: AppService, private router: Router, protected authService: AuthService, protected licenseService: LicenseService) {
    }
    ngOnInit() {
        this.handleProfileRoute(this.router.url);
        this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
            .subscribe((e: NavigationEnd) => {
            this.handleProfileRoute(e.urlAfterRedirects);
        });
        window.addEventListener('resize', this.checkScreenWidth.bind(this));
        this.checkScreenWidth();
    }
    private handleProfileRoute(url: string) {
        if (this.appService.userSessionData().user.role == "demo") {
            this.selectionStore.setSelectedSection('Strategic');
            this.selectionStore.setSelectedOption('All');
        }
        else if (url.startsWith('/dashboard/profile/consolidated/') ||
            url.startsWith('/dashboard/profile/homepage') ||
            url.startsWith('/dashboard/profile/alerts/general') ||
            url.startsWith('/dashboard/profile/alerts')) {
            this.selectionStore.setSelectedSection('Profile');
            this.selectionStore.setSelectedOption('Homepage');
        }
    }
    ngOnDestroy() {
        window.removeEventListener('resize', this.checkScreenWidth.bind(this));
    }
    checkScreenWidth() {
        if (window.innerWidth < 600 && !this.min_detected && this.sidebar_default) {
            this.min_detected = true;
            this.onToggleSidebar();
        }
        else if (window.innerWidth > 600) {
            this.min_detected = false;
        }
    }
    onSectionSelected(section: Category) {
        if (this.selectionStore.getSelectedSection() === section) {
            // this.authService.getRole$().pipe(take(1)).subscribe((role) => {
            //   if (role === 'profile') {
            this.selectionStore.setSelectedSection('Profile');
            this.selectionStore.setSelectedOption('Dashboard');
            // } else {
            //   this.selectionStore.setSelectedSection('');
            //   this.selectionStore.setSelectedOption('');
            // }
            this.router.navigateByUrl('/').then();
            // });
        }
        else {
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
                case Category.DISCUSSION:
                    firstSubcategory = this.scannerCategories[0];
                    break;
                case Category.PROFILE:
                    firstSubcategory = this.profileCategories[0];
                    break;
            }
            if (firstSubcategory) {
                this.selectionStore.setSelectedOption(firstSubcategory);
                if (this.min_detected && this.sidebar_default && !this.mobile_menu_status) {
                    this.onToggleSidebar();
                }
            }
        }
        this.scrollService.resetOnReload();
    }
    onResetCallback() {
        this.dashboardService.generalCallbackModel = new GeneralCallbackModel();
        this.dashboardService.leakCallbackModel = new LeakCallbackModel();
    }
    onOptionSelected(option: string) {
        this.dashboardService.resetParams();
        this.onResetCallback();
        this.selectionStore.setSelectedOption(option);
        if (this.min_detected && this.sidebar_default) {
            this.onToggleSidebar();
        }
        this.scrollService.resetOnReload();
    }
    onToggleSidebar(mobile_menu_status: boolean = false) {
        this.menuToggle.emit();
        this.sidebar_default = !this.sidebar_default;
        this.mobile_menu_status = mobile_menu_status;
    }
    getProfileCategories(): string[] {
        const categories = Object.values(ProfileSubCategory);
        if (this.isAdmin()) {
            return categories.filter(c => c !== ProfileSubCategory.IOC &&
                c !== ProfileSubCategory.STATISTICS &&
                c !== ProfileSubCategory.TENANT_SETTINGS);
        }
        if (this.isMember() && this.licenseService.getLicenses().includes('maintainer')) {
            return categories.filter(c => c !== ProfileSubCategory.TENANT &&
                c !== ProfileSubCategory.SYSTEM_SETTINGS);
        }
        return categories.filter(c => c !== ProfileSubCategory.TENANT &&
            c !== ProfileSubCategory.SYSTEM_SETTINGS &&
            c !== ProfileSubCategory.USERS &&
            c !== ProfileSubCategory.AUDITLOG &&
            c !== ProfileSubCategory.IOC &&
            c !== ProfileSubCategory.STATISTICS &&
            c !== ProfileSubCategory.TENANT_SETTINGS);
    }
    isAdmin(): boolean {
        return this.appService.userSessionData().user.role === 'admin';
    }
    isDemo(): boolean {
        return this.appService.userSessionData().user.role === 'demo';
    }
    isMember(): boolean {
        return this.appService.userSessionData().user.role === 'member';
    }
}
