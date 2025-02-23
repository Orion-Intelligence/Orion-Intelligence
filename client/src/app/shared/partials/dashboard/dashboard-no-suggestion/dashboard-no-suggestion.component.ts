import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-no-suggestion',
  templateUrl: './dashboard-no-suggestion.component.html',
  styleUrls: ['./dashboard-no-suggestion.component.css']
})
export class DashboardNoSuggestionComponent {
  @Input() mDynamicParserStatus: string = ''; // Bind this dynamically
  @Input() mSearchCallbackQuery: string = ''; // Bind this dynamically
}
