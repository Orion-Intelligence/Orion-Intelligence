import {Component, Input} from '@angular/core';
import {DatePipe, NgForOf, NgIf} from '@angular/common';
import {StealerLogCallbackModel} from '../../../shared/model/results/credentials/credential.callback.model';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem],
  imports: [
    NgForOf,
    NgIf,
    DatePipe
  ]
})
export class CredentialListComponent {
  @Input() stealerData$!: StealerLogCallbackModel;
  @Input() type: string = 'credential';
  @Input() isLoading!: boolean;

  copyRowData(data: string): void {
    navigator.clipboard.writeText(data).catch(() => {});
  }
}
