import {Component, signal} from '@angular/core';
import {NavigationEnd, Router, RouterOutlet} from '@angular/router';
import {ErrorStoreService} from '../../shared/services/error-store.service';
import {filter, map, Observable} from 'rxjs';
import {NgIf} from '@angular/common';
import {LoaderComponent} from '../../shared/partials/loader/loader.component';
import {AppService} from '../../services/core/app.service';
import {appAnimation} from '../../shared/animations/app.animations';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, LoaderComponent, FormsModule, ReactiveFormsModule,],
  templateUrl: './app.component.html',
  animations: [appAnimation],
})
export class AppComponent {
  error$: Observable<boolean>;
  isVisible = true;
  currentRoute = signal('');

  constructor(private router: Router, private errorStore: ErrorStoreService, appService: AppService) {
    const theme = localStorage.getItem('theme') || 'dark-theme';
    document.body.classList.add(theme);

    appService.loadConfig();
    this.error$ = this.errorStore.error$;

    this.router.events.pipe(filter(event => event instanceof NavigationEnd), map(() => {
      const path = this.router.parseUrl(this.router.url).root.children['primary']?.segments.map(s => s.path).join('/') || '';
      return `/${path}`;
    })).subscribe((path) => {
      this.currentRoute.set(path);
    });
  }

  shouldAnimate(): boolean {
    return !this.currentRoute().startsWith('/dashboard');
  }
}
