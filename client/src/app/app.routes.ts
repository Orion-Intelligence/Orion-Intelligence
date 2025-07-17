import {Routes} from '@angular/router';
import {AuthGuard} from './shared/guards/auth-guard.guard';
import {InsightResolver} from './shared/resolvers/insight.resolver';
import {DirectoryResolver} from './shared/resolvers/directory.resolver';
import {ReportResolver} from './shared/resolvers/report.resolver';
import {DumpResolver} from './shared/resolvers/dump.resolver';
import {LoginComponent} from './pages/login/login.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {HomepageComponent} from './pages/homepage/homepage.component';
import {GraphComponent} from './pages/graphs/graphs.component';
import {DirectoryComponent} from './pages/directory/directory.component';
import {
  DashboardEmailApiComponent
} from './shared/partials/intel-panel/dashboard-email-api/dashboard-email-api.component';
import {DashboardChatsComponent} from './shared/partials/intel-panel/dashboard-chats/dashboard-chats.component';
import {DashboardGeneralComponent} from './shared/partials/intel-panel/dashboard-general/dashboard-general.component';
import {ReportComponent} from './shared/partials/report/report_general/report.component';
import {
  DashboardDefacementComponent
} from './shared/partials/intel-panel/dashboard-defacement/dashboard-defacement.component';
import {ReportDefacementComponent} from './shared/partials/report/report-defacement/report-defacement.component';
import {ReportChatComponent} from './shared/partials/report/report-chat/report-chat.component';
import {DashboardExploitComponent} from './shared/partials/intel-panel/dashboard-exploit/dashboard-exploit.component';
import {ReportExploitComponent} from './shared/partials/report/report-exploit/report-exploit.component';
import {DumpComponent} from './pages/dump/dump.component';
import {CredentialComponent} from './pages/dump/credential/credential.component';
import {ErrorHandlerComponent} from './pages/error-handler/error-handler.component';
import {
  DashboardConsolidatedComponent
} from './shared/partials/intel-panel/dashboard-consolidated/dashboard-consolidated.component';
import {ReportConsolidatedResolver} from './shared/resolvers/consolidated.resolver';
import {DashboardSocialsComponent} from './shared/partials/intel-panel/dashboard-social/dashboard-social.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: {animation: 'RootPage'}
  },
  {
    path: 'login',
    component: LoginComponent,
    data: {animation: 'LoginPage'}
  },
  {
    path: 'loginx',
    component: LoginComponent,
    data: {animation: 'LoginPage'}
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
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
        component: HomepageComponent,
        resolve: {insights: InsightResolver},
        data: {animation: 'HomePage'}
      },
      {
        path: 'ctigraph',
        component: GraphComponent,
        data: {animation: 'ctigraph'}
      },
      {
        path: 'directory',
        component: DirectoryComponent,
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
            component: DashboardEmailApiComponent,
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
            redirectTo: 'databases',
            pathMatch: 'full'
          },
          {
            path: 'email',
            component: DashboardChatsComponent,
            data: {type: 'Breach', animation: 'DataBreach'}
          },
          {
            path: 'logs',
            component: DashboardChatsComponent,
            data: {type: 'Breach', animation: 'DataBreach'}
          },
          {
            path: 'cloud',
            component: DashboardChatsComponent,
            data: {type: 'Breach', animation: 'DataBreach'}
          },
          {
            path: 'warfare',
            component: DashboardChatsComponent,
            data: {type: 'Breach', animation: 'DataBreach'}
          },
          {
            path: 'email/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Breach', animation: 'HashPage'}
          },
          {
            path: 'logs/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Breach', animation: 'HashPage'}
          },
          {
            path: 'cloud/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Breach', animation: 'HashPage'}
          },
          {
            path: 'warfare/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Breach', animation: 'HashPage'}
          },
          {
            path: ':category',
            component: DashboardGeneralComponent,
            data: {type: 'Breach', animation: 'DataBreach'}
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
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
            component: DashboardGeneralComponent,
            data: {type: 'Strategic', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
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
            redirectTo: 'hacked',
            pathMatch: 'full'
          },
          {
            path: ':category',
            component: DashboardDefacementComponent,
            data: {type: 'Defacement', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            component: ReportDefacementComponent,
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
            path: 'twitter',
            component: DashboardSocialsComponent,
            pathMatch: 'full'
          },
          {
            path: 'forum',
            component: DashboardSocialsComponent,
            pathMatch: 'full'
          },
          {
            path: 'reddit',
            component: DashboardSocialsComponent,
            pathMatch: 'full'
          },
          {
            path: ':category',
            component: DashboardChatsComponent,
            data: {type: 'Social', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Social', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'feed',
        data: {animation: 'FeedPage'},
        children: [
          {
            path: '',
            redirectTo: 'news',
            pathMatch: 'full'
          },
          {
            path: ':category',
            component: DashboardGeneralComponent,
            data: {type: 'Feed', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Feed', animation: 'HashPage'}
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
            path: 'tools',
            component: DashboardChatsComponent,
            data: {type: 'exploit', animation: 'DataBreach'}
          },
          {
            path: 'zeroday',
            component: DashboardChatsComponent,
            data: {type: 'exploit', animation: 'DataBreach'}
          },
          {
            path: ':category',
            component: DashboardExploitComponent,
            data: {type: 'Social', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            component: ReportExploitComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Exploit', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'consolidated',
        data: {animation: 'ConsolidatedPage'},
        children: [
          {
            path: 'all',
            component: DashboardConsolidatedComponent,
            data: {type: 'consolidated', animation: 'DataBreach'}
          },
          {
            path: 'chat/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
          },
          {
            path: 'social/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
          },
          {
            path: 'general/:m_hash',
            component: ReportComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
          },
          {
            path: 'leak/:m_hash',
            component: ReportComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
          },
          {
            path: 'exploit/:m_hash',
            component: ReportExploitComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
          },
          {
            path: 'defacement/:m_hash',
            component: ReportDefacementComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
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
            component: DumpComponent,
            resolve: {reportdata: DumpResolver},
            data: {type: 'listing', animation: 'CategoryPage'}
          },
          {
            path: 'credential',
            component: CredentialComponent,
            data: {type: 'credential', animation: 'CategoryPage'}
          }
        ]
      },
      {
        path: 'stealerlogs',
        data: {animation: 'StealerlogsPage'},
        children: [
          {
            path: '',
            redirectTo: 'credential',
            pathMatch: 'full'
          },
          {
            path: 'credential',
            component: CredentialComponent,
            data: {type: 'credential', animation: 'CategoryPage'}
          }
        ]
      },
    ]
  },
  {
    path: '**',
    component: ErrorHandlerComponent,
    data: {animation: 'ErrorPage'}
  }
];
