import { Component, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/partials/header/header.component';
import { FooterComponent } from '../../shared/partials/footer/footer.component';
import { ErrorStoreService } from '../../shared/services/error-store.service';
import { Observable, filter } from 'rxjs';
import { AsyncPipe, NgIf } from '@angular/common';
import { LoaderComponent } from '../../shared/partials/loader/loader.component';
import { trigger, transition, style, animate } from '@angular/animations';

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
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class AppComponent {
  private router = inject(Router);
  private errorStore = inject(ErrorStoreService);
  error$: Observable<boolean> = this.errorStore.error$;
  isVisible = true;

  currentRoute = signal(this.router.url);

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute.set(event.url);
    });
  }

  showHeaderFooter = computed(() => !this.currentRoute().startsWith('/dashboard'));
}
