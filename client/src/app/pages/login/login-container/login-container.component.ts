import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/authetication/auth.service';
import { Subscription } from 'rxjs';
import { AppService } from '../../../services/core/app/app.service';
import QRCode from 'qrcode';
import { HeaderComponent } from '../../../shared/partials/header/login-header/header.component';
@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [FormsModule, CommonModule, HeaderComponent],
  templateUrl: './login-container.component.html',
})
export class LoginContainerComponent implements OnInit, OnDestroy {
  private static readonly DEFAULT_LOGO_SRC = '/assets/images/shared/logo-wide-light.svg';
  private static readonly DEFAULT_AUTH_DASHBOARD_SRC = '/assets/images/shared/auth_dashboard_icon.svg';
  private authSubscription!: Subscription;
  private tempToken: string | null = null;
  private pendingUsername: string | null = null;

  user = { mail: '', password: '' };
  errorMessage: string | null = null;
  authenticated = true;
  copied = false;
  twofaRequired = false;
  otpCode = '';
  otpUri: string | null = null;
  otpDataUrl: string | null = null;
  otpSecret: string | null = null;
  isMobile = false;
  autoDemoLogin = false;
  brandingResolved = false;

  constructor(public authService: AuthService, private router: Router, protected appService: AppService, private route: ActivatedRoute) { }

  ngOnInit() {
    this.appService.loadConfig().subscribe(() => {
      this.brandingResolved = true;
    });
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated) {
        this.appService.loadSession(true).subscribe(() => {
          this.router.navigate(['dashboard'], { replaceUrl: true }).then();
        });
      }
      else {
        this.authenticated = false;
      }
    });
    this.route.queryParams.subscribe(params => {
      const isScreenMobile = window.innerWidth <= 480;
      this.isMobile = isScreenMobile;
      let mode = params['mode'];
      if (!mode && params['redirect']) {
        const tree = this.router.parseUrl(params['redirect']);
        mode = tree.queryParams['mode'];
      }
      if (mode === 'free') {
        this.autoDemoLogin = true;
        this.demoLogin();
      }
    });
  }

  getLoginLogoSrc(): string {
    const logo = this.appService.getConfig().appSettings.logo_wide_light;
    if (!logo || logo === '/api/s/static/system/logo_wide_light_default.png') {
      return LoginContainerComponent.DEFAULT_LOGO_SRC;
    }
    return logo;
  }

  getDashboardPreviewSrc(): string {
    const authDashboardIcon = this.appService.getConfig().appSettings.auth_dashboard_icon;
    if (!authDashboardIcon || authDashboardIcon === '/api/s/static/system/auth_dashboard_icon_default.png') {
      return LoginContainerComponent.DEFAULT_AUTH_DASHBOARD_SRC;
    }
    return authDashboardIcon;
  }

  copyToClipboard(text: string): void {
    void navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
    });
  }

  async onSubmit(form: NgForm) {
    this.errorMessage = null;
    if (!form.valid) {
      return;
    }
    this.authService.login(this.user.mail, this.user.password).subscribe({
      next: async (res) => {
        if (res?.twofa_required) {
          this.twofaRequired = true;
          this.pendingUsername = res.username;
          this.tempToken = res.temp_token || null;
          this.otpUri = res.provisioning_uri || null;
          this.otpSecret = res.twofa_secret || null;
          this.otpDataUrl = this.otpUri ? await QRCode.toDataURL(this.otpUri) : null;
        }
      },
      error: err => {
        this.errorMessage = err?.error?.detail || err?.message || 'Login failed';
      }
    });
  }

  submitOtp() {
    this.errorMessage = null;
    if (!this.tempToken || !this.pendingUsername) {
      return;
    }
    this.authService
      .verifyTwofa(this.otpCode, this.tempToken, this.pendingUsername)
      .subscribe({
        next: () => {
          if (!this.authService.isAuthenticated()) {
            return;
          }
        },
        error: (err) => {
          this.errorMessage =
                    err?.error?.detail ||
                        err?.message ||
                        'Login failed';
        }
      });
  }

  goToSignUp() {
    this.router.navigate(['/signup']).then();
  }

  goToForgot() {
    this.router.navigate(['/reset']).then();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  demoLogin() {
    this.authService.demoLogin();
  }

  resendMail() {
    this.authService.signup_verification(this.user.mail, this.user.password).subscribe({
      next: () => {
        sessionStorage.setItem('allow_welcome_once', '1');
        this.router.navigate(['/welcome']).then();
      },
      error: (err) => {
        const vErr = err?.error?.validation_errors?.[0];
        this.errorMessage = vErr?.message || err?.error?.detail || 'Signup failed';
      }
    });
  }
}
