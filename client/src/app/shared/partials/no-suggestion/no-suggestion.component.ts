import { Component } from '@angular/core';
import {DashboardService} from '../../../services/dashboard/dashboard.service';
import {AsyncPipe, NgIf} from '@angular/common';
import {Category} from '../../enums/pages';

@Component({
  selector: 'app-no-suggestion',
  imports: [
    AsyncPipe
  ],
  templateUrl: './no-suggestion.component.html',
})
export class NoSuggestionComponent {

  constructor(public dashboardService: DashboardService) {
  }

  protected readonly category = Category;
}
