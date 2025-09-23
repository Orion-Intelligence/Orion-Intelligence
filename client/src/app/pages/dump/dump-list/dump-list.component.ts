import {Component, Input, OnInit} from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { map, Observable } from 'rxjs';
import { DumpService } from '../../../services/dump/dump.service';
import { DumpCallbackModel } from '../../../shared/model/dump/dump.mode';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'dump-list',
  standalone: true,
  templateUrl: './dump-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [
    NgForOf,
    AsyncPipe,
    DatePipe,
    NgIf
  ]
})
export class DumpListComponent implements OnInit {
  dumpData$: Observable<DumpCallbackModel | null>;
  @Input() isLoading!: boolean;

  constructor(public dumpService: DumpService) {
    this.dumpData$ = this.dumpService.dumpData$;
  }

  get currentPage$() {
    return this.dumpService.currentPage$;
  }

  ngOnInit(): void {
    this.dumpData$ = this.dumpService.dumpData$.pipe(
      map(data => {
        if (!data) return null;
        return {
          ...data,
          DumpCallbackModel: data.mDumpCallbackLinks.filter(item => {
            const url = (item.leak_url || '').trim();
            return url !== '' && !/^\/+$/.test(url);
          })
        };
      })
    );
  }

  copyRowData(item: any): void {
    const textToCopy = item

    navigator.clipboard.writeText(textToCopy).then(() => {
      console.log('Copied to clipboard:', textToCopy);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}
