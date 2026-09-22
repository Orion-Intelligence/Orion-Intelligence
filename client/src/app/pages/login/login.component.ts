import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LoginContainerComponent } from './login-container/login-container.component';
@Component({
  selector: 'app-login-header',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    LoginContainerComponent
  ]
})
export class LoginComponent {
  readonly templateOnly = true;
}
