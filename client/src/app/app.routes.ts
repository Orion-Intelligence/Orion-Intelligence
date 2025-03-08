import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { ErrorHandlerComponent } from './pages/error-handler/error-handler.component';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { DirectoryComponent } from './pages/directory/directory.component';
import { InsightResolver } from './shared/resolvers/insight.resolver';
import { DirectoryResolver } from './shared/resolvers/directory.resolver';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { DashboardEmailApiComponent } from './shared/partials/intel-results/intel-panel/dashboard-api/dashboard-email-api/dashboard-email-api.component';
import { DashboardBreachComponent } from './shared/partials/intel-results/intel-panel/dashboard-breach/dashboard-breach.component';
import { DashboardGeneralComponent } from './shared/partials/intel-results/intel-panel/dashboard-general/dashboard-general.component';
import {DashboardGeneralResultGridItemComponent} from './shared/partials/intel-results/intel-panel/dashboard-results/dashboard-general-results-grid/dashboard-general-result-grid-item/dashboard-general-result-grid-item.component';
import {DashboardLeakResultGridItemComponent} from './shared/partials/intel-results/intel-panel/dashboard-results/dashboard-leak-result-grid/dashboard-leak-result-grid-item/dashboard-leak-result-grid-item.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full', data: { animation: 'RootPage' } },
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } },
  { path: 'strategic', redirectTo: 'dashboard/strategic/all', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { animation: 'DashboardPage' },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: HomepageComponent, resolve: { insights: InsightResolver }, data: { animation: 'HomePage' } },
      { path: 'directory', component: DirectoryComponent, resolve: { directory: DirectoryResolver }, data: { animation: 'DirectoryPage' } },
      {
        path: 'api',
        data: { animation: 'APIPage' },
        children: [
          { path: '', redirectTo: 'email', pathMatch: 'full' },
          { path: 'email', component: DashboardEmailApiComponent, data: { animation: 'EmailAPI' } }
        ]
      },
      {
        path: 'breach',
        data: { animation: 'DataBreach' },
        children: [
          { path: '', redirectTo: 'databases', pathMatch: 'full' },
          { path: ':category', component: DashboardBreachComponent, data: { type: 'Breach', animation: 'DataBreach' } }, // Dynamic category path
          { path: ':category/:m_hash', component: DashboardLeakResultGridItemComponent, data: { type: 'Breach', animation: 'HashPage' } } // Dynamically handle m_hash within any category
        ]
      },
      {
        path: 'strategic',
        data: { animation: 'StrategicPage' },
        children: [
          { path: '', redirectTo: 'all', pathMatch: 'full' },
          { path: ':category', component: DashboardGeneralComponent, data: { type: 'Strategic Intelligence', animation: 'CategoryPage' } },
          { path: ':category/:m_hash', component: DashboardGeneralResultGridItemComponent, data: { type: 'Strategic Intelligence', animation: 'HashPage' } }
        ]
      }
    ],
  },
  { path: '**', component: ErrorHandlerComponent, data: { animation: 'ErrorPage' } }
];
