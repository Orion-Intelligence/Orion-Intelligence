import { ApplicationConfig } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations, provideNoopAnimations } from '@angular/platform-browser/animations';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { httpInterceptor } from './services/core/http.interceptor';

const isCypress = typeof window !== 'undefined' && !!(window as any).Cypress;

export const appConfig: ApplicationConfig = {
  providers: [
    AuthGuard,
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    isCypress ? provideNoopAnimations() : provideAnimations()
  ],
};
