import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import {ApiService} from '../../../../../../services/api.service';
import {NgIf} from '@angular/common';
import {DashboardResultComponent} from '../../shared/dashboard-result.component';
import {ResultItemModel} from '../../../../../../model/intel-results/result-item/result.item.model';
import {fadeInDashboardItem} from '../../../../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-dashboard-general-result-grid-item',
  templateUrl: './dashboard-general-result-grid-item.component.html',
  imports: [NgIf, DashboardResultComponent],
  animations: [fadeInDashboardItem],
})
export class DashboardGeneralResultGridItemComponent implements OnInit {
  resultItem?: ResultItemModel;
  hash: string = '';

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.hash = params.get('m_hash') || '';

      if (this.hash) {
        this.fetchGeneralData();
      }
    });
  }

  fetchGeneralData() {
    this.apiService.get<ResultItemModel>(`search/general/${this.hash}`).pipe(
      tap((data) => this.resultItem = data),
      catchError(_ => {
        return of(null);
      })
    ).subscribe();
  }
}
