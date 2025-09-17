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


  passwordStrength: 'weak' | 'medium' | 'strong' | null = null;
  showPasswordMeter = false;
  passwordChecks = {
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    specialChar: false
  };

  constructor(private router: Router, public auth_service: AuthService) {
  }
  isCompanyMail: boolean = true;
  private blockedDomains = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com',
    'live.com', 'aol.com', 'icloud.com', 'protonmail.com', 'gmx.com'
  ];
  onPasswordInput(password: string) {
    this.showPasswordMeter = password.length > 0;

    this.passwordChecks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password)
    };

    const allRequirementsMet = Object.values(this.passwordChecks).every(v => v);

    if (!allRequirementsMet) {
      this.passwordStrength = 'weak';
      return;
    }

    if (password.length >= 12 && /[^A-Za-z0-9]/.test(password) && /[0-9]/.test(password)) {
      this.passwordStrength = 'strong';
    } else if (password.length >= 10) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'weak';
    }
  }
  get allPasswordRequirementsMet(): boolean {
    return Object.values(this.passwordChecks).every(v => v);
  }
  onEmailInput(email: string) {
    if (!email) {
      this.isCompanyMail = true;
      return;
    }
    const domain = email.split('@')[1]?.toLowerCase();
    this.isCompanyMail = domain ? !this.blockedDomains.includes(domain) : true;
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
