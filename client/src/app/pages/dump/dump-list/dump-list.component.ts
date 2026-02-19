import { Component, Input, OnInit } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { map, Observable, tap } from 'rxjs';
import { DumpService } from '../../../services/dump/dump.service';
import { DumpCallbackModel } from '../../../shared/model/dump/dump.mode';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
    selector: 'dump-list',
    standalone: true,
    templateUrl: './dump-list.component.html',
    animations: [fadeInDashboardItem],
    imports: [NgForOf, AsyncPipe, DatePipe, NgIf]
})
export class DumpListComponent implements OnInit {
    dumpData$: Observable<DumpCallbackModel | null>;
    @Input()
    isLoading = true;
    constructor(public dumpService: DumpService, private router: Router, private route: ActivatedRoute) {
        this.dumpData$ = this.dumpService.dumpData$;
    }
    get currentPage$() {
        return this.dumpService.currentPage$;
    }
    ngOnInit(): void {
        this.isLoading = this.dumpService.getCurrentPage() > 0;
        this.dumpData$ = this.dumpService.dumpData$.pipe(tap(data => {
            this.isLoading = data ? false : true;
        }), map(data => {
            if (!data) {
                return null;
            }
            return {
                ...data,
                mDumpCallbackLinks: data.mDumpCallbackLinks.filter(item => {
                    const url = (item.leak_url || '').trim();
                    return url !== '' && !/^\/+$/.test(url);
                })
            };
        }));
    }
    onPageChange(currentPage: number) {
        this.dumpService.setCurrentPage(currentPage);
        this.router.navigate([], {
            relativeTo: this.route.parent ?? this.route,
            queryParams: { page: currentPage },
            queryParamsHandling: 'merge'
        }).then(() => {
            this.dumpService.reloadDumpData({ page: currentPage });
        });
    }
    copyRowData(item: any): void {
        navigator.clipboard.writeText(item).then();
    }
}
