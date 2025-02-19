import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../../shared/partials/header/header.component';
import { FooterComponent } from '../../shared/partials/footer/footer.component';
import { ErrorStoreService } from '../../shared/services/error-store.service';
import { Observable } from 'rxjs';
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
  error$: Observable<boolean>;
  isVisible = true;

  constructor(private errorStore: ErrorStoreService) {
    this.error$ = this.errorStore.error$;
  }

  prepareRoute(outlet: RouterOutlet) {
    return outlet?.activatedRouteData?.['animation'];
  }
}
