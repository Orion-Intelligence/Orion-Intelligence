import { ApplicationConfig } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { httpInterceptor } from './services/interceptor/http.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    AuthGuard,
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'ignore' })),
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideAnimations()
  ],
};
