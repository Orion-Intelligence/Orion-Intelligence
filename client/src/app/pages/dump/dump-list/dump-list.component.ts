import { Component, OnInit, effect, input } from '@angular/core';
import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { map, Observable, tap } from 'rxjs';
import { DumpService } from '../../../services/dump/dump.service';
import { DumpCallbackModel } from '../../../shared/model/dump/dump.mode';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'dump-list',
  standalone: true,
  templateUrl: './dump-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [AsyncPipe, DatePipe, NgClass, TranslatePipe]
})
export class DumpListComponent implements OnInit {
  readonly isLoadingInput = input(true, { alias: 'isLoading' });
  dumpData$: Observable<DumpCallbackModel | null>;
  isLoading = true;

  constructor(public dumpService: DumpService, private router: Router, private route: ActivatedRoute) {
    this.dumpData$ = this.dumpService.dumpData$;
    effect(() => {
      this.isLoading = this.isLoadingInput();
    });
  }

  get currentPage$() {
    return this.dumpService.currentPage$;
  }

  ngOnInit(): void {
    this.isLoading = this.dumpService.getCurrentPage() > 0;
    this.dumpData$ = this.dumpService.dumpData$.pipe(tap(data => {
      this.isLoading = !data;
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
    void navigator.clipboard.writeText(item);
  }
}
