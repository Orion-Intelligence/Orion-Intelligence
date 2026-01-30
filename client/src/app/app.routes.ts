import { Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { InsightResolver } from './shared/resolvers/insight.resolver';
import { ReportResolver } from './shared/resolvers/report.resolver';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { HomepageComponent } from './pages/homepage/homepage.component';
import { DirectoryComponent } from './pages/directory/directory.component';
import { DashboardApiComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-api/dashboard-api.component';
import { DashboardChatsComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-chats/dashboard-chats.component';
import { DashboardGeneralComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-general/dashboard-general.component';
import { ReportComponent } from './shared/partials/report/report_general/report.component';
import { DashboardDefacementComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-defacement/dashboard-defacement.component';
import { ReportDefacementComponent } from './shared/partials/report/report-defacement/report-defacement.component';
import { ReportChatComponent } from './shared/partials/report/report-chat/report-chat.component';
import { DashboardExploitComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-exploit/dashboard-exploit.component';
import { DumpComponent } from './pages/dump/dump.component';
import { CredentialComponent } from './pages/credentials/credential.component';
import { ErrorHandlerComponent } from './shared/partials/error-handler/error-handler.component';
import { DashboardConsolidatedComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-consolidated/dashboard-consolidated.component';
import { ReportConsolidatedResolver } from './shared/resolvers/consolidated.resolver';
import { DashboardSocialsComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-social/dashboard-social.component';
import { subscriptionGuard } from './shared/guards/subscription.guard';
import { SecurityScanResultsComponent } from './shared/partials/security-scan-results/security-scan-results.component';
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
import { DashboardDiscussionComponent } from './shared/partials/intel-panel/dashboard-managers/dashboard-discussion/dashboard-discussion.component';
import { SidebarUserHomepageComponent } from './shared/partials/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component';
import { CategoryAlertReportComponent } from './shared/partials/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component';
import { AddCustomAlertComponent } from './shared/partials/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component';
import { ManageProfileComponent } from './pages/tenant/tenant-management/view-profile/manage-profile.component';
import { ViewTenantComponent } from './pages/tenant/tenant-management/view-tenant/view-tenant.component';
import { SidebarProfileSystemSettingsComponent } from './shared/partials/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component';
import { ConfigResolver } from './shared/resolvers/config.resolver';
import { TenantSettingsComponent } from './shared/partials/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component';
import { OnboardingGuard } from './shared/guards/onboarding-guar';
import {FileScannerComponent} from './shared/partials/intel-panel/ioc-extractor/file-scanner.component';
import { SocialMapperComponent } from './shared/partials/intel-panel/dashboard-managers/social-mapper/social-mapper.component';

const HASH_CONSOLIDATED_ROUTE = {
  resolve: { reportdata: ReportConsolidatedResolver },
  data: { type: 'consolidated', animation: 'HashPage' }
};

const consolidatedChildren = [
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
    data: { animation: 'WelcomePage' }
  },
  {
    path: 'welcome/:token',
    component: WelcomeComponent,
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
        component: SecurityScanResultsComponent,
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
        loadComponent: () =>
          import('./pages/graphs/graphs.component').then(m => m.GraphComponent),
        data: { animation: 'ctigraph' }
      },
      {
        path: 'social-mapper',
        component: SocialMapperComponent,
        data: { animation: 'SocialMapper' }
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
            data: { animation: 'FileAPI', type: 'file' }
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
            component: DashboardDiscussionComponent,
            data: { type: 'all', animation: 'Discussion' },
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
            component: DashboardDiscussionComponent,
            data: { animation: 'Discussion' },
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
            component: DashboardGeneralComponent,
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
            component: DashboardGeneralComponent,
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
            component: DashboardDefacementComponent,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: ':category',
            component: DashboardDefacementComponent,
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
            component: DashboardGeneralComponent,
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
            component: DashboardExploitComponent,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'tools',
            component: DashboardExploitComponent,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'zeroday',
            component: DashboardExploitComponent,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: ':category',
            component: DashboardExploitComponent,
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
            component: SecurityScanResultsComponent,
            data: { type: 'basic', animation: 'CategoryPage' }
          },
          {
            path: 'port-scan',
            component: SecurityScanResultsComponent,
            data: { type: 'advanced', animation: 'CategoryPage' }
          },
          {
            path: 'repository-scan',
            component: SecurityScanResultsComponent,
            data: { type: 'repo', animation: 'CategoryPage' }
          },
          {
            path: 'seo-scan',
            component: SecurityScanResultsComponent,
            data: { type: 'seo', animation: 'CategoryPage' }
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
