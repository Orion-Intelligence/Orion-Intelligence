import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatResultItem } from '../../../../shared/model/results/chat/chat.callback.model';
import { DatePipe, NgForOf, NgIf, SlicePipe, CommonModule } from '@angular/common';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { NormalizeUnicodePipe } from '../../../../shared/pipes/normalize-unicode.pipe';
import { LicenseService } from '../../../../services/licenses/licenses.service';
@Component({
  selector: 'app-dashboard-result-chat',
  imports: [
    NgForOf,
    DatePipe,
    NgIf,
    SlicePipe,
    TooltipDirective, CommonModule, NormalizeUnicodePipe, RouterLink
  ],
  templateUrl: './dashboard-result-chat.component.html' 
})
export class DashboardResultChatComponent implements OnInit, AfterViewInit {
  currentUrl = '';
  queryParams: any = {};
  isCollapsed = true;
  isConsolidatedView = false;

  @Input() searchResults: ChatResultItem[] = [];
  @Input() isExpandAble: boolean = false;

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService, protected licenseService: LicenseService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.isConsolidatedView = this.currentUrl.includes('/consolidated/');
    if (this.currentUrl.includes('consolidated')) {
      this.currentUrl = this.currentUrl.replace("/all", "/chat");
    }
    if (this.currentUrl.includes('social')) {
      this.currentUrl = this.currentUrl.replace("/all", "/chat");
    }
    else if (this.currentUrl.includes('discussion')) {
      this.currentUrl = this.currentUrl + '/chat';
    }
    if (this.currentUrl.includes('social') && this.currentUrl.includes('chat') && !this.currentUrl.includes('all')) {
      this.currentUrl = this.currentUrl + '/all';
    }
    this.route.queryParams.subscribe(params => {
      this.queryParams = {
        ...params,
        ci: 'chat'
      };
    });
  }
}
