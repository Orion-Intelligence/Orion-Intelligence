import {Component, Input, SimpleChanges} from '@angular/core';
import {Category} from '../../enums/pages';

@Component({
  selector: 'app-empty-result', imports: [], templateUrl: './empty-result.component.html',
})
export class EmptyResultComponent {
  @Input() searchQuery!: string;
  query = ""
  protected readonly category = Category;

  constructor() {
  }

  ngOnInit(_: SimpleChanges): void {
    this.query = this.searchQuery
  }
}
