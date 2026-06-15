import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-threat-lens-topic-search-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './threat-lens-topic-search-panel.component.html',
})
export class ThreatLensTopicSearchPanelComponent {
  term = '';
  currentTopicQuery = '';

  @Input() isLoading = false;

  @Output() search = new EventEmitter<string>();

  onTermChange(value: string): void {
    this.term = value;
  }

  onSearch(): void {
    const query = this.term.trim();
    this.currentTopicQuery = query;
    this.search.emit(query);
  }
}
