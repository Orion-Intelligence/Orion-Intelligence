import {AfterViewInit, AfterViewChecked, Component, Input, OnInit} from '@angular/core';
import {NgForOf} from '@angular/common';
import {DashboardService} from '../../../../../../services/dashboard/dashboard.service';
import {Suggestion} from '../../../../../model/intel-results/general/search_general_callback_model';
import {Router, ActivatedRoute, RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-leak-result-grid',
  imports: [NgForOf, RouterLink],
  templateUrl: './dashboard-leak-result-grid.component.html',
})
export class DashboardLeakResultGridComponent implements OnInit, AfterViewInit, AfterViewChecked {
  @Input() suggestion!: Suggestion | undefined;
  currentUrl: string = '';
  queryParams: any = {};
  private hasScrolled = false; // To prevent multiple scrolls

  constructor(public dashboardService: DashboardService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  ngAfterViewInit() {
    this.scrollToSavedItem();
  }

  ngAfterViewChecked() {
    if (!this.hasScrolled) {
      this.scrollToSavedItem();
      this.hasScrolled = true;
    }
  }

  saveSession(itemId: string) {
    if (itemId) {
      sessionStorage.setItem('selectedItem', itemId);
    }
  }

  scrollToSavedItem() {
    const savedItemId = sessionStorage.getItem('selectedItem');
    if (savedItemId) {
      const element = document.getElementById('item-' + savedItemId);
      if (element) {
        element.scrollIntoView();
      }
    }
  }
}
