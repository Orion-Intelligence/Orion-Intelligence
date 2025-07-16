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

  getParsedLog(log: string, index: number): string {
    const patterns = [
      {
        regex: /^((?:https?:\/\/)?[^\s]+?)(?=[ :])[: ]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})[ :]+(.+\S)$/,
        map: (match: RegExpExecArray) => [match[1], match[2], match[3]]
      },
      {
        regex: /^((?:https?:\/\/)?[^\s]+)[ :]+([^:\s]+):([^\s:]+)$/,
        map: (match: RegExpExecArray) => [match[1], match[2], match[3]]
      },
      {
        regex: /^([^:\s]+):([^:\s]+)$/,
        map: (match: RegExpExecArray) => ["", match[1], match[2]]
      }
    ];

    for (let pattern of patterns) {
      const match = pattern.regex.exec(log);
      if (match) {
        const [url, username, password] = pattern.map(match);
        return [url, username, password][index] || "";
      }
    }
    return "";
  }

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).then(() => {
      console.log('Copied to clipboard:', data);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  }
}
