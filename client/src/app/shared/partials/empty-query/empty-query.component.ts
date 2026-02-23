import { Component } from '@angular/core';
@Component({
  selector: 'app-empty-query', imports: [],
  templateUrl: './empty-query.component.html',
  styles: [`
    :host-context(.light-theme) .empty-query-card {
      background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
      border-color: #cfd9e7 !important;
      box-shadow: 0 4px 12px rgb(15 23 42 / 6%);
    }

    :host-context(.light-theme) .empty-query-subtitle {
      color: #64748b !important;
    }

    :host-context(.light-theme) .empty-query-icon {
      filter: none;
      opacity: .95;
    }
  `]
})
export class EmptyQueryComponent {
}
