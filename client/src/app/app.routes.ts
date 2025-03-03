import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { ErrorHandlerComponent } from './pages/error-handler/error-handler.component';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { DirectoryComponent } from './pages/directory/directory.component';
import { InsightResolver } from './shared/resolvers/insight.resolver';
import { DirectoryResolver } from './shared/resolvers/directory.resolver';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import {
  DashboardEmailApiComponent
} from './shared/partials/dashboard/intel-panel/dashboard-api/dashboard-email-api/dashboard-email-api.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full', data: { animation: 'RootPage' } },
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { animation: 'DashboardPage' },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomepageComponent, resolve: { insights: InsightResolver }, data: { animation: 'HomePage' } },
      { path: 'api/email', component: DashboardEmailApiComponent, data: { animation: 'API/Email' } },
      { path: 'directory', component: DirectoryComponent, resolve: { directory: DirectoryResolver }, data: { animation: 'DirectoryPage' } },
    ],
  },
  { path: '**', component: ErrorHandlerComponent, data: { animation: 'ErrorPage' } }
];
