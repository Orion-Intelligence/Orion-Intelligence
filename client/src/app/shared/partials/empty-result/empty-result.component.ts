import { Component, OnInit, input } from '@angular/core';
import { Category } from '../../constants/pages';
@Component({
  selector: 'app-empty-result',
  templateUrl: './empty-result.component.html',
  standalone: true,
  imports: [],
})
export class EmptyResultComponent implements OnInit {
  protected readonly category = Category;

  query = '';
  readonly searchQuery = input('');

  ngOnInit(): void {
    this.query = this.searchQuery();
  }
}
