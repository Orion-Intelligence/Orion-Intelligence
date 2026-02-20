import { NgIf, CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/authetication/auth.service';
import { NgForm, FormsModule } from '@angular/forms';
import { HeaderComponent } from "../header/login-header/header.component";
import { PasswordChecks, PasswordStrength, areAllPasswordRequirementsMet, createEmptyPasswordChecks, evaluatePasswordInput } from "../../utils/auth-form.util";
@Component({
  selector: 'app-forgot-password',
  templateUrl: './reset-password.component.html',
  imports: [FormsModule, NgIf, HeaderComponent, CommonModule]
})
export class ResetPasswordComponent implements OnInit {
  email = '';
  password = '';
  errorMessage: string | null = null;
  responseError = false;
  hasToken: boolean = false;
  token: string = '';
  confirmPassword: string = 'asdsadasd';
  passwordStrength: PasswordStrength = null;
  showPasswordMeter = false;
  passwordChecks: PasswordChecks = createEmptyPasswordChecks();
  currentUnmetCheck: string | null = null;

  constructor(private router: Router, private route: ActivatedRoute, public auth_service: AuthService) {
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
            }
            else if (err.status === 400) {
              this.errorMessage = "New password must be different from the old one.";
            }
            else {
              this.errorMessage = "Something went wrong. Please try again later.";
            }
          }
        });
      }
      else {
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
            }
            else {
              this.errorMessage = "Something went wrong. Please try again later.";
            }
          }
        });
      }
    }
  }
}
