import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgClass, NgIf, NgOptimizedImage } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/authetication/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [NgOptimizedImage, FormsModule, NgIf, NgClass],
  templateUrl: './login-container.component.html',
})
export class LoginContainerComponent implements OnInit, OnDestroy {
  user = { username: '', password: '' };
  errorMessage: string | null = null;
  authenticated: boolean = true;
  private authSubscription!: Subscription;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated) {
        this.router.navigate([''], { replaceUrl: true }).then();
      } else {
        this.authenticated = false;
      }
      this.errorMessage = authState.error || null;
    });
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      this.authService.login(this.user.username, this.user.password).subscribe();
    }
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }
}
