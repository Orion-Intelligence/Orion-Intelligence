import { Component, effect, input } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-result-section',
  imports: [TranslatePipe],
  templateUrl: './result-section.component.html'
})
export class ResultSectionComponent {
  filteredListItems: string[] = [];
  readonly listItems = input<string[]>([]);

  constructor() {
    effect(() => {
      this.filteredListItems = this.listItems().filter(item => {
        const cleaned = item?.trim();
        return cleaned && cleaned.length > 1;
      });
    });
  }
}
