import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgForOf, NgIf } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HelperService } from '../../../../services/helper.service';
import { GeneralResultItem } from '../../../../model/results/general/general.callback.model';
import { LeakResultItem } from '../../../../model/results/leak/leak.callback.model';
import { ScrollService } from '../../../../services/scroll.service';
import { TooltipDirective } from '../../../../directive/tooltip-directive.directive';
import { AuthService } from '../../../../../services/authetication/auth.service';
import { LicenseService } from '../../../../../services/licenses/licenses.service';

@Component({
  selector: 'app-dashboard-results-general-grid',
  templateUrl: './dashboard-results-general-grid.component.html',
  imports: [NgForOf, RouterLink, DatePipe, NgIf, TooltipDirective, CommonModule],
  standalone: true
})
export class DashboardResultsGeneralGridComponent implements AfterViewInit, OnInit {
  private highlightCache = new Map<string, SafeHtml>();

  @Input() query!: string;
  @Input() type!: string;
  @Input() searchResults: (GeneralResultItem | LeakResultItem)[] = [];
  @Input() isExpandAble: boolean = false;

  currentUrl = '';
  queryParams: any = {};
  isCollapsed = true;
  isFreeStrategic = false;

  constructor(private authService: AuthService, private activatedRoute: ActivatedRoute, private helperService: HelperService, private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService, protected licenseService: LicenseService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  highlightWords(text: any): SafeHtml {
    const key = JSON.stringify(text);
    if (this.highlightCache.has(key)) return this.highlightCache.get(key)!;

    const result = this.helperService.highlightWords(text);
    this.highlightCache.set(key, result);
    return result;
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];

    const ci = this.type === 'leak' ? 'leak' : this.type === 'tracking' ? 'tracking' : this.type === 'news' ? 'news' : this.type === 'strategic' ? 'strategic' : 'leak';
    if (this.currentUrl.includes('/consolidated/all') || this.currentUrl.includes('/profile/homepage/all')) {
      this.currentUrl = this.currentUrl.replace('/all', `/${ci}`);
    }

    this.route.queryParams.subscribe(params => {
      this.queryParams = {
        ...params,
        ci
      };
    });
    const params = new URLSearchParams(window.location.search);

    const isFree = params.get('mode') === 'free';
    const url = window.location.href.toLowerCase();
    const hasStrategic = url.includes('strategic');
    this.isFreeStrategic = isFree && hasStrategic;
  }

  isWithinDays(dateString = '', days: number): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays <= days;
  }

  isMobileMode(): boolean {
    return this.authService.getIsMobileDemo();
  }

  protected readonly window = window;
}
