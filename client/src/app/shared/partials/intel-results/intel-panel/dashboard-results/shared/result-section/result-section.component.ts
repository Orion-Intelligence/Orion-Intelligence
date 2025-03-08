import {Component,Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-result-section',
  imports: [CommonModule],
  templateUrl: './result-section.component.html'
})
export class ResultSectionComponent {
  @Input() listItems: string[] = [];
}
