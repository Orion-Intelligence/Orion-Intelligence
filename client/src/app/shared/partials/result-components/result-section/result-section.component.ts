import { Component, effect, input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-result-section',
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './result-section.component.html'
})
export class ResultSectionComponent {
  private readonly expandedSectionIndexes = new Set<number>();

  filteredListItems: string[] = [];
  readonly listItems = input<string[]>([]);

  constructor() {
    effect(() => {
      this.filteredListItems = this.listItems().filter(item => {
        const cleaned = item?.trim();
        return cleaned && cleaned.length > 1;
      });
      this.expandedSectionIndexes.clear();
    });
  }

  isSectionExpanded(index: number): boolean {
    return this.expandedSectionIndexes.has(index);
  }

  toggleSection(index: number): void {
    if (this.expandedSectionIndexes.has(index)) {
      this.expandedSectionIndexes.delete(index);
      return;
    }
    this.expandedSectionIndexes.add(index);
  }

  shouldShowSectionToggle(section: string): boolean {
    return (section || '').length > 220;
  }
}
