import { Component, Input } from '@angular/core';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { StealerLogCallbackModel } from '../../../shared/model/results/credentials/credential.callback.model';
import { expandFadeRow } from '../../../shared/animations/row.animations';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { RankedCallbackModel } from '../../../shared/model/results/consolidated/ranked.callback.model';
import { ExpandedRowComponent } from '../expanded-row/expanded-row.component';
@Component({
  selector: 'app-credential-list',
  standalone: true,
  templateUrl: './credential-list.component.html',
  animations: [fadeInDashboardItem, expandFadeRow],
  imports: [NgForOf, NgIf, ExpandedRowComponent, DatePipe]
})
export class CredentialListComponent {
    @Input() stealerData$!: StealerLogCallbackModel;
    @Input() currentPage: number = 1;
    @Input() type: string = 'credential';
    @Input() isLoading!: boolean;
    @Input() rankedResult: RankedCallbackModel = new RankedCallbackModel();
    @Input() searchQuery: string = '';
    pageSize: number = 500;
    thretsExpandedRows = new Set<number>();
    stealersExpandedRows = new Set<number>();

    trackByIndex(index: number): number {
      return index;
    }

    toggleRow(index: number, expandedSet: Set<number>) {
      if (expandedSet.has(index)) {
        expandedSet.clear();
        return;
      }
      expandedSet.clear();
      expandedSet.add(index);
    }

    isExpanded(index: number, expandedSet: Set<number>): boolean {
      return expandedSet.has(index);
    }

    onRowKeydown(event: KeyboardEvent, index: number, expandedSet: Set<number>) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.toggleRow(index, expandedSet);
      }
    }

    sliceText(text: string, maxLength: number = 30): string {
      if (!text) {
        return '';
      }
      return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }
}
