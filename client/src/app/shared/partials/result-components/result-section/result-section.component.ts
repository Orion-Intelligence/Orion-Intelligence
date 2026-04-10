import { Component, OnInit, input } from '@angular/core';

@Component({
  selector: 'app-result-section',
  imports: [],
  templateUrl: './result-section.component.html'
})
export class ResultSectionComponent implements OnInit {
  filteredListItems: string[] = [];
  readonly listItems = input<string[]>([]);

  ngOnInit() {
    this.filteredListItems = this.listItems().filter(item => {
      const cleaned = item?.trim();
      return cleaned && cleaned.length > 1;
    });
  }
}
