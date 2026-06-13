import { Component } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-error-handler',
  imports: [TranslatePipe],
  templateUrl: './error-handler.component.html',
})
export class ErrorHandlerComponent {
  readonly templateOnly = true;
}
