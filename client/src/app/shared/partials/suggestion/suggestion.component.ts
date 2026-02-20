import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-suggestion', imports: [NgIf],
  templateUrl: './suggestion.component.html'
})
export class SuggestionComponent {
    @Input() suggestion!: string;
    @Output() update_query = new EventEmitter<string>();

    onUpdateQuery() {
      this.update_query.emit(this.suggestion);
    }
}
