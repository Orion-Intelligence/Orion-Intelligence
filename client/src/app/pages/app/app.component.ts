import { Component, effect, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { ErrorStoreService } from '../../shared/services/error-store.service';
import { filter, map, Observable } from 'rxjs';

import { AppService } from '../../services/core/app/app.service';
import { appAnimation, quotaBannerAnimation } from '../../shared/animations/app.animations';
import { MessageNotificationComponent } from '../../shared/partials/message-notification/message-notification.component';
import { LoaderComponent } from '../../shared/partials/loader/loader.component';
import { TrailNotificationComponent } from '../../shared/partials/trail-notification/trail-notification.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MessageNotificationComponent, LoaderComponent, TrailNotificationComponent],
  templateUrl: './app.component.html',
  animations: [appAnimation, quotaBannerAnimation],
})
export class AppComponent {
  protected readonly JSON = JSON;

  currentRoute = signal('');
  error$: Observable<boolean>;
  isVisible = true;

  constructor(private router: Router, private errorStore: ErrorStoreService, protected appService: AppService) {
    effect(() => {
      const theme = this.appService.userSessionData()?.user?.theme ?? 'dark-theme';
      this.applyTheme(theme);
    });
    this.error$ = this.errorStore.error$;
    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => {
      const path = this.router.parseUrl(this.router.url).root.children['primary']?.segments.map(s => s.path).join('/') || '';
      return `/${path}`;
    })).subscribe((path) => {
      this.currentRoute.set(path);
    });
  }

  shouldAnimate(): boolean {
    const route = this.currentRoute();
    return ![
      '/login',
      '/signup',
      '/reset',
      '/welcome',
      '/notification',
      '/paymentGateway'
    ].some(path => route.startsWith(path));
  }

  private applyTheme(theme: 'light-theme' | 'dark-theme'): void {
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(theme);
  }
}
