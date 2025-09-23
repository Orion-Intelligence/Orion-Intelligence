import { Component, Input } from '@angular/core';
import {DatePipe, JsonPipe, KeyValuePipe, NgForOf, NgIf, NgSwitch, NgSwitchCase} from '@angular/common';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [NgForOf, NgIf, DatePipe, KeyValuePipe]
})
export class CredentialListComponent {
  @Input() stealerData$!: StealerLogCallbackModel;
  @Input() type: string = 'credential';
  @Input() isLoading!: boolean;

  expandedIndex: number | null = null;

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).catch(() => {});
  }

  toggleRow(i: number): void {
    this.expandedIndex = this.expandedIndex === i ? null : i;
  }
}
