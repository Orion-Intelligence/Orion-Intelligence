import {Component,Input} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-result-section',
  imports: [CommonModule],
  templateUrl: './result-section.component.html',
  styleUrl: './result-section.component.css'
})
export class ResultSectionComponent {
  @Input() sections: { title: string, content: string }[] = [];
}
