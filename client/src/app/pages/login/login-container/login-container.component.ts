import { Component, OnDestroy, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/authetication/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
import { AppService } from '../../../services/core/app/app.service';
import QRCode from 'qrcode';
import { HeaderComponent } from '../../../shared/partials/header/login-header/header.component';
import { PasswordToggleDirective } from '../../../shared/directive/password-toggle.directive';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login-container',
  standalone: true,
  imports: [FormsModule, CommonModule, HeaderComponent, PasswordToggleDirective, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './login-container.component.html',
})
export class LoginContainerComponent implements OnInit, OnDestroy {
  private static readonly DEFAULT_LOGO_SRC = '/assets/images/shared/logo-wide-light.svg';
  private static readonly DEFAULT_AUTH_DASHBOARD_SRC = '/assets/images/shared/auth_dashboard_map.png';
  private static readonly RETRY_DEADLINE_KEY = 'login_retry_deadline';
  private static readonly RETRY_DURATION_KEY = 'login_retry_duration';
  private authSubscription!: Subscription;
  private tempToken: string | null = null;
  private pendingUsername: string | null = null;
  private retryTimer?: ReturnType<typeof setInterval>;
  private destroyed = false;

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
  showSignupLink = false;
  retrySeconds = 0;
  retryDuration = 0;
  cooldownComplete = false;
  submitting = false;

  constructor(public authService: AuthService, private router: Router, protected appService: AppService, private route: ActivatedRoute, private zone: NgZone, private cdr: ChangeDetectorRef) { }

  get verificationPending(): boolean {
    return this.errorMessage?.toLowerCase().replace(/\.$/, '') === 'verification pending';
  }

  get retryLabel(): string {
    return `${Math.floor(this.retrySeconds / 60)}:${String(this.retrySeconds % 60).padStart(2, '0')}`;
  }

  get feedbackTitle(): string {
    if (this.retrySeconds > 0) {
      return 'Sign-in temporarily paused';
    }
    if (this.cooldownComplete) {
      return 'Ready to try again';
    }
    if (this.verificationPending) {
      return 'Verify your email';
    }
    return 'Unable to sign in';
  }

  get feedbackMessage(): string {
    if (this.retrySeconds > 0) {
      return 'Too many attempts. Please wait for the timer to finish.';
    }
    if (this.cooldownComplete) {
      return 'You can now sign in with your email and password.';
    }
    if (this.verificationPending) {
      return 'Open the verification link in your inbox to continue.';
    }
    if (this.errorMessage === 'Invalid user or password') {
      return 'Your email or password is incorrect. Check your details and try again.';
    }
    return this.errorMessage ?? '';
  }

  private handleLoginError(err: HttpErrorResponse): void {
    const detail = err.error?.detail;
    this.errorMessage = typeof detail === 'string' ? detail : 'Something went wrong. Please try again.';
    if (err.status !== 429) {
      return;
    }
    const header = err.headers?.get('Retry-After')?.trim();
    const fallback = Number(this.errorMessage.match(/try again in (\d+) seconds/i)?.[1]);
    const headerSeconds = header ? (/^\d+$/.test(header) ? Number(header) : Math.ceil((Date.parse(header) - Date.now()) / 1000)) : NaN;
    const seconds = Number.isFinite(headerSeconds) ? headerSeconds : fallback;
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return;
    }
    this.retryDuration = Math.ceil(seconds);
    this.startRetryCountdown(Date.now() + this.retryDuration * 1000);
  }

  private storeRetryState(deadline: number): void {
    try {
      sessionStorage.setItem(LoginContainerComponent.RETRY_DEADLINE_KEY, String(deadline));
      sessionStorage.setItem(LoginContainerComponent.RETRY_DURATION_KEY, String(this.retryDuration));
    }
    catch {
      return;
    }
  }

  private clearRetryState(): void {
    try {
      sessionStorage.removeItem(LoginContainerComponent.RETRY_DEADLINE_KEY);
      sessionStorage.removeItem(LoginContainerComponent.RETRY_DURATION_KEY);
    }
    catch {
      return;
    }
  }

  private startRetryCountdown(deadline: number): void {
    clearInterval(this.retryTimer);
    const remaining = Math.ceil((deadline - Date.now()) / 1000);
    if (remaining <= 0) {
      this.clearRetryState();
      return;
    }
    this.cooldownComplete = false;
    this.retrySeconds = remaining;
    this.retryDuration = Math.max(this.retryDuration, remaining);
    this.storeRetryState(deadline);
    this.retryTimer = setInterval(() => {
      this.zone.run(() => {
        this.retrySeconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (this.retrySeconds === 0) {
          clearInterval(this.retryTimer);
          this.clearRetryState();
          this.errorMessage = null;
          this.cooldownComplete = true;
        }
        if (!this.destroyed) {
          this.cdr.detectChanges();
        }
      });
    }, 1000);
  }

  private restoreRetryCountdown(): void {
    let storedDeadline = 0;
    let storedDuration = 0;
    try {
      storedDeadline = Number(sessionStorage.getItem(LoginContainerComponent.RETRY_DEADLINE_KEY));
      storedDuration = Number(sessionStorage.getItem(LoginContainerComponent.RETRY_DURATION_KEY));
    }
    catch {
      return;
    }
    if (!Number.isFinite(storedDeadline) || storedDeadline <= Date.now()) {
      this.clearRetryState();
      return;
    }
    this.errorMessage = 'Too many login attempts';
    this.retryDuration = Number.isFinite(storedDuration) ? storedDuration : 0;
    this.startRetryCountdown(storedDeadline);
  }

  ngOnInit() {
    this.restoreRetryCountdown();
    this.appService.loadConfig().subscribe(() => {
      this.brandingResolved = true;
      this.showSignupLink = this.appService.getConfig().appSettings.signup_enabled;
    });
    this.authSubscription = this.authService.authState$.subscribe(authState => {
      if (authState.isAuthenticated) {
        this.appService.loadSession(true).subscribe(() => {
          const user = this.appService.userSessionData().user;
          const passwordResetToken = user.password_reset_token ?? this.authService.passwordResetToken;
          if (user.password_reset_required && passwordResetToken) {
            this.router.navigate(['/reset', passwordResetToken], { replaceUrl: true }).then();
            return;
          }
          const mailRedirect = this.validMailSsoRedirect();
          if (mailRedirect) {
            window.location.assign(mailRedirect);
            return;
          }
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
      let mode = params.mode;
      if (!mode && params.redirect) {
        const tree = this.router.parseUrl(params.redirect);
        mode = tree.queryParams.mode;
      }
      if (mode === 'free') {
        localStorage.setItem('mobileDemo', 'true');
        this.autoDemoLogin = true;
        this.demoLogin();
      }
    });
  }

  private validMailSsoRedirect(): string | null {
    const rawRedirect = this.route.snapshot.queryParamMap.get('redirect');
    if (!rawRedirect) {
      return null;
    }
    try {
      const redirect = new URL(rawRedirect, window.location.origin);
      if (redirect.origin !== window.location.origin
        || redirect.pathname !== '/api/sso/mail/authorize') {
        return null;
      }
      return `${redirect.pathname}${redirect.search}`;
    }
    catch {
      return null;
    }
  }

  getLoginLogoSrc(): string {
    if (!this.brandingResolved) {
      return '';
    }
    return this.appService.getConfig().appSettings.logo_wide_light || LoginContainerComponent.DEFAULT_LOGO_SRC;
  }

  getDashboardPreviewSrc(): string {
    return LoginContainerComponent.DEFAULT_AUTH_DASHBOARD_SRC;
  }

  isDefaultDashboardPreview(): boolean {
    return true;
  }

  isLightTheme(): boolean {
    return typeof document !== 'undefined' && document.body.classList.contains('light-theme');
  }

  copyToClipboard(text: string): void {
    void navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
    });
  }

  onSubmit(form: NgForm) {
    if (this.retrySeconds > 0 || this.submitting) {
      return;
    }
    this.cooldownComplete = false;
    this.errorMessage = null;
    if (!form.valid) {
      return;
    }
    this.submitting = true;
    this.authService.login(this.user.mail, this.user.password).pipe(finalize(() => {
      this.submitting = false;
    })).subscribe({
      next: (res) => {
        if (res?.twofa_required) {
          this.twofaRequired = true;
          this.pendingUsername = res.username ?? this.user.mail;
          this.tempToken = res.temp_token ?? null;
          this.otpUri = res.provisioning_uri ?? null;
          this.otpSecret = res.twofa_secret ?? null;
          this.otpDataUrl = null;
          if (this.otpUri) {
            void QRCode.toDataURL(this.otpUri).then(dataUrl => {
              this.otpDataUrl = dataUrl;
            }).catch(() => {
              this.otpDataUrl = null;
            });
          }
        }
      },
      error: err => {
        this.handleLoginError(err);
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
                    err?.error?.detail ??
                        err?.message ??
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
    this.destroyed = true;
    clearInterval(this.retryTimer);
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
        this.errorMessage = vErr?.message ?? err?.error?.detail ?? 'Signup failed';
      }
    });
  }
}
