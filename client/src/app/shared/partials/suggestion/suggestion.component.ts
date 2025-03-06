import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-suggestion',
  imports: [],
  templateUrl: './suggestion.component.html',
  styleUrl: './suggestion.component.css'
})
export class SuggestionComponent {
  @Input() suggestion!:string
  @Output() update_query = new EventEmitter<string>();

  onUpdateQuery(){
    this.update_query.emit(this.suggestion)
  }
}
