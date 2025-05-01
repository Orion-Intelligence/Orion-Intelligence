import {Component, EventEmitter, OnInit, Output, OnDestroy} from '@angular/core';
import {NgOptimizedImage, NgClass, NgIf, AsyncPipe} from '@angular/common';
import {ApiSubCategory, Category, GeneralSubCategory, DefacementSubCategory, BreachSubCategory, SocialSubCategory} from '../../enums/pages';
import {AppService} from '../../../services/core/app.service';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {filter} from 'rxjs';
import {SelectionStoreService} from '../../../services/dashboard/selection.service';
import {DashboardSidebarItemsComponent} from './dashboard-sidebar-items/dashboard-sidebar-items.component';
import {SidebarSectionComponent} from './dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component';
import {DashboardService} from '../../../services/dashboard/dashboard.service';
import {GeneralCallbackModel} from '../../model/results/general/general.callback.model';
import {LeakCallbackModel} from '../../model/results/leak/leak.callback.model';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, NgIf, RouterLink, AsyncPipe, DashboardSidebarItemsComponent, SidebarSectionComponent],
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();
  sidebar_default = true;
  min_detected = false;

  apiCategories = Object.values(ApiSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  defacementCategories = Object.values(DefacementSubCategory);
  socialCategories = Object.values(SocialSubCategory);
  category = Category;

  constructor(protected dashboardService:DashboardService, protected selectionStore: SelectionStoreService, protected appService: AppService, private router: Router) {
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
    if (window.innerWidth < 800 && !this.min_detected && this.sidebar_default) {
      this.min_detected = true;
      this.onToggleSidebar();
    } else if (window.innerWidth > 800) {
      this.min_detected = false;
    }
  }

  onSectionSelected(section: Category) {
    if (this.selectionStore.getSelectedSection() === section) {
      this.selectionStore.setSelectedSection("");
      this.selectionStore.setSelectedOption("");
     } else {
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
      }

      if (firstSubcategory) {
        this.selectionStore.setSelectedOption(firstSubcategory);
        if(this.min_detected && this.sidebar_default){
          this.onToggleSidebar();
        }
      }
    }
  }

  onResetCallback(){
    this.dashboardService.generalCallbackModel = new GeneralCallbackModel()
    this.dashboardService.leakCallbackModel = new LeakCallbackModel()
  }

  onOptionSelected(option: string) {
    this.onResetCallback()
    this.selectionStore.setSelectedOption(option);
    if(this.min_detected && this.sidebar_default){
      this.onToggleSidebar();
    }
  }

  onToggleSidebar() {
    this.menuToggle.emit();
    this.sidebar_default = !this.sidebar_default;
  }
}
