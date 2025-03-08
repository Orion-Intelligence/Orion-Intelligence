import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {ApiService} from '../../../../../../services/api.service';
import {catchError, tap} from 'rxjs/operators';
import {of} from 'rxjs';
import {NgClass, NgForOf, NgIf, NgOptimizedImage, TitleCasePipe} from '@angular/common';
import {DashboardResultComponent} from '../../shared/dashboard-result.component';
import {ResultItemModel} from '../../../../../../model/intel-results/result-item/result.item.model';
import {fadeInDashboardItem} from '../../../../../../animations/dashboard.item.animation';

@Component({
  selector: 'app-dashboard-leak-result-grid-item',
  templateUrl: './dashboard-leak-result-grid-item.component.html',
  imports: [NgForOf, NgOptimizedImage, TitleCasePipe, NgClass, DashboardResultComponent, NgIf],
  animations: [fadeInDashboardItem],
})
export class DashboardLeakResultGridItemComponent implements OnInit {
  resultItem?: ResultItemModel;
  hash: string = '';

  constructor(private route: ActivatedRoute, private apiService: ApiService) {
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.hash = params.get('m_hash') || '';

      if (this.hash) {
        this.fetchLeakData();
      }
    });
  }

  fetchLeakData() {
    this.apiService.get<ResultItemModel>(`search/leak/${this.hash}`).pipe(tap((data) => this.resultItem = data), catchError(_ => {
      console.log(this.resultItem)
      return of(null);
    })).subscribe();
  }
}
