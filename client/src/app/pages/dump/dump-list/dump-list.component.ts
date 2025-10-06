import {Component, Input, OnInit} from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { map, Observable, tap } from 'rxjs';
import { DumpService } from '../../../services/dump/dump.service';
import { DumpCallbackModel } from '../../../shared/model/dump/dump.mode';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'dump-list',
  standalone: true,
  templateUrl: './dump-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [NgForOf, AsyncPipe, DatePipe, NgIf]
})
export class DumpListComponent implements OnInit {
  dumpData$: Observable<DumpCallbackModel | null>;
  @Input() isLoading = true;

  constructor(public dumpService: DumpService) {
    this.dumpData$ = this.dumpService.dumpData$;
  }

  get currentPage$() {
    return this.dumpService.currentPage$;
  }

  ngOnInit(): void {
    this.dumpData$ = this.dumpService.dumpData$.pipe(
      tap(data => { if (data) this.isLoading = false; }),
      map(data => {
        if (!data) return null;
        return {
          ...data,
          mDumpCallbackLinks: data.mDumpCallbackLinks.filter(item => {
            const url = (item.leak_url || '').trim();
            return url !== '' && !/^\/+$/.test(url);
          })
        };
      })
    );
  }

  copyRowData(item: any): void {
    const textToCopy = item;
    navigator.clipboard.writeText(textToCopy).then();
  }
}
