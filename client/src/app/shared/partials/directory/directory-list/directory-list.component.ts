import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable} from 'rxjs';
import {DirectoryCallbackModel} from '../../../model/callback/directory';
import {DirectoryService} from '../../../../services/directory/directory.service';

@Component({
  selector: 'app-directory-list',
  templateUrl: './directory-list.component.html',
  standalone: true,
  imports: [CommonModule],
})
export class DirectoryListComponent {
  directoryData$: Observable<DirectoryCallbackModel | null>;

  constructor(private directoryService: DirectoryService) {
    this.directoryData$ = this.directoryService.directoryData$;
  }

  isRecent(timestamp: any): boolean {
    if (!timestamp) return false;
    const date = new Date(timestamp);
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
    return date >= fifteenDaysAgo;
  }
}
