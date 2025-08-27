import { Component } from '@angular/core';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";

@Component({
  selector: 'app-welcome',
  imports: [HeaderComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {

}
