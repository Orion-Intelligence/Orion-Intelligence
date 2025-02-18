import { Component } from '@angular/core';
import {LoginContainerComponent} from '../../shared/partials/login/login-container/login-container.component';

@Component({
  selector: 'app-login',

  templateUrl: './login.component.html',
  imports: [
    LoginContainerComponent,
  ]
})
export class LoginComponent {

}
