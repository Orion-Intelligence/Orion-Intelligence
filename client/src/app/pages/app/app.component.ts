import { Component, computed, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/partials/header/header.component';
import { FooterComponent } from '../../shared/partials/footer/footer.component';
import { ErrorStoreService } from '../../shared/services/error-store.service';
import { Observable, filter, map } from 'rxjs';
import { AsyncPipe, NgIf } from '@angular/common';
import { LoaderComponent } from '../../shared/partials/loader/loader.component';
import { fadeInAnimation } from './animations/app.animations';

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

  constructor(private router: Router, private errorStore: ErrorStoreService) {
    this.error$ = this.errorStore.error$;

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url)
    ).subscribe((url) => {
      this.currentRoute.set(url);
    });
  }

  showHeaderFooter = computed(() => !this.currentRoute().startsWith('/dashboard'));
}
