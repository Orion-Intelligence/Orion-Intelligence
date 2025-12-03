import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable} from 'rxjs';
import {DirectoryCallbackModel} from '../../../shared/model/directory/directory.model';
import {DirectoryService} from '../../../services/directory/directory.service';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';

@Component({
  selector: 'app-directory-list',
  templateUrl: './directory-list.component.html',
  standalone: true,
  imports: [CommonModule],
  animations: [fadeInDashboardItem]
})
export class DirectoryListComponent {
  directoryData$: Observable<DirectoryCallbackModel | null>;
  visibleCount = 50;

  constructor(public directoryService: DirectoryService) {
    this.directoryData$ = this.directoryService.directoryData$;
  }

  isRecent(timestamp: any): boolean {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return date >= fifteenDaysAgo;
  }

  onScroll(event: any): void {
    const target = event.target;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
      this.visibleCount += 50;
    }
  }
}
