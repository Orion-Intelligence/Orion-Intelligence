import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {DatePipe, NgForOf, NgIf, SlicePipe, CommonModule} from '@angular/common';
import {ScrollService} from '../../../../services/scroll.service';
import {TooltipDirective} from '../../../../directive/tooltip-directive.directive';
import {SocialResultItem} from '../../../../model/results/social/social.callback.model';
import {fadeInDashboardItem} from "../../../../animations/dashboard.item.animation";
import {RemoveEmojisPipe} from '../../../../model/pipes/remove-emojis-pipe.pipe';

@Component({
  selector: 'app-dashboard-result-social',
  standalone: true,
  imports: [
    NgForOf,
    DatePipe,
    NgIf,
    SlicePipe,
    RouterLink,
    TooltipDirective,
    CommonModule,
    RemoveEmojisPipe
  ],
  templateUrl: './dashboard-result-social.component.html',
  animations: [fadeInDashboardItem]
})
export class DashboardResultSocialComponent implements OnInit, AfterViewInit {
  @Input() searchResults: SocialResultItem[] = [];
  @Input() isExpandAble: boolean = false;

  currentUrl = '';
  queryParams: any = {};
  isCollapsed = true;

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  getContentLines(item: any): string[] {
    return item?.m_content
      ? item.m_content.split('\n').filter((line: string) => line.trim())
      : [];
  }

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];

    if (this.currentUrl.includes('consolidated')) {
      this.currentUrl = this.currentUrl.replace('/all', '/social');
    }

    this.route.queryParams.subscribe(params => {
      this.queryParams = {
        ...params,
        ci: 'social'
      };
    });
  }
}
