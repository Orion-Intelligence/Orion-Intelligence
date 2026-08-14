import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-threat-lens-topic-search-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './threat-lens-topic-search-panel.component.html',
})
export class ThreatLensTopicSearchPanelComponent {
  term = '';

  @Input() isLoading = false;

  @Output() search = new EventEmitter<string>();

  onTermChange(value: string): void {
    this.term = value;
  }

  onSearch(): void {
    const query = this.term.trim();
    this.search.emit(query);
  }
}
