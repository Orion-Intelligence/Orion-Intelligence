import {AfterViewInit, Component, Input} from '@angular/core';
import {NgForOf} from '@angular/common';
import {SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HelperService} from '../../../../services/helper.service';
import {GeneralResultItem} from '../../../../model/results/general/general.callback.model';
import {LeakResultItem} from '../../../../model/results/leak/leak.callback.model';

@Component({
  selector: 'app-dashboard-results-grid',
  templateUrl: './dashboard-results-grid.component.html',
  imports: [NgForOf, RouterLink],
  standalone: true
})
export class DashboardResultsGridComponent implements AfterViewInit {
  @Input() query!: string;
  @Input() searchResults: (GeneralResultItem | LeakResultItem)[] = [];
  currentUrl: string = '';
  queryParams: any = {};

  constructor(private helperService: HelperService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  ngAfterViewInit() {
    this.scrollToSavedPosition();
  }

  saveSession(itemId: string) {
    if (itemId) {
      sessionStorage.setItem('selectedItem', itemId);
      let scrollableContainer: HTMLElement | null = document.getElementById('item-' + itemId);
      while (scrollableContainer && !this.isScrollable(scrollableContainer)) {
        scrollableContainer = scrollableContainer.parentElement;
      }
      const scrollPosition = scrollableContainer ? scrollableContainer.scrollTop : window.scrollY;
      sessionStorage.setItem('scrollPosition', scrollPosition.toString());
    }
  }

  private isScrollable(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const overflowY = style.overflowY;
    return (overflowY === 'auto' || overflowY === 'scroll') && element.scrollHeight > element.clientHeight;
  }

  scrollToSavedPosition() { // Renamed from scrollToSavedItem
    const savedPosition = sessionStorage.getItem('scrollPosition');
    const savedItemId = sessionStorage.getItem('selectedItem');
    if (savedPosition !== null && savedItemId) {
      const position = parseInt(savedPosition, 10);
      let scrollableContainer: HTMLElement | null = document.getElementById('item-' + savedItemId);
      while (scrollableContainer && !this.isScrollable(scrollableContainer)) {
        scrollableContainer = scrollableContainer.parentElement;
      }
      if (scrollableContainer) {
        scrollableContainer.scrollTop = position;
      } else {
        window.scrollTo({top: position, behavior: 'auto'});
      }
    }
  }

  highlightWords(text: string, maxLength: number = 250): SafeHtml {
    return this.helperService.highlightWords(text, this.query, maxLength);
  }
}
