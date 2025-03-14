import {Component, Input, AfterViewInit} from '@angular/core';
import {NgForOf} from '@angular/common';
import {SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HelperService} from '../../../../services/helper.service';
import {GeneralResultItem} from '../../../../model/results/general/general.callback.model';
import {LeakResultItem} from '../../../../model/results/leak/leak.callback.model';

@Component({
  selector: 'app-dashboard-results-grid',
  templateUrl: './dashboard-results-grid.component.html',
  imports: [NgForOf, RouterLink]
})
export class DashboardResultsGridComponent implements AfterViewInit {
  @Input() query!: string;
  @Input() searchResults: (GeneralResultItem | LeakResultItem)[] = [];
  currentUrl: string = '';
  queryParams: any = {};

  constructor(private helperService:HelperService, private router: Router, private route: ActivatedRoute) {
  }


  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  ngAfterViewInit() {
    this.scrollToSavedItem();
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

  highlightWords(text: string, maxLength: number = 250): SafeHtml {
    return this.helperService.highlightWords(text, this.query, maxLength);
  }
}
