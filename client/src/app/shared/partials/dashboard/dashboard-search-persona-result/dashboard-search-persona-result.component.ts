import { Component, Input } from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-dashboard-search-persona-result',
  templateUrl: './dashboard-search-persona-result.component.html',
  styleUrls: ['./dashboard-search-persona-result.component.css'],
  imports: [
    CommonModule
  ]
})
export class DashboardSearchPersonaResultComponent {
  @Input() mDynamicParserStatus: string = '';
  @Input() mSearchCallbackRelevantDocument: Record<string, string[]> = {};
  @Input() mSearchCallbackQuery: string = '';
  @Input() mUsernameQuery: string = '';
  @Input() mSearchCallbackSaveSearch: string = '';
  @Input() mSearchCallbackRelevantSearchType: string = '';

  isNoRecord(): boolean {
    return this.mDynamicParserStatus === 'false' || Object.keys(this.mSearchCallbackRelevantDocument).length === 0;
  }
}
