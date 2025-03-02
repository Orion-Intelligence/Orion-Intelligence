import {Component, computed, signal} from '@angular/core';
import {Router, NavigationEnd, RouterOutlet} from '@angular/router';
import {HeaderComponent} from '../../shared/partials/header/header.component';
import {FooterComponent} from '../../shared/partials/footer/footer.component';
import {ErrorStoreService} from '../../shared/services/error-store.service';
import {Observable, filter, map} from 'rxjs';
import {AsyncPipe, NgIf} from '@angular/common';
import {LoaderComponent} from '../../shared/partials/loader/loader.component';
import {fadeInAnimation} from './animations/app.animations';
import {AppService} from '../../services/core/app.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    NgIf,
    AsyncPipe,
    LoaderComponent,
  ],
  templateUrl: './app.component.html',
  animations: [fadeInAnimation],
})
export class AppComponent {
  error$: Observable<boolean>;
  isVisible = true;
  currentRoute = signal('');

  constructor(private router: Router, private errorStore: ErrorStoreService, appService:AppService) {
    appService.loadConfig()
    this.error$ = this.errorStore.error$;
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => {
        const path = this.router.parseUrl(this.router.url).root.children['primary']?.segments.map(s => s.path).join('/') || '';
        return `/${path}`; // Ensure the path starts with '/'
      })
    ).subscribe((path) => {
      this.currentRoute.set(path);
    });
  }

  showHeaderFooter = computed(() => !this.currentRoute().startsWith('/dashboard'));
}
