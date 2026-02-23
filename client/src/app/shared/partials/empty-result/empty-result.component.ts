import { Component, Input, OnInit } from '@angular/core';
import { Category } from '../../constants/pages';
@Component({
  selector: 'app-empty-result',
  templateUrl: './empty-result.component.html',
  standalone: true,
  imports: [],
  styles: [`
    :host-context(.light-theme) .empty-result-card {
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
      border-color: #d7dee8 !important;
      box-shadow: 0 8px 20px rgb(15 23 42 / 8%);
    }

    :host-context(.light-theme) .empty-result-divider {
      background: #d7dee8 !important;
    }

    :host-context(.light-theme) .empty-result-icon {
      filter: brightness(0) saturate(100%) invert(24%) sepia(16%) saturate(939%) hue-rotate(176deg) brightness(95%) contrast(89%);
    }
  `],
})
export class EmptyResultComponent implements OnInit {
  protected readonly category = Category;

  query = '';

  @Input() searchQuery!: string;

  ngOnInit(): void {
    this.query = this.searchQuery;
  }
}
