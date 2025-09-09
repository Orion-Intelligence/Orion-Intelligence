import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/authetication/auth.service';
import { NgForm, FormsModule } from '@angular/forms';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  imports: [FormsModule, NgIf, HeaderComponent]
})
export class ForgotPasswordComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;
  hasToken: boolean = false;
  token: string = '';
  confirmPassword: string | undefined;
  constructor(private router: Router, private route: ActivatedRoute, private http: HttpClient, public auth_service: AuthService) {
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
          next: (res) => {
            console.log("Password updated response:", res);
            this.router.navigate(['login'], { replaceUrl: true }).then();
          },
          error: (err) => {
            if (err.status === 404) {
              this.errorMessage = "Invalid link";
            } else {
              this.errorMessage = "Something went wrong. Please try again later.";
            }
          }
        });
      } else {
        this.auth_service.forgotPassword(this.email).subscribe({
          next: (res) => {
            console.log(res);
            this.errorMessage = 'Password reset mail sent successfully';
          },
          error: (err) => {
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
