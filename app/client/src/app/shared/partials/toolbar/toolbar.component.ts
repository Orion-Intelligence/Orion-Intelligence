import { Component } from '@angular/core';
import {AsyncPipe, NgClass, NgOptimizedImage} from '@angular/common';
import {RouteTrackerService} from '../../services/route-tracker.service';
import {Observable} from 'rxjs';
import {RouterLink} from '@angular/router';

@Component({
  selector: 'app-toolbar',
  imports: [
    NgOptimizedImage,
    RouterLink,
    NgClass,
    AsyncPipe
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.css'
})
export class ToolbarComponent {
  currentPage$: Observable<string>;

  constructor(private routeTracker: RouteTrackerService) {
    this.currentPage$ = this.routeTracker.currentPage$;
  }
}
