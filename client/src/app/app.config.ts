import { ApplicationConfig, inject, provideAppInitializer } from '@angular/core';
import { provideRouter, withRouterConfig } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { httpInterceptor } from './services/core/http.interceptor';
import { AppService } from './services/core/app/app.service';
import { ProxyController } from './shared/services/proxy-controller';

export const appConfig: ApplicationConfig = {
  providers: [
    AuthGuard,
    provideHttpClient(withInterceptors([httpInterceptor])),
    provideAppInitializer(() => inject(AppService).loadSession()),
    provideAppInitializer(() => inject(ProxyController).initialize()),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' })),
    provideAnimationsAsync()
  ],
};
