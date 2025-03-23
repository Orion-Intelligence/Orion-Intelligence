import {Component, Input, SimpleChanges} from '@angular/core';
import {Category} from '../../enums/pages';

@Component({
  selector: 'app-empty-result', imports: [], templateUrl: './empty-result.component.html',
})
export class EmptyResultComponent {
  @Input() searchQuery!: string;
  query = ""

  ngOnInit(_: SimpleChanges): void {
    this.query = this.searchQuery
  }

  constructor() {
  }

  protected readonly category = Category;
}
