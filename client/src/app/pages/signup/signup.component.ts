import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/authetication/auth.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, HeaderComponent, CommonModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent {
  user = { username: '', mail: '', password: '' };
  errorMessage: string | null = null;

  constructor(private router: Router, public auth_service: AuthService) {
  }
  onSubmit(form: NgForm) {
    if (form.valid) {
      this.auth_service.signup(this.user.username, this.user.mail, this.user.password).subscribe({
        next: (res) => {
          this.router.navigate(['/welcome']).then(() => {
          });
        },
        error: (err) => {
          this.errorMessage = err.error.detail || "Signup failed";
        }
      });
    }
  }
  goToLogin() {
    this.router.navigate(['/login']).then();
  }
}
