import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, NgClass, NgIf } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/authetication/auth.service';
import { Subscription } from 'rxjs';
import { HeaderComponent } from '../../../shared/partials/header/login-header/header.component';
import { AppService } from '../../../services/core/app/app.service';

import QRCode from 'qrcode';


@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [FormsModule, NgIf, NgClass, CommonModule],
  templateUrl: './login-container.component.html',
})
export class LoginContainerComponent implements OnInit, OnDestroy {
  user = { username: '', password: '' };
  errorMessage: string | null = null;
  authenticated = true;
  copied = false;
  private authSubscription!: Subscription;

  twofaRequired = false;
  otpCode = '';
  otpUri: string | null = null;
  otpDataUrl: string | null = null;
  otpSecret: string | null = null;

  private tempToken: string | null = null;
  private pendingUsername: string | null = null;
  isMobile = false;
  demoUser = 'demo';
  demoPassword = 'TYdycoDuU9U6N6f2B7N8GsxpG3AkkSaOrlX8WBOwJgke3UNYCjgd3owwObGdPrsw';
  userCopied = false;
  passwordCopied = false;

  constructor(public authService: AuthService, private router: Router, protected appService: AppService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated) {
        this.router.navigate(['dashboard'], { replaceUrl: true }).then();
      } else {
        this.authenticated = false;
      }
      if (authState.error != "2FA required") {
        this.errorMessage = authState.error ?? null;
      }
    });
    this.route.queryParams.subscribe(params => {
      const isScreenMobile = window.innerWidth <= 480;
      this.isMobile = isScreenMobile;
    });
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
    });
  }

  async onSubmit(form: NgForm) {
    if (this.user.username === '/token') {
      this.demoLogin();
      return
    }
    if (!form.valid) return;
    this.authService.login(this.user.username, this.user.password).subscribe(async (res) => {
      if (res?.twofa_required) {
        this.twofaRequired = true;
        this.pendingUsername = this.user.username;
        this.tempToken = res.temp_token || null;
        this.otpUri = res.provisioning_uri || null;
        this.otpSecret = res.twofa_secret || null;
        this.otpDataUrl = this.otpUri ? await QRCode.toDataURL(this.otpUri) : null;
      }
    });
  }

  submitOtp() {
    if (!this.tempToken || !this.pendingUsername) return;
    this.authService.verifyTwofa(this.otpCode, this.tempToken, this.pendingUsername).subscribe(() => {
      if (!this.authService.isAuthenticated()) return;
      this.twofaRequired = false;
      this.otpUri = null;
      this.otpDataUrl = null;
      this.otpSecret = null;
      this.otpCode = '';
      this.tempToken = null;
      this.pendingUsername = null;
    });
  }

  goToSignUp() {
    this.router.navigate(['/signup']).then();
  }
  goToForgot() {
    this.router.navigate(['/forgot']).then();
  }

  ngOnDestroy() {
    if (this.authSubscription) this.authSubscription.unsubscribe();
  }
  demoLogin() {
    this.authService.demoLogin();
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
