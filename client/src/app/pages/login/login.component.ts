import { Component } from '@angular/core';
import { LoginContainerComponent } from './login-container/login-container.component';

@Component({
  selector: 'app-login-header',

  templateUrl: './login.component.html',
  imports: [
    LoginContainerComponent
  ]
})
export class LoginComponent {

}
