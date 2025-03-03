import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {NgOptimizedImage, NgClass, NgForOf, NgIf, AsyncPipe} from '@angular/common';
import {ApiSubCategory, Category, GeneralSubCategory, LeakSubCategory} from '../../../../pages/dashboard/enums/pages';
import {AppService} from '../../../../services/core/app.service';
import {NavigationEnd, Router, RouterLink} from '@angular/router';
import {filter} from 'rxjs';
import {SelectionStoreService} from '../../../../services/dashboard/selection.service';

@Component({
  selector: 'app-dashboard-sidebar',
  standalone: true,
  imports: [NgOptimizedImage, NgClass, NgForOf, NgIf, RouterLink, AsyncPipe],
  templateUrl: './dashboard-sidebar.component.html',
})
export class DashboardSidebarComponent implements OnInit {
  @Output() menuToggle = new EventEmitter<void>();
  sidebar_default = true;
  apiAllowed: boolean = false;

  apiCategories = Object.values(ApiSubCategory);
  generalCategories = Object.values(GeneralSubCategory);
  leakCategories = Object.values(LeakSubCategory);
  category = Category;

  constructor(protected selectionStore: SelectionStoreService, private appService: AppService, private router: Router) {
    this.appService.configData$.subscribe(data => {
      this.apiAllowed = !!(data && data.settings['api_allowed'] === '1');
    });
  }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateSelectedSectionFromURL();
      });

    this.updateSelectedSectionFromURL();
  }

  updateSelectedSectionFromURL() {
    const currentURL = this.router.url;

    if (currentURL.includes('/dashboard/directory')) {
      this.selectionStore.setSelectedSection(Category.DIRECTORY);
    } else if (currentURL.includes('/dashboard/home')) {
      this.selectionStore.setSelectedSection(Category.HOMEPAGE);
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
        case Category.GENERAL_INTELLIGENCE:
          firstSubcategory = this.generalCategories[0];
          break;
        case Category.LEAKS:
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
  }

  onToggleSidebar(){
    this.menuToggle.emit()
    this.sidebar_default = !this.sidebar_default;
  }
}
