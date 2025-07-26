import {Component, OnInit} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {StealerLogCallbackModel} from '../../../shared/model/results/credentials/credential.callback.model';
import {DashboardService} from '../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  imports: [
    NgForOf,
    NgIf,
    DatePipe
  ]
})
export class CredentialListComponent implements OnInit {
  stealerData$: StealerLogCallbackModel;

  constructor(public dashboardService: DashboardService) {
    this.stealerData$ = this.dashboardService.stealerlogCallbackModel;
  }

  ngOnInit(): void {
    this.stealerData$ = this.dashboardService.stealerlogCallbackModel;
  }

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).then(() => {
    }).catch(_ => {
    });
  }
}
