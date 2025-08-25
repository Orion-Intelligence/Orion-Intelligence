import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { NgClass, NgIf } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, HeaderComponent],
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  user = { username: '', password: '' };

  constructor(private router: Router) {
  }
  onSubmit(form: NgForm) {
    if (form.valid) {
      // this.authService.login(this.user.username, this.user.password).subscribe();
    }
  }
  goToLogin() {
    this.router.navigate(['/login']).then();
  }
}
