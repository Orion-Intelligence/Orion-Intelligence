import { Component, ChangeDetectionStrategy } from '@angular/core';
@Component({
  selector: 'app-loading-form',
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './loading-form.component.html'
})
export class LoadingFormComponent {
  readonly templateOnly = true;
}
