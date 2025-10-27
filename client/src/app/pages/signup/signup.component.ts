import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/authetication/auth.service';

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
  demoUser = 'demo';
  demoPassword = 'TYdycoDuU9U6N6f2B7N8GsxpG3AkkSaOrlX8WBOwJgke3UNYCjgd3owwObGdPrsw';
  userCopied = false;
  passwordCopied = false;
  constructor(private router: Router, public auth_service: AuthService, private route: ActivatedRoute) { }
  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const isScreenMobile = window.innerWidth <= 480;
      this.isMobile = isScreenMobile;
    });
  }

  validateFields() {
    const usernamePattern = /^[a-zA-Z0-9]+$/;
    const emailPattern = /^[\w\.-]+@[\w\.-]+\.\w+$/;
    if (!usernamePattern.test(this.user.username)) {
      this.errorMessage = 'Username must be alphanumeric';
      return false;
    }
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
  demoLogin() {
    this.auth_service.demoLogin();
  }
  copy(type: string) {
    if (type === 'user') {
      navigator.clipboard.writeText(this.demoUser).then(() => {
        this.userCopied = true;
        setTimeout(() => this.userCopied = false, 1500);
      });
    }
    else if (type === 'password') {
      navigator.clipboard.writeText(this.demoPassword).then(() => {
        this.passwordCopied = true;
        setTimeout(() => this.passwordCopied = false, 1500);
      });
    }
  }
}
