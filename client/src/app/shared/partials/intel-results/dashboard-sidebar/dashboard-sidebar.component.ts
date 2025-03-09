import {Component, EventEmitter, OnInit, Output, OnDestroy} from '@angular/core';
import {NgOptimizedImage, NgClass, NgIf, AsyncPipe} from '@angular/common';
import {ApiSubCategory, Category, GeneralSubCategory, BreachSubCategory} from '../../../enums/pages';
import {AppService} from '../../../../services/core/app.service';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {filter} from 'rxjs';
import {SelectionStoreService} from '../../../../services/dashboard/selection.service';
import {DashboardSidebarItemsComponent} from './dashboard-sidebar-items/dashboard-sidebar-items.component';
import {SidebarSectionComponent} from './dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, NgIf, RouterLink, AsyncPipe, DashboardSidebarItemsComponent, SidebarSectionComponent],
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent implements OnInit, OnDestroy {
  @Output() menuToggle = new EventEmitter<void>();
  sidebar_default = true;
  apiAllowed: boolean = false;
  min_detected = false;

  apiCategories = Object.values(ApiSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(BreachSubCategory);
  category = Category;

  constructor(private dashboardService: DashboardService, protected selectionStore: SelectionStoreService, private appService: AppService, private router: Router) {
    this.appService.configData$.subscribe(data => {
      this.apiAllowed = !!(data && data.settings['api_allowed'] === '1');
    });
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
        case Category.STRATEGIC_INTELLIGENCE:
          firstSubcategory = this.generalCategories[0];
          break;
        case Category.BREACH:
          firstSubcategory = this.leakCategories[0];
          break;
        case Category.API:
          firstSubcategory = this.apiCategories[0];
          break;
      }

      if (firstSubcategory) {
        this.onOptionSelected(firstSubcategory);
      }
    }
  }

  onOptionSelected(option: string) {
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
