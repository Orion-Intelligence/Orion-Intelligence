import { Component, OnInit } from '@angular/core';
import {AsyncPipe, NgForOf, DatePipe, NgIf} from '@angular/common';
import { Observable } from 'rxjs';
import {DumpService} from '../../../services/dump/dump.service';
import {DumpCallbackModel} from '../../../shared/model/dump/dump.mode';

@Component({
  selector: 'dump-list',
  standalone: true,
  templateUrl: './dump-list.component.html',
  imports: [
    NgForOf,
    AsyncPipe,
    DatePipe,
    NgIf
  ]
})
export class DumpListComponent implements OnInit {
  dumpData$: Observable<DumpCallbackModel | null>;

  constructor(public dumpService: DumpService) {
    this.dumpData$ = this.dumpService.dumpData$;
  }

  ngOnInit(): void {
    this.dumpData$ = this.dumpService.dumpData$;
  }

  get currentPage$() {
    return this.dumpService.currentPage$;
  }
}
