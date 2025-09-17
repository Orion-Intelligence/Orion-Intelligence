import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { AsyncPipe, NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import {
  ApiSubCategory,
  BreachSubCategory,
  Category,
  DefacementSubCategory, DumpSubCategory,
  ExploitSubCategory,
  GeneralSubCategory, FeedSubCategory,
  SocialSubCategory, StealerlogsSubCategory, ScannerSubCategory
} from '../../constants/pages';
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
import {ScrollService} from '../../services/scroll.service';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, NgIf, RouterLink, AsyncPipe, DashboardSidebarItemsComponent, SidebarSectionComponent, TooltipDirective],
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();

  sidebar_default = true;
  min_detected = false;
  mobile_menu_status = false

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
  category = Category;

  constructor(protected scrollService:ScrollService, protected dashboardService: DashboardService, protected selectionStore: SelectionStoreService, protected appService: AppService, private router: Router) {
  }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))


    window.addEventListener('resize', this.checkScreenWidth.bind(this));

    this.checkScreenWidth();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.checkScreenWidth.bind(this));
  }

  checkScreenWidth() {
    if (window.innerWidth < 600 && !this.min_detected && this.sidebar_default) {
      this.min_detected = true;
      this.onToggleSidebar();
    } else if (window.innerWidth > 600) {
      this.min_detected = false;
    }
  }

  onSectionSelected(section: Category) {
    if (this.selectionStore.getSelectedSection() === section) {
      this.selectionStore.setSelectedSection("");
      this.selectionStore.setSelectedOption("");
      this.router.navigateByUrl('/').then();
    } else {
      this.dashboardService.resetParams()
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
      }

      if (firstSubcategory) {
        this.selectionStore.setSelectedOption(firstSubcategory);
        if (this.min_detected && this.sidebar_default && !this.mobile_menu_status) {
          this.onToggleSidebar();
        }
      }
    }
    this.scrollService.resetOnReload()
  }

  onResetCallback() {
    this.dashboardService.generalCallbackModel = new GeneralCallbackModel()
    this.dashboardService.leakCallbackModel = new LeakCallbackModel()
  }

  onOptionSelected(option: string) {
    this.dashboardService.resetParams()
    this.onResetCallback()
    this.selectionStore.setSelectedOption(option);
    if (this.min_detected && this.sidebar_default) {
      this.onToggleSidebar();
    }
    this.scrollService.resetOnReload()
  }

  onToggleSidebar(mobile_menu_status: boolean = false) {
    this.menuToggle.emit();
    this.sidebar_default = !this.sidebar_default;
    this.mobile_menu_status = mobile_menu_status
  }
}
