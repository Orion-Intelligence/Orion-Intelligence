import {Routes} from '@angular/router';
import {AuthGuard} from './shared/guards/auth-guard.guard';
import {InsightResolver} from './shared/resolvers/insight.resolver';
import {DirectoryResolver} from './shared/resolvers/directory.resolver';
import {ReportResolver} from './shared/resolvers/report.resolver';
import {DumpResolver} from './shared/resolvers/dump.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: {animation: 'RootPage'}
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    data: {animation: 'LoginPage'}
  },
  {
    path: 'loginx',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    data: {animation: 'LoginPage'}
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    data: {animation: 'DashboardPage'},
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./pages/homepage/homepage.component').then(m => m.HomepageComponent),
        resolve: {insights: InsightResolver},
        data: {animation: 'HomePage'}
      },
      {
        path: 'ctigraph',
        loadComponent: () => import('./pages/graphs/graphs.component').then(m => m.GraphComponent),
        data: {animation: 'ctigraph'}
      },
      {
        path: 'directory',
        loadComponent: () => import('./pages/directory/directory.component').then(m => m.DirectoryComponent),
        resolve: {directory: DirectoryResolver},
        data: {animation: 'DirectoryPage'}
      },
      {
        path: 'api',
        data: {animation: 'APIPage'},
        children: [
          {
            path: '',
            redirectTo: 'email',
            pathMatch: 'full'
          },
          {
            path: 'email',
            loadComponent: () => import('./shared/partials/intel-panel/dashboard-email-api/dashboard-email-api.component').then(m => m.DashboardEmailApiComponent),
            data: {animation: 'EmailAPI'}
          }
        ]
      },
      {
        path: 'breach',
        data: {animation: 'DataBreach'},
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: () => import('./shared/partials/intel-panel/dashboard-general/dashboard-general.component').then(m => m.DashboardGeneralComponent),
            data: {type: 'Breach', animation: 'DataBreach'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: () => import('./shared/partials/report/report_general/report.component').then(m => m.ReportComponent),
            resolve: {reportdata: ReportResolver},
            data: {type: 'Breach', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'strategic',
        data: {animation: 'StrategicPage'},
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: () => import('./shared/partials/intel-panel/dashboard-general/dashboard-general.component').then(m => m.DashboardGeneralComponent),
            data: {type: 'Strategic', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: () => import('./shared/partials/report/report_general/report.component').then(m => m.ReportComponent),
            resolve: {reportdata: ReportResolver},
            data: {type: 'Strategic', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'defacement',
        data: {animation: 'DefacementPage'},
        children: [
          {
            path: '',
            redirectTo: 'archive',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: () => import('./shared/partials/intel-panel/dashboard-defacement/dashboard-defacement.component').then(m => m.DashboardDefacementComponent),
            data: {type: 'Defacement', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: () => import('./shared/partials/report/report-defacement/report-defacement.component').then(m => m.ReportDefacementComponent),
            resolve: {reportdata: ReportResolver},
            data: {type: 'Defacement', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'social',
        data: {animation: 'SocialPage'},
        children: [
          {
            path: '',
            redirectTo: 'telegram',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: () => import('./shared/partials/intel-panel/dashboard-chats/dashboard-chats.component').then(m => m.DashboardChatsComponent),
            data: {type: 'Social', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: () => import('./shared/partials/report/report-chat/report-chat.component').then(m => m.ReportChatComponent),
            resolve: {reportdata: ReportResolver},
            data: {type: 'Social', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'exploit',
        data: {animation: 'ExploitPage'},
        children: [
          {
            path: '',
            redirectTo: 'cve',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: () => import('./shared/partials/intel-panel/dashboard-exploit/dashboard-exploit.component').then(m => m.DashboardExploitComponent),
            data: {type: 'Social', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: () => import('./shared/partials/report/report-exploit/report-exploit.component').then(m => m.ReportExploitComponent),
            resolve: {reportdata: ReportResolver},
            data: {type: 'Exploit', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'dump',
        data: {animation: 'DumpPage'},
        children: [
          {
            path: '',
            redirectTo: 'listing',
            pathMatch: 'full'
          },
          {
            path: 'listing',
            loadComponent: () => import('./pages/dump/dump.component').then(m => m.DumpComponent),
            resolve: {reportdata: DumpResolver},
            data: {type: 'listing', animation: 'CategoryPage'}
          },
          {
            path: 'credential',
            loadComponent: () => import('./pages/dump/credential/credential.component').then(m => m.CredentialComponent),
            data: {type: 'credential', animation: 'CategoryPage'}
          }
        ]
      }
    ]
  },
  {
    path: '**',
    loadComponent: () => import('./pages/error-handler/error-handler.component').then(m => m.ErrorHandlerComponent),
    data: {animation: 'ErrorPage'}
  }
];
