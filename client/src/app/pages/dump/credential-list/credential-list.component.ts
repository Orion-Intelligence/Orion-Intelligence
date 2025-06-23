import { Component, OnInit } from '@angular/core';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import {CredentialCallbackModel} from '../../../shared/model/results/credentials/credential.callback.model';
import {DashboardService} from '../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  imports: [
    NgForOf,
    DatePipe,
    NgIf
  ]
})
export class CredentialListComponent implements OnInit {
  credentialData$: CredentialCallbackModel;

  constructor(public dashboardService: DashboardService) {
    this.credentialData$ = this.dashboardService.credentialCallbackModel;
  }

  ngOnInit(): void {
    this.credentialData$ = this.dashboardService.credentialCallbackModel;
  }

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).then(() => {
      console.log('Copied to clipboard:', data);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}
