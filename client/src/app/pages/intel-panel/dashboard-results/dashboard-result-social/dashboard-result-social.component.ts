import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe, NgForOf, NgIf, SlicePipe, CommonModule } from '@angular/common';
import { ScrollService } from '../../../../shared/services/scroll.service';
import { TooltipDirective } from '../../../../shared/directive/tooltip-directive.directive';
import { SocialResultItem } from '../../../../shared/model/results/social/social.callback.model';
import { fadeInDashboardItem } from "../../../../shared/animations/dashboard.item.animation";
import { RemoveEmojisPipe } from '../../../../shared/pipes/remove-emojis-pipe.pipe';
import { LicenseService } from '../../../../services/licenses/licenses.service';
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
    @Input()
    searchResults: SocialResultItem[] = [];
    @Input()
    isExpandAble: boolean = false;
    currentUrl = '';
    queryParams: any = {};
    isCollapsed = true;
    constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService, protected licenseService: LicenseService) {
    }
    ngAfterViewInit() {
        this.scrollService.scrollToSavedPosition();
    }
    getContentLines(item: any): string[] {
        return item?.m_content
            ? item.m_content
                .split('\n')
                .filter((line: string) => line.trim() && (line.match(/ /g) || []).length > 5)
            : [];
    }
    hasCodeType(item: any): boolean {
        return Array.isArray(item.m_content_type)
            ? item.m_content_type.some((t: string) => t.includes('code'))
            : (typeof item.m_content_type === 'string' && item.m_content_type.includes('code'));
    }
    getContentWithoutEmptyLines(content: string | undefined): string {
        if (!content) {
            return "";
        }
        return (content || '')
            .split('\n')
            .filter(line => line.trim().length > 0)
            .join('\n');
    }
    ngOnInit() {
        this.currentUrl = this.router.url.split('?')[0];
        if (this.currentUrl.includes('consolidated')) {
            this.currentUrl = this.currentUrl.replace('/all', '/social');
        }
        else if (this.currentUrl.includes('discussion')) {
            this.currentUrl = this.currentUrl + '/social';
        }
        this.route.queryParams.subscribe(params => {
            this.queryParams = {
                ...params,
                ci: 'social'
            };
        });
    }
}
