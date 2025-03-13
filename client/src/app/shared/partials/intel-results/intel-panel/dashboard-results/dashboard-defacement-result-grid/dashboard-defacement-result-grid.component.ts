import { Component, OnInit } from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import { Observable } from 'rxjs';
import { DefacementCallbackModel } from '../../../../../model/intel-results/defacement/defacement.callback.model';
import { DefacementService } from '../../../../../services/defacement.service';

@Component({
  selector: 'app-dashboard-defacement-result-grid',
  standalone: true,
  imports: [NgIf, NgForOf, AsyncPipe],
  templateUrl: './dashboard-defacement-result-grid.component.html'
})
export class DashboardDefacementResultGridComponent implements OnInit {
  resultData$!: Observable<DefacementCallbackModel[]>;

  constructor(private resultDataService: DefacementService) {}

  ngOnInit(): void {
    this.resultData$ = this.resultDataService.getResults();
  }
}
