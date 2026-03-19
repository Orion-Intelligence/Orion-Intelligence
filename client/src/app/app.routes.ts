import { Route, Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { InsightResolver } from './shared/resolvers/insight.resolver';
import { ReportResolver } from './shared/resolvers/report.resolver';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { DirectoryComponent } from './pages/directory/directory.component';
import { DashboardApiComponent } from './pages/intel-panel/dashboard-api/dashboard-api.component';
import { DashboardResultContainer } from './pages/intel-panel/dashboard-result-container/dashboard-result-container.component';
import { ReportComponent } from './shared/partials/report/report_general/report.component';
import { ReportDefacementComponent } from './shared/partials/report/report-defacement/report-defacement.component';
import { ReportChatComponent } from './shared/partials/report/report-chat/report-chat.component';
import { DumpComponent } from './pages/dump/dump.component';
import { CredentialComponent } from './pages/credentials/credential.component';
import { ErrorHandlerComponent } from './shared/partials/error-handler/error-handler.component';
import { DashboardConsolidatedComponent } from './pages/intel-panel/dashboard-consolidated/dashboard-consolidated.component';
import { ReportConsolidatedResolver } from './shared/resolvers/consolidated.resolver';
import { subscriptionGuard } from './shared/guards/subscription.guard';
import { SecurityScanComponent } from './pages/security-scan/security-scan.component';
import { SignupComponent } from './pages/signup/signup.component';
import { TenantComponent } from './pages/tenant/tenant.component';
import { WelcomeComponent } from './pages/welcome/welcome.component';
import { ResetPasswordComponent } from './shared/partials/forgot-password/reset-password.component';
import { TenantGuard } from './shared/guards/tenant-guard.guard';
import { SidebarUserStatisticsComponent } from './shared/partials/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component';
import { SidebarUserIocComponent } from './shared/partials/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component';
import { AuditlogComponent } from './pages/admin/auditlog/auditlog.component';
import { DashboardResolver } from './shared/resolvers/dashboard.resolver';
import { NotificationComponent } from './shared/partials/notification/notification.component';
import { TrailNotificationComponent } from './shared/partials/trail-notification/trail-notification.component';
import { AccountSettingsComponent } from './shared/partials/sidebar-user/sidebar-user-settings/account-settings.component';
import { IocResolver } from './shared/resolvers/ioc.resolver';
import { SidebarUserHomepageComponent } from './shared/partials/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component';
import { CategoryAlertReportComponent } from './shared/partials/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component';
import { AddCustomAlertComponent } from './shared/partials/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component';
import { ManageProfileComponent } from './pages/tenant/tenant-management/view-profile/manage-profile.component';
import { ViewTenantComponent } from './pages/tenant/tenant-management/view-tenant/view-tenant.component';
import { SidebarProfileSystemSettingsComponent } from './shared/partials/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component';
import { ConfigResolver } from './shared/resolvers/config.resolver';
import { TenantSettingsComponent } from './shared/partials/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component';
import { OnboardingGuard } from './shared/guards/onboarding-guar';
import { FileScannerComponent } from './pages/intel-panel/ioc-extractor/file-scanner.component';
import { SocialMapperComponent } from './pages/graphs/social-graph/social-mapper.component';
import { NotificationGuard } from './shared/guards/notification.guard';
import { NetworkIntel } from './pages/network-intel/network-intel';
const HASH_CONSOLIDATED_ROUTE = {
  resolve: { reportdata: ReportConsolidatedResolver },
  data: { type: 'consolidated', animation: 'HashPage' }
};
const consolidatedChildren :Route[] = [
  {
    path: '',
    redirectTo: 'all',
    pathMatch: 'full'
  },
  {
    path: 'all',
    component: DashboardConsolidatedComponent,
    data: { type: 'consolidated', animation: 'DataBreach' }
  },
  {
    path: 'chat/:m_hash',
    component: ReportChatComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'social/:m_hash',
    component: ReportChatComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'general/:m_hash',
    component: ReportComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'leak/:m_hash',
    component: ReportComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'exploit/:m_hash',
    component: ReportComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'defacement/:m_hash',
    component: ReportDefacementComponent,
    ...HASH_CONSOLIDATED_ROUTE
  }
];
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: { animation: 'RootPage' }
  },
  {
    path: 'signup',
    component: SignupComponent,
    data: { animation: 'SignupPage' }
  },
  {
    path: 'login',
    resolve: { config: ConfigResolver },
    component: LoginComponent,
    data: { animation: 'LoginPage' }
  },
  {
    path: 'onboarding',
    resolve: { config: ConfigResolver },
    component: TenantComponent,
    canActivate: [TenantGuard],
    data: { animation: 'TenantPage' }
  },
  {
    path: 'welcome',
    component: WelcomeComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'WelcomePage' }
  },
  {
    path: 'welcome/:token',
    component: WelcomeComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'WelcomePage' }
  },
  {
    path: 'paymentGateway',
    component: TrailNotificationComponent,
    data: { animation: 'TrailNotificationPage' }
  },
  {
    path: 'reset',
    component: ResetPasswordComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'ForgotPasswordComponent' }
  },
  {
    path: 'notification',
    component: NotificationComponent,
    data: { animation: 'PaymentGatewayComponent' }
  },
  {
    path: 'reset/:token',
    component: ResetPasswordComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'ForgotPasswordComponent' }
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
    resolve: {
      config: ConfigResolver,
      session: DashboardResolver
    },
    data: { animation: 'DashboardPage' },
    children: [
      {
        path: '',
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'scan',
        component: SecurityScanComponent,
        data: { animation: 'HomePage' }
      },
      {
        path: 'home',
        component: HomepageComponent,
        resolve: { insights: InsightResolver },
        data: { animation: 'HomePage' }
      },
      {
        path: 'ctigraph',
        loadComponent: () => import('./pages/graphs/cti-graph/graphs.component').then(m => m.GraphComponent),
        data: { animation: 'ctigraph' }
      },
      {
        path: 'social-graph',
        component: SocialMapperComponent,
        data: { animation: 'SocialMapper' }
      },
      {
        path: 'social-intel',
        component: SocialMapperComponent,
        data: { animation: 'SocialMapper' }
      },
      {
        path: 'social-mapper',
        redirectTo: 'social-intel',
        pathMatch: 'full'
      },
      {
        path: 'directory',
        component: DirectoryComponent,
        data: { animation: 'DirectoryPage' }
      },
      {
        path: 'api',
        canActivate: [subscriptionGuard],
        data: { animation: 'APIPage' },
        children: [
          {
            path: '',
            redirectTo: 'email-breach',
            pathMatch: 'full'
          },
          {
            path: 'email-breach',
            component: DashboardApiComponent,
            data: { animation: 'EmailAPI', type: 'user' }
          },
          {
            path: 'social-scanner',
            component: DashboardApiComponent,
            data: { animation: 'SocialAPI', type: 'social' }
          },
          {
            path: 'wanted-list',
            component: DashboardApiComponent,
            data: { animation: 'WantedAPI', type: 'wanted' }
          },
          {
            path: 'national-identity',
            component: DashboardApiComponent,
            data: { animation: 'NationalIdentityAPI', type: 'national-identity' }
          },
          {
            path: 'playstore-scanner',
            component: DashboardApiComponent,
            data: { animation: 'CrackedAPI', type: 'cracked' }
          },
          {
            path: 'software-scanner',
            component: DashboardApiComponent,
            data: { animation: 'SoftwareAPI', type: 'software' }
          },
          {
            path: 'file-scanner',
            component: FileScannerComponent,
            data: {
              animation: 'FileAPI',
              type: 'filescan',
              title: 'File Analysis',
              description: 'Upload a file to extract Indicators of Compromise (IOCs)'
            }
          },
          {
            path: 'crypto-scanner',
            component: DashboardApiComponent,
            data: {
              animation: 'FileAPI',
              type: 'crypto',
              title: 'Crypto Analysis',
              description: 'provide a cryptocurrency address to extract related information and potential risks'
            }
          }
        ]
      },
      {
        path: 'discussion',
        data: { animation: 'Discussion' },
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category/social',
            redirectTo: '/dashboard/discussion/:category',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardResultContainer,
            data: { type: 'Social', animation: 'Discussion' },
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
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: ':category/social/:m_hash',
            component: ReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'Social', animation: 'Discussion' },
            pathMatch: 'full'
          },
          {
            path: 'social/:m_hash',
            component: ReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'general/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'leak/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'exploit/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'defacement/:m_hash',
            component: ReportDefacementComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: '**',
            redirectTo: 'all'
          }
        ]
      },
      {
        path: 'breach',
        data: { animation: 'DataBreach' },
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'Breach', animation: 'DataBreach' }
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Breach', animation: 'HashPage' }
          }
        ]
      },
      {
        path: 'strategic',
        data: { animation: 'StrategicPage' },
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'strategic', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'strategic', animation: 'HashPage' }
          }
        ]
      },
      {
        path: 'defacement',
        data: { animation: 'DefacementPage' },
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: 'hacked',
            component: DashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: 'phishing',
            component: DashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: 'databases',
            component: DashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'Defacement', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            component: ReportDefacementComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Defacement', animation: 'HashPage' }
          }
        ]
      },
      {
        path: 'social',
        data: { animation: 'SocialPage' },
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'all',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'chat',
            redirectTo: '/dashboard/social/all',
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'telegram',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'twitter',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'mastodon',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'pastebin',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'forum',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'reddit',
            component: DashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'Social', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            component: ReportChatComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Social', animation: 'HashPage' }
          },
          {
            path: ':category/all/:m_hash',
            component: ReportChatComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Social', animation: 'HashPage' }
          }
        ]
      },
      {
        path: 'feed',
        data: { animation: 'FeedPage' },
        children: [
          {
            path: '',
            redirectTo: 'news',
            pathMatch: 'full'
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'Feed', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Feed', animation: 'HashPage' }
          }
        ]
      },
      {
        path: 'exploit',
        data: { animation: 'ExploitPage' },
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            component: DashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'tools',
            component: DashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'cve',
            component: DashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'zeroday',
            component: DashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: ':category',
            component: DashboardResultContainer,
            data: { type: 'Social', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            component: ReportComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Exploit', animation: 'HashPage' }
          }
        ]
      },
      {
        canActivate: [subscriptionGuard],
        path: 'consolidated',
        data: { animation: 'ConsolidatedPage' },
        children: consolidatedChildren
      },
      {
        canActivate: [subscriptionGuard],
        path: 'scanner',
        data: { animation: 'ScannerPage' },
        children: [
          {
            path: '',
            redirectTo: 'basic-scan',
            pathMatch: 'full'
          },
          {
            path: 'basic-scan',
            component: SecurityScanComponent,
            data: { type: 'basic', animation: 'CategoryPage' }
          },
          {
            path: 'port-scan',
            component: SecurityScanComponent,
            data: { type: 'advanced', animation: 'CategoryPage' }
          },
          {
            path: 'repository-scan',
            component: SecurityScanComponent,
            data: { type: 'repo', animation: 'CategoryPage' }
          },
          {
            path: 'seo-scan',
            component: SecurityScanComponent,
            data: { type: 'seo', animation: 'CategoryPage' }
          },
          {
            path: 'apk-scan',
            component: FileScannerComponent,
            data: {
              animation: 'CategoryPage',
              type: 'apk',
              title: 'APK Analysis',
              description: 'Upload an Android APK to perform static analysis, extract Indicators of Compromise (IOCs), and inspect permissions and behaviors'
            }
          }
        ]
      },
      {
        canActivate: [subscriptionGuard],
        path: 'dump',
        data: { animation: 'DumpPage' },
        children: [
          {
            path: '',
            redirectTo: 'listing',
            pathMatch: 'full'
          },
          {
            path: 'listing',
            component: DumpComponent,
            data: { type: 'listing', animation: 'CategoryPage' }
          },
          {
            path: 'credential',
            component: CredentialComponent,
            data: { type: 'credential', animation: 'CategoryPage' }
          }
        ]
      },
      {
        path: 'stealerlogs',
        canActivate: [subscriptionGuard],
        data: { animation: 'StealerlogsPage' },
        children: [
          {
            path: '',
            redirectTo: 'iocs',
            pathMatch: 'full'
          },
          {
            path: 'iocs',
            component: CredentialComponent,
            data: { type: 'credential', animation: 'CategoryPage' }
          }
        ]
      },
      {
        path: 'tenant',
        canActivate: [subscriptionGuard],
        data: { animation: 'TenantPage' },
        children: [
          {
            path: '',
            redirectTo: 'view-profiles',
            pathMatch: 'full'
          },
          {
            path: 'view-profiles',
            component: ManageProfileComponent,
            data: { type: 'view', animation: 'CategoryPage' }
          },
          {
            path: 'view-tenants',
            component: ViewTenantComponent,
            data: { type: 'view', animation: 'CategoryPage' }
          },
          {
            path: 'auditlog',
            component: AuditlogComponent,
            data: { type: 'auditlog', animation: 'CategoryPage' }
          }
        ]
      },
      {
        path: 'netint',
        canActivate: [subscriptionGuard],
        component: NetworkIntel,
        data: { animation: 'CategoryPage' }
      },
      {
        path: 'profile',
        canActivate: [subscriptionGuard, OnboardingGuard],
        resolve: { ioc: IocResolver },
        data: { animation: 'ProifilePage' },
        children: [
          {
            path: '',
            redirectTo: 'homepage',
            pathMatch: 'full'
          },
          {
            canActivate: [subscriptionGuard],
            path: 'consolidated',
            data: { animation: 'ConsolidatedPage' },
            children: consolidatedChildren
          },
          {
            path: 'alerts/:type',
            component: CategoryAlertReportComponent,
            data: { type: 'alert', animation: 'AlertPage' },
          },
          {
            path: 'addcustomalert',
            component: AddCustomAlertComponent,
            data: { type: 'alert', animation: 'AlertPage' },
          },
          {
            path: 'homepage',
            component: SidebarUserHomepageComponent,
            resolve: { insights: InsightResolver },
            data: { type: 'homepage', animation: 'HomepagePage' },
          },
          {
            path: 'statistics',
            component: SidebarUserStatisticsComponent,
            resolve: { insights: InsightResolver },
            data: { type: 'settings', animation: 'ProfilePage' }
          },
          {
            path: 'ioc',
            component: SidebarUserIocComponent,
            data: { type: 'settings', animation: 'ProfilePage' }
          },
          {
            path: 'consolidated',
            data: { animation: 'ConsolidatedPage' },
            children: consolidatedChildren
          },
          {
            path: 'auditlog',
            component: AuditlogComponent,
            data: { type: 'auditlog', animation: 'CategoryPage' }
          },
          {
            path: 'users',
            component: ManageProfileComponent,
            data: { type: 'profile', animation: 'CategoryPage' }
          },
          {
            path: 'account',
            component: AccountSettingsComponent,
            data: { type: 'account', animation: 'CategoryPage' }
          },
          {
            path: 'tenant-settings',
            component: TenantSettingsComponent,
            data: { type: 'settings', animation: 'CategoryPage' }
          },
          {
            path: 'tenant',
            component: ViewTenantComponent,
            data: { type: 'view', animation: 'CategoryPage' }
          },
          {
            path: 'system-settings',
            component: SidebarProfileSystemSettingsComponent,
            data: { type: 'srttings', animation: 'CategoryPage' }
          },
          {
            path: 'alerts',
            redirectTo: 'homepage',
            pathMatch: 'full'
          },
          {
            path: '**',
            redirectTo: 'consolidated/all'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    component: ErrorHandlerComponent,
    data: { animation: 'ErrorPage' }
  }
];
