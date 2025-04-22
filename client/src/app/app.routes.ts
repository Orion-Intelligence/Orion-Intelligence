import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { ErrorHandlerComponent } from './pages/error-handler/error-handler.component';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { DirectoryComponent } from './pages/directory/directory.component';
import { InsightResolver } from './shared/resolvers/insight.resolver';
import { DirectoryResolver } from './shared/resolvers/directory.resolver';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ReportResolver } from './shared/resolvers/report.resolver';
import { DashboardGeneralComponent } from './shared/partials/intel-panel/dashboard-general/dashboard-general.component';
import { ReportComponent } from './shared/partials/report/report_general/report.component';
import { DashboardEmailApiComponent } from './shared/partials/intel-panel/dashboard-email-api/dashboard-email-api.component';
import { DashboardDefacementComponent } from './shared/partials/intel-panel/dashboard-defacement/dashboard-defacement.component';
import { ReportDefacementComponent } from './shared/partials/report/report-defacement/report-defacement.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: { animation: 'RootPage' }
  },
  { path: 'login', component: LoginComponent, data: { animation: 'LoginPage' } }, {
    path: 'strategic',
    redirectTo: 'dashboard/strategic/all',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    data: { animation: 'DashboardPage' },
    children: [{ path: '', redirectTo: 'home', pathMatch: 'full' }, {
      path: 'home',
      component: HomepageComponent,
      resolve: { insights: InsightResolver },
      data: { animation: 'HomePage' }
    }, {
      path: 'directory',
      component: DirectoryComponent,
      resolve: { directory: DirectoryResolver },
      data: { animation: 'DirectoryPage' }
    }, {
      path: 'api',
      data: { animation: 'APIPage' },
      children: [{ path: '', redirectTo: 'email', pathMatch: 'full' }, {
        path: 'email',
        component: DashboardEmailApiComponent,
        data: { animation: 'EmailAPI' }
      }]
    }, {
      path: 'breach',
      data: { animation: 'DataBreach' },
      children: [{ path: '', redirectTo: 'all', pathMatch: 'full' }, {
        path: ':category',
        component: DashboardGeneralComponent,
        data: { type: 'Breach', animation: 'DataBreach' }
      }, {
        path: ':category/:m_hash',
        component: ReportComponent,
        resolve: { reportdata: ReportResolver },
        data: { type: 'Breach', animation: 'HashPage' }
      }]
    }, {
      path: 'strategic',
      data: { animation: 'StrategicPage' },
      children: [{ path: '', redirectTo: 'all', pathMatch: 'full' }, {
        path: ':category',
        component: DashboardGeneralComponent,
        data: { type: 'Strategic', animation: 'CategoryPage' }
      }, {
        path: ':category/:m_hash',
        component: ReportComponent,
        resolve: { reportdata: ReportResolver },
        data: { type: 'Strategic', animation: 'HashPage' }
      }]
    }, {
      path: 'defacement',
      data: { animation: 'DefacementPage' },
      children: [{ path: '', redirectTo: 'archive', pathMatch: 'full' }, {
        path: ':category',
        component: DashboardDefacementComponent,
        data: { type: 'Defacement', animation: 'CategoryPage' }
      }, {
        path: ':category/:m_hash',
        component: ReportDefacementComponent,
        resolve: { reportdata: ReportResolver },
        data: { type: 'Defacement', animation: 'HashPage' }
      }]
    }],
  },
  {
    path: '**', component: ErrorHandlerComponent, data: { animation: 'ErrorPage' }
  }];
