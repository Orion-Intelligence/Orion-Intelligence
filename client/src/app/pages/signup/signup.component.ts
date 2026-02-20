import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/authetication/auth.service';
import { AppService } from '../../services/core/app/app.service';
import { PasswordChecks, PasswordStrength, areAllPasswordRequirementsMet, buildUsernameSuggestions, buildUsernameSuggestionText, createEmptyPasswordChecks, evaluatePasswordInput } from '../../shared/utils/auth-form.util';
@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit {
  user = { username: '', mail: '', password: '' };
  errorMessage: string | null = null;
  passwordStrength: PasswordStrength = null;
  showPasswordMeter = false;
  passwordChecks: PasswordChecks = createEmptyPasswordChecks();
  currentUnmetCheck: string | null = null;
  isMobile = false;
  usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{7,19}$/;
  usernameSuggestion: string = '';

  constructor(private router: Router, public auth_service: AuthService, private route: ActivatedRoute, protected appService: AppService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(() => {
      const isScreenMobile = window.innerWidth <= 480;
      this.isMobile = isScreenMobile;
    });
  }

  validateUsername(): boolean {
    if (this.usernamePattern.test(this.user.username)) {
      this.usernameSuggestion = '';
      return true;
    }
    const suggestions = buildUsernameSuggestions(this.user.username, this.usernamePattern);
    this.usernameSuggestion = buildUsernameSuggestionText(suggestions);
    this.errorMessage = 'Invalid username';
    return false;
  }

  validateFields() {
    if (!this.validateUsername()) {
      return false;
    }
    const emailPattern = /^[\w.-]+@[\w.-]+\.\w+$/;
    if (!emailPattern.test(this.user.mail)) {
      this.errorMessage = 'Please enter a valid email address';
      return false;
    }
    this.errorMessage = null;
    return true;
  }

  onPasswordInput(password: string) {
    const evaluation = evaluatePasswordInput(password);
    this.showPasswordMeter = evaluation.showPasswordMeter;
    this.passwordChecks = evaluation.passwordChecks;
    this.currentUnmetCheck = evaluation.currentUnmetCheck;
    this.passwordStrength = evaluation.passwordStrength;
  }

  get allPasswordRequirementsMet(): boolean {
    return areAllPasswordRequirementsMet(this.passwordChecks);
  }

  onSubmit(form: NgForm) {
    if (!this.validateFields() || !form.valid) {
      return;
    }
    this.auth_service.signup(this.user.username, this.user.mail, this.user.password).subscribe({
      next: () => this.router.navigate(['/welcome']),
      error: (err) => {
        this.errorMessage = err?.error?.detail || 'Signup failed';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']).then();
  }
}
