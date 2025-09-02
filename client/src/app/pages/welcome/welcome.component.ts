import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";

@Component({
  selector: 'app-welcome',
  imports: [HeaderComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {
  constructor(private router: Router) {
  }
  goToLogin() {
    this.router.navigate(['/login']).then();
  }
}