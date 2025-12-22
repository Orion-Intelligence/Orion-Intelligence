import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { httpInterceptor } from './services/core/http.interceptor';
import { AppService } from './services/core/app/app.service';

export const appConfig: ApplicationConfig = {
  providers: [
    AuthGuard,
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideAppInitializer(() => inject(AppService).loadSession()),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideAnimations()
  ],
};
