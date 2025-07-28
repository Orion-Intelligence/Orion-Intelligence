import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {CommonModule, DatePipe, NgForOf, NgIf} from '@angular/common';
import {SafeHtml} from '@angular/platform-browser';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HelperService} from '../../../../services/helper.service';
import {GeneralResultItem} from '../../../../model/results/general/general.callback.model';
import {LeakResultItem} from '../../../../model/results/leak/leak.callback.model';
import {ScrollService} from '../../../../services/scroll.service';
import {TooltipDirective} from '../../../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-dashboard-results-general-grid',
  templateUrl: './dashboard-results-general-grid.component.html',
  imports: [NgForOf, RouterLink, DatePipe, NgIf, TooltipDirective, CommonModule],
  standalone: true
})
export class DashboardResultsGeneralGridComponent implements AfterViewInit, OnInit {
  @Input() query!: string;
  @Input() type!: string;
  @Input() searchResults: (GeneralResultItem | LeakResultItem)[] = [];
  @Input() isExpandAble: boolean = false;

  currentUrl = '';
  queryParams: any = {};
  isCollapsed = true;

  constructor(private helperService: HelperService, private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  highlightWords(text: string): SafeHtml {
    return this.helperService.highlightWords(text);
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];

    const ci = this.type === 'leak' ? 'leak' : 'general';

    if (this.currentUrl.includes('/consolidated/all')) {
      this.currentUrl = this.currentUrl.replace('/all', `/${ci}`);
    }

    this.route.queryParams.subscribe(params => {
      this.queryParams = {
        ...params,
        ci
      };
    });
  }
}
