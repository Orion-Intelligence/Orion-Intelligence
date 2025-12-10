import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/authetication/auth.service';
import {AppService} from '../../services/core/app/app.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.component.html'
})
export class SignupComponent implements OnInit {
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
  currentUnmetCheck: string | null = null;
  isMobile = false;

  usernamePattern = /^[A-Za-z][A-Za-z0-9_-]{7,19}$/;
  usernameSuggestion: string = '';

  constructor(private router: Router, public auth_service: AuthService, private route: ActivatedRoute, protected appService:AppService) { }

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

    const suggestions: string[] = [];
    const base = this.user.username || '';
    let counter = 1;

    while (suggestions.length < 4 && counter < 50) {
      const suffix = counter.toString();
      let s = base.toLowerCase();

      if (!/^[A-Za-z]/.test(s)) {
        s = 'u' + s;
      }

      s = s.replace(/[^A-Za-z0-9_-]/g, '');

      if (s.length > 20 - suffix.length) {
        s = s.slice(0, 20 - suffix.length);
      }

      if (s.length < 8 - suffix.length) {
        s = s.padEnd(8 - suffix.length, '0');
      }

      const suggestion = s + suffix;

      if (this.usernamePattern.test(suggestion) && !suggestions.includes(suggestion)) {
        suggestions.push(suggestion);
      }

      counter++;
    }

    this.usernameSuggestion = suggestions.length
      ? 'Username already taken. Suggested usernames: ' + suggestions.join(', ')
      : 'Username already taken.';
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
    this.showPasswordMeter = password.length > 0;
    this.passwordChecks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password)
    };

    const checkOrder = [
      { key: 'length', message: 'At least 8 characters' },
      { key: 'lowercase', message: 'At least one lowercase letter' },
      { key: 'uppercase', message: 'At least one uppercase letter' },
      { key: 'number', message: 'At least one number' },
      { key: 'specialChar', message: 'At least one special character' }
    ] as const;

    this.currentUnmetCheck = checkOrder.find(c => !this.passwordChecks[c.key])?.message || null;

    const allRequirementsMet = Object.values(this.passwordChecks).every(v => v);

    if (!allRequirementsMet) {
      this.passwordStrength = 'weak';
      return;
    }

    if (password.length >= 12 && this.passwordChecks.specialChar && this.passwordChecks.number) {
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

  onSubmit(form: NgForm) {
    if (!this.validateFields() || !form.valid) return;

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
