import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HelperService } from '../../../../shared/services/helper.service';
import { GeneralResultItem } from '../../../../shared/model/results/general/general.callback.model';
import { LeakResultItem } from '../../../../shared/model/results/leak/leak.callback.model';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { AuthService } from '../../../../services/authetication/auth.service';
import { LicenseService } from '../../../../services/licenses/licenses.service';
import { isWithinDays as isWithinDaysUtil } from '../../../../shared/utils/intel-report.util';
@Component({
  selector: 'app-dashboard-results-general-grid',
  templateUrl: './dashboard-results-general.component.html',
  imports: [NgForOf, RouterLink, DatePipe, NgIf, TooltipDirective, CommonModule, NgClass],
  standalone: true
})
export class DashboardResultsGeneralComponent implements AfterViewInit, OnInit {
  private highlightCache = new Map<string, SafeHtml>();

  protected readonly window = window;

  currentUrl = '';
  queryParams: any = {};
  isCollapsed = true;
  isFreeStrategic = false;
  isConsolidatedView = false;

  @Input() query!: string;
  @Input() type!: string;
  @Input() searchResults: (GeneralResultItem | LeakResultItem)[] = [];
  @Input() isExpandAble: boolean = false;

  constructor(private authService: AuthService, private activatedRoute: ActivatedRoute, private helperService: HelperService, private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService, protected licenseService: LicenseService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  highlightWords(text: any): SafeHtml {
    const key = JSON.stringify(text);
    if (this.highlightCache.has(key)) {
      return this.highlightCache.get(key)!;
    }
    const result = this.helperService.highlightWords(text);
    this.highlightCache.set(key, result);
    return result;
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.isConsolidatedView = this.currentUrl.includes('/consolidated/');
    const ci = this.type === 'leak' ? 'leak' : this.type === 'tracking' ? 'leak' : this.type === 'news' ? 'leak' : this.type === 'general' ? 'general' : this.type === 'Strategic' ? 'strategic' : 'leak';
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
    return isWithinDaysUtil(dateString, days);
  }

  isMobileMode(): boolean {
    return this.authService.getIsMobileDemo();
  }
}
