import { Component, OnInit } from '@angular/core';
import {AsyncPipe, NgForOf, NgIf} from '@angular/common';
import { Observable } from 'rxjs';
import { Defacement_callback_model } from '../../../../../model/intel-results/defacement/defacement_callback_model';
import { DefacementService } from '../../../../../services/defacement.service';

@Component({
  selector: 'app-dashboard-defacement-result-grid',
  standalone: true,
  imports: [NgIf, NgForOf, AsyncPipe],
  templateUrl: './dashboard-defacement-result-grid.component.html'
})
export class DashboardDefacementResultGridComponent implements OnInit {
  resultData$!: Observable<Defacement_callback_model[]>;

  constructor(private resultDataService: DefacementService) {}

  ngOnInit(): void {
    this.resultData$ = this.resultDataService.getResults();
  }
}
