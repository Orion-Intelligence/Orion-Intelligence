import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-result-section',
  imports: [CommonModule],
  templateUrl: './result-section.component.html'
})
export class ResultSectionComponent implements OnInit {
    @Input() listItems: string[] = [];
    filteredListItems: string[] = [];

    ngOnInit() {
      this.filteredListItems = this.listItems.filter(item => {
        const cleaned = item?.trim();
        return cleaned && cleaned.length > 1;
      });
    }
}
