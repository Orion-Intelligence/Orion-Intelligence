import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {DatePipe, NgForOf} from '@angular/common';
import {SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HelperService} from '../../../../services/helper.service';
import {GeneralResultItem} from '../../../../model/results/general/general.callback.model';
import {LeakResultItem} from '../../../../model/results/leak/leak.callback.model';
import {ScrollService} from '../../../../services/scroll.service';

@Component({
  selector: 'app-dashboard-results-grid',
  templateUrl: './dashboard-results-grid.component.html', imports: [NgForOf, RouterLink, DatePipe],
  standalone: true
})
export class DashboardResultsGridComponent implements AfterViewInit, OnInit {
  @Input() query!: string;
  @Input() type!: string;
  @Input() searchResults: (GeneralResultItem | LeakResultItem)[] = [];
  currentUrl: string = '';
  queryParams: any = {};

  constructor(private helperService: HelperService, private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  highlightWords(text: string, maxLength: number = 250): SafeHtml {
    return this.helperService.highlightWords(text);
  }
}
