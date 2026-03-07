import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-result-section',
  imports: [],
  templateUrl: './result-section.component.html'
})
export class ResultSectionComponent implements OnInit {
  filteredListItems: string[] = [];

  @Input() listItems: string[] = [];

  ngOnInit() {
    this.filteredListItems = this.listItems.filter(item => {
      const cleaned = item?.trim();
      return cleaned && cleaned.length > 1;
    });
  }
}
