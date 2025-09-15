import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-welcome',
  imports: [HeaderComponent],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent implements OnInit {
  hasToken: boolean = false;
  message: string = "Your registration has been submitted! We've received your information and are now reviewing your request. You will receive an email notification once your account has been approved by an administrator.";
  heading: string = "Thank you for registering with Orion Intelligence!";
  constructor(private router: Router, private route: ActivatedRoute, public apiService: ApiService) {
  }
  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token != null) {
      this.hasToken = true;
      this.apiService.post(`verify/${token}`, null).subscribe({
        next: (res: any) => {
          this.heading = "Verification Successful!";
          this.message = res.message || "Your email has been verified successfully. You may continue onboarding.";
        },
        error: (err) => {
          this.heading = "Verification Failed!";
          if (err.status === 400) {
            this.message = "Your verification link has expired. Please request a new one.";
          } else if (err.status === 404) {
            this.message = "Invalid verification link. Please check your email again.";
          } else {
            this.message = "Something went wrong. Please try again later.";
          }
        }
      });
    }
  }
  goToLogin() {
    this.router.navigate(['/login']).then();
  }
}