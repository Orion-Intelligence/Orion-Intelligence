import { NgIf, CommonModule } from '@angular/common';
import {Component, OnInit} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/authetication/auth.service';
import { NgForm, FormsModule } from '@angular/forms';
import { HeaderComponent } from "../header/login-header/header.component";

@Component({
  selector: 'app-forgot-password',
  templateUrl: './reset-password.component.html',
  imports: [FormsModule, NgIf, HeaderComponent, CommonModule]
})
export class ResetPasswordComponent implements OnInit{
  email = '';
  password = '';
  errorMessage: string | null = null;
  responseError = false;
  hasToken: boolean = false;
  token: string = '';
  confirmPassword: string = 'asdsadasd';

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
  constructor(private router: Router, private route: ActivatedRoute, public auth_service: AuthService) {
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

    this.currentUnmetCheck =
      checkOrder.find(c => !this.passwordChecks[c.key])?.message || null;

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

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token != null) {
      this.token = token;
      this.hasToken = true;
    }
  }
  onSubmit(form: NgForm) {
    this.errorMessage = '';
    if (form.valid) {
      if (this.hasToken) {
        if (this.password !== this.confirmPassword) {
          this.errorMessage = "Password and confirm password do not match";
          return;
        }

        this.auth_service.updatePassword(this.token, this.password).subscribe({
          next: (_) => {
            this.responseError = false;
            this.router.navigate(['login'], { replaceUrl: true }).then();
          },
          error: (err) => {
            this.responseError = true;
            if (err.status === 404) {
              this.errorMessage = "Invalid link";
            } else if (err.status === 400) {
              this.errorMessage = "New password must be different from the old one.";
            } else {
              this.errorMessage = "Something went wrong. Please try again later.";
            }
          }
        });
      } else {
        this.auth_service.forgotPassword(this.email).subscribe({
          next: (_) => {
            this.responseError = false;
            this.router.navigate(['notification'], {
              state: {
                title: 'Password Reset Email Sent',
                description: 'A password reset link has been sent to your registered email address. Please check your inbox to continue.'
              }
            }).then();
          },
          error: (err) => {
            this.responseError = true;
            if (err.status === 404) {
              this.errorMessage = "Entered mail is not registered";
            } else {
              this.errorMessage = "Something went wrong. Please try again later.";
            }
          }
        });
      }
    }
  }
}
