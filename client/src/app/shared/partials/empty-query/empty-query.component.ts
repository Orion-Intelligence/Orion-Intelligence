import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-empty-query', imports: [TranslatePipe],
  templateUrl: './empty-query.component.html',
})
export class EmptyQueryComponent {
  readonly templateOnly = true;
}
