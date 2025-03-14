import {Component, Input} from '@angular/core';
import {Category} from '../../enums/pages';

@Component({
  selector: 'app-empty-result',
  imports: [],
  templateUrl: './empty-result.component.html',
})
export class EmptyResultComponent {
  @Input() searchQuery!: string;

  constructor() {
  }

  protected readonly category = Category;
}
