import { Component, OnInit } from '@angular/core';
import { HeaderComponent } from "../../shared/partials/header/login-header/header.component";
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-onboarding-complete',
  imports: [HeaderComponent],
  templateUrl: './onboarding-complete.component.html',
  styleUrl: './onboarding-complete.component.css'
})
export class OnboardingCompleteComponent implements OnInit {
  constructor(private route: ActivatedRoute, private http: HttpClient) { }
  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    this.http.get(`/api/verify/${token}`).subscribe(
      res => console.log('Verified!', res),
      err => console.error('Verification failed', err)
    );
  }
}
