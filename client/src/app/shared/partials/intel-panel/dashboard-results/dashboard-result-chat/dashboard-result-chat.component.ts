import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ChatResultItem} from '../../../../model/results/chat/chat.callback.model';
import {DatePipe, NgForOf, NgIf, SlicePipe, CommonModule} from '@angular/common';
import {ScrollService} from '../../../../services/scroll.service';
import {TooltipDirective} from '../../../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-dashboard-result-chat',
  imports: [
    NgForOf,
    DatePipe,
    NgIf,
    SlicePipe,
    RouterLink,
    TooltipDirective, CommonModule
  ],
  templateUrl: './dashboard-result-chat.component.html'
})
export class DashboardResultChatComponent implements OnInit, AfterViewInit {
  @Input() searchResults: ChatResultItem[] = [];
  @Input() isExpandAble: boolean = false;
  currentUrl = '';
  queryParams: any = {};
  isCollapsed = true;

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];

    if (this.currentUrl.includes('consolidated')) {
      this.currentUrl = this.currentUrl.replace("/all", "/chat");
    }
    if (this.currentUrl.includes('social')) {
      this.currentUrl = this.currentUrl.replace("/all", "/chat");
    }
    else if (this.currentUrl.includes('discussion')) {
      this.currentUrl = this.currentUrl + '/chat';
    }

    this.route.queryParams.subscribe(params => {
      this.queryParams = {
        ...params,
        ci: 'chat'
      };
    });
  }
}
