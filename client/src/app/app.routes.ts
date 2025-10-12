import {Routes} from '@angular/router';
import {AuthGuard} from './shared/guards/auth-guard.guard';
import {InsightResolver} from './shared/resolvers/insight.resolver';
import {ReportResolver} from './shared/resolvers/report.resolver';
import {LoginComponent} from './pages/login/login.component';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {HomepageComponent} from './pages/homepage/homepage.component';
import {DirectoryComponent} from './pages/directory/directory.component';
import {DashboardApiComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-api/dashboard-api.component';
import {DashboardChatsComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-chats/dashboard-chats.component';
import {DashboardGeneralComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-general/dashboard-general.component';
import {ReportComponent} from './shared/partials/report/report_general/report.component';
import {DashboardDefacementComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-defacement/dashboard-defacement.component';
import {ReportDefacementComponent} from './shared/partials/report/report-defacement/report-defacement.component';
import {ReportChatComponent} from './shared/partials/report/report-chat/report-chat.component';
import {DashboardExploitComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-exploit/dashboard-exploit.component';
import {DumpComponent} from './pages/dump/dump.component';
import {CredentialComponent} from './pages/credentials/credential.component';
import {ErrorHandlerComponent} from './shared/partials/error-handler/error-handler.component';
import {DashboardConsolidatedComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-consolidated/dashboard-consolidated.component';
import {ReportConsolidatedResolver} from './shared/resolvers/consolidated.resolver';
import {DashboardSocialsComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-social/dashboard-social.component';
import {subscriptionGuard} from './shared/guards/subscription.guard';
import {SecurityScanResultsComponent} from './shared/partials/security-scan-results/security-scan-results.component';
import {SignupComponent} from './pages/signup/signup.component';
import {TenantComponent} from './pages/tenant/tenant.component';
import {WelcomeComponent} from './pages/welcome/welcome.component';
import {ForgotPasswordComponent} from './shared/partials/forgot-password/forgot-password.component';
import {TenantGuard} from './shared/guards/tenant-guard.guard';
import {SidebarProfileHomepageComponent} from './shared/partials/sidebar-profile/sidebar-profile-homepage/sidebar-profile-homepage.component';
import {SidebarProfileIocComponent} from './shared/partials/sidebar-profile/sidebar-profile-ioc/sidebar-profile-ioc.component';
import {RoleGuard} from './shared/guards/role-guard.guard';
import {ViewTenantComponent} from './pages/tenant/tenant-management/view-tenant/view-tenant.component';
import {AuditlogComponent} from './pages/admin/auditlog/auditlog.component';
import {DashboardResolver} from './shared/resolvers/dashboard.resolver';
import {PaymentGatewayComponent} from './shared/partials/payment-gateway/payment-gateway.component';
import {NotificationComponent} from './shared/partials/notification/notification.component';
import {TrailNotificationComponent} from './shared/partials/trail-notification/trail-notification.component';
import {SidebarProfileSettingsComponent} from './shared/partials/sidebar-profile/sidebar-profile-settings/sidebar-profile-settings.component';
import {ProfileResolver} from './shared/resolvers/profile.resolver';
import {IocResolver} from './shared/resolvers/ioc.resolver';
import {DashboardDiscussionComponent} from './shared/partials/intel-panel/dashboard-managers/dashboard-discussion/dashboard-discussion.component';

const consolidatedChildren = [
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
    component: ReportComponent,
    resolve: {reportdata: ReportConsolidatedResolver},
    data: {type: 'consolidated', animation: 'HashPage'}
  },
  {
    path: 'defacement/:m_hash',
    component: ReportDefacementComponent,
    resolve: {reportdata: ReportConsolidatedResolver},
    data: {type: 'consolidated', animation: 'HashPage'}
  }
];


export const routes: Routes = [

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: {animation: 'RootPage'}
  },
  {
    path: 'signup',
    component: SignupComponent,
    data: {animation: 'SignupPage'}
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
    path: 'onboarding',
    component: TenantComponent,
    canActivate: [TenantGuard],
    data: {animation: 'TenantPage'}
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
    data: {animation: 'WelcomePage'}
  },
  {
    path: 'welcome/:token',
    component: WelcomeComponent,
    data: {animation: 'WelcomePage'}
  },
  {
    path: 'paymentGateway',
    component: TrailNotificationComponent,
    data: {animation: 'TrailNotificationPage'}
  },
  {
    path: 'forgot',
    component: ForgotPasswordComponent,
    data: {animation: 'ForgotPasswordComponent'}
  },
  {
    path: 'notification',
    component: NotificationComponent,
    data: {animation: 'PaymentGatewayComponent'}
  },
  {
    path: 'payment',
    component: PaymentGatewayComponent,
    data: {animation: 'PaymentGatewayComponent'}
  },
  {
    path: 'forgot/:token',
    component: ForgotPasswordComponent,
    data: {animation: 'ForgotPasswordComponent'}
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    resolve: {
      session: DashboardResolver,
      profile: ProfileResolver
    },
    data: {animation: 'DashboardPage'},
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      },
      {
        path: 'scan',
        component: SecurityScanResultsComponent,
        data: {animation: 'HomePage'}
      },
      {
        path: 'home',
        component: HomepageComponent,
        canActivate: [RoleGuard],
        resolve: {insights: InsightResolver},
        data: {animation: 'HomePage'}
      },
      {
        path: 'ctigraph',
        loadComponent: () =>
          import('./pages/graphs/graphs.component').then(m => m.GraphComponent),
        data: {animation: 'ctigraph'}
      },
      {
        path: 'directory',
        component: DirectoryComponent,
        data: {animation: 'DirectoryPage'}
      },
      {
        path: 'api',
        canActivate: [subscriptionGuard],
        data: {animation: 'APIPage'},
        children: [
          {
            path: '',
            redirectTo: 'email',
            pathMatch: 'full'
          },
          {
            path: 'email',
            component: DashboardApiComponent,
            data: {animation: 'EmailAPI', type: 'user'}
          },
          {
            path: 'social',
            component: DashboardApiComponent,
            data: {animation: 'SocialAPI', type: 'social'}
          },
          {
            path: 'cracked',
            component: DashboardApiComponent,
            data: {animation: 'CrackedAPI', type: 'cracked'}
          }
        ]
      },
      {
        path: 'discussion',
        data: {animation: 'Discussion'},
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardDiscussionComponent,
            data: {type: 'all', animation: 'Discussion'},
            pathMatch: 'full'
          },
          {
            path: ':category/chat',
            redirectTo: '/dashboard/discussion/:category',
            pathMatch: 'full'
          },
          {
            path: ':category/chat/:m_hash',
            component: ReportChatComponent,
            resolve: {reportdata: ReportConsolidatedResolver},
            data: {type: 'consolidated', animation: 'HashPage'}
          },
          {
            path: ':category',
            component: DashboardDiscussionComponent,
            data: {animation: 'Discussion'},
            pathMatch: 'full'
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
            component: ReportComponent,
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
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardDefacementComponent,
            data: {type: 'exploit', animation: 'DataBreach'}
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
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardSocialsComponent,
            pathMatch: 'full'
          },
          {
            path: 'chat',
            redirectTo: '/dashboard/social/all',
            pathMatch: 'full'
          },
          {
            path: 'telegram',
            component: DashboardChatsComponent,
            pathMatch: 'full'
          },
          {
            path: 'twitter',
            component: DashboardSocialsComponent,
            pathMatch: 'full'
          },
          {
            path: 'mastodon',
            component: DashboardSocialsComponent,
            pathMatch: 'full'
          },
          {
            path: 'pastebin',
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
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardExploitComponent,
            data: {type: 'exploit', animation: 'DataBreach'}
          },
          {
            path: 'tools',
            component: DashboardExploitComponent,
            data: {type: 'exploit', animation: 'DataBreach'}
          },
          {
            path: 'zeroday',
            component: DashboardExploitComponent,
            data: {type: 'exploit', animation: 'DataBreach'}
          },
          {
            path: ':category',
            component: DashboardExploitComponent,
            data: {type: 'Social', animation: 'CategoryPage'}
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
            resolve: {reportdata: ReportResolver},
            data: {type: 'Exploit', animation: 'HashPage'}
          }
        ]
      },
      {
        path: 'consolidated',
        data: {animation: 'ConsolidatedPage'},
        children: consolidatedChildren
      },
      {
        path: 'scanner',
        data: {animation: 'ScannerPage'},
        children: [
          {
            path: '',
            redirectTo: 'basic',
            pathMatch: 'full'
          },
          {
            path: 'basic',
            component: SecurityScanResultsComponent,
            data: {type: 'basic', animation: 'CategoryPage'}
          },
          {
            path: 'full',
            component: SecurityScanResultsComponent,
            data: {type: 'advanced', animation: 'CategoryPage'}
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
        canActivate: [subscriptionGuard],
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
          },
          {
            path: 'logs',
            component: CredentialComponent,
            data: {type: 'log', animation: 'CategoryPage'}
          }
        ]
      },
      {
        path: 'tenant',
        data: {animation: 'TenantPage'},
        children: [
          {
            path: '',
            redirectTo: 'view',
            pathMatch: 'full'
          },
          {
            path: 'view',
            component: ViewTenantComponent,
            data: {type: 'view', animation: 'CategoryPage'}
          },
          {
            path: 'auditlog',
            component: AuditlogComponent,
            data: {type: 'auditlog', animation: 'CategoryPage'}
          }
        ]
      },
      {
        path: 'profile',
        data: {animation: 'ProifilePage'},
        children: [
          {
            path: '',
            redirectTo: 'dashboard',
            pathMatch: 'full'
          },
          {
            path: 'dashboard',
            children: [
              {
                path: '',
                redirectTo: 'all',
                pathMatch: 'full'
              },
              ...consolidatedChildren]
          },
          {
            path: 'statistics',
            component: SidebarProfileHomepageComponent,
            resolve: {insights: InsightResolver},
            data: {type: 'settings', animation: 'ProfilePage'}
          },
          {
            path: 'ioc',
            component: SidebarProfileIocComponent,
            resolve: {ioc: IocResolver},
            data: {type: 'settings', animation: 'ProfilePage'}
          },
          {
            path: 'consolidated',
            data: {animation: 'ConsolidatedPage'},
            children: consolidatedChildren
          },
          {
            path: 'auditlog',
            component: AuditlogComponent,
            data: {type: 'auditlog', animation: 'CategoryPage'}
          },
          {
            path: 'settings',
            component: SidebarProfileSettingsComponent,
            data: {type: 'settings', animation: 'CategoryPage'}
          }
        ]
      }
    ]
  },
  {
    path: '**',
    component: ErrorHandlerComponent,
    data: {animation: 'ErrorPage'}
  }
];
