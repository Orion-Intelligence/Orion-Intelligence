import { ApplicationConfig } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { httpInterceptor } from './services/core/http-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    AuthGuard,
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideHttpClient(withInterceptors([httpInterceptor]))
  ],
};
