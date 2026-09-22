import { Component, OnInit, input, ChangeDetectionStrategy } from '@angular/core';
import { Category } from '../../constants/pages';
import { TranslatePipe } from '../../pipes/translate.pipe';
@Component({
  selector: 'app-empty-result',
  templateUrl: './empty-result.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe],
})
export class EmptyResultComponent implements OnInit {
  protected readonly category = Category;

  query = '';
  readonly searchQuery = input('');

  ngOnInit(): void {
    this.query = this.searchQuery();
  }
}
