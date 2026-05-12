import { Route, Routes } from '@angular/router';
import { AuthGuard } from './shared/guards/auth-guard.guard';
import { InsightResolver } from './shared/resolvers/insight.resolver';
import { ReportResolver } from './shared/resolvers/report.resolver';
import { ReportConsolidatedResolver } from './shared/resolvers/consolidated.resolver';
import { subscriptionGuard } from './shared/guards/subscription.guard';
import { TenantGuard } from './shared/guards/tenant-guard.guard';
import { DashboardResolver } from './shared/resolvers/dashboard.resolver';
import { IocResolver } from './shared/resolvers/ioc.resolver';
import { ConfigResolver } from './shared/resolvers/config.resolver';
import { OnboardingGuard } from './shared/guards/onboarding-guar';
import { NotificationGuard } from './shared/guards/notification.guard';

const loadLoginComponent = () => import('./pages/login/login.component').then(m => m.LoginComponent);
const loadSignupComponent = () => import('./pages/signup/signup.component').then(m => m.SignupComponent);
const loadDashboardComponent = () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent);
const loadHomepageComponent = () => import('./pages/homepage/homepage.component').then(m => m.HomepageComponent);
const loadDirectoryComponent = () => import('./pages/directory/directory.component').then(m => m.DirectoryComponent);
const loadDashboardApiComponent = () => import('./pages/intel-panel/dashboard-api/dashboard-api.component').then(m => m.DashboardApiComponent);
const loadDashboardResultContainer = () => import('./pages/intel-panel/dashboard-result-container/dashboard-result-container.component').then(m => m.DashboardResultContainer);
const loadReportComponent = () => import('./sections/report/templates/report_general/report.component').then(m => m.ReportComponent);
const loadReportDefacementComponent = () => import('./sections/report/templates/report-defacement/report-defacement.component').then(m => m.ReportDefacementComponent);
const loadReportChatComponent = () => import('./sections/report/templates/report-chat/report-chat.component').then(m => m.ReportChatComponent);
const loadDumpComponent = () => import('./pages/dump/dump.component').then(m => m.DumpComponent);
const loadCredentialComponent = () => import('./pages/credentials/credential.component').then(m => m.CredentialComponent);
const loadErrorHandlerComponent = () => import('./shared/partials/error-handler/error-handler.component').then(m => m.ErrorHandlerComponent);
const loadDashboardConsolidatedComponent = () => import('./pages/intel-panel/dashboard-consolidated/dashboard-consolidated.component').then(m => m.DashboardConsolidatedComponent);
const loadAiWorkspaceComponent = () => import('./pages/intel-panel/ai-workspace/ai-workspace.component').then(m => m.AiWorkspaceComponent);
const loadSecurityScanComponent = () => import('./pages/security-scan/security-scan.component').then(m => m.SecurityScanComponent);
const loadTenantComponent = () => import('./pages/tenant/tenant.component').then(m => m.TenantComponent);
const loadWelcomeComponent = () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent);
const loadResetPasswordComponent = () => import('./shared/partials/forgot-password/reset-password.component').then(m => m.ResetPasswordComponent);
const loadSidebarUserStatisticsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component').then(m => m.SidebarUserStatisticsComponent);
const loadSidebarUserIocComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component').then(m => m.SidebarUserIocComponent);
const loadSidebarUserEventManagementComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-event-management/sidebar-user-event-management.component').then(m => m.SidebarUserEventManagementComponent);
const loadAuditlogComponent = () => import('./pages/admin/auditlog/auditlog.component').then(m => m.AuditlogComponent);
const loadNotificationComponent = () => import('./shared/partials/notification/notification.component').then(m => m.NotificationComponent);
const loadTrailNotificationComponent = () => import('./shared/partials/trail-notification/trail-notification.component').then(m => m.TrailNotificationComponent);
const loadAccountSettingsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/account-settings.component').then(m => m.AccountSettingsComponent);
const loadSidebarUserFeederComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/sidebar-user-feeder.component').then(m => m.SidebarUserFeederComponent);
const loadSidebarUserHomepageComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component').then(m => m.SidebarUserHomepageComponent);
const loadCategoryAlertReportComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component').then(m => m.CategoryAlertReportComponent);
const loadAddCustomAlertComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component').then(m => m.AddCustomAlertComponent);
const loadManageProfileComponent = () => import('./pages/tenant/tenant-management/view-profile/manage-profile.component').then(m => m.ManageProfileComponent);
const loadViewTenantComponent = () => import('./pages/tenant/tenant-management/view-tenant/view-tenant.component').then(m => m.ViewTenantComponent);
const loadSidebarProfileSystemSettingsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component').then(m => m.SidebarProfileSystemSettingsComponent);
const loadTenantSettingsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent);
const loadFileScannerComponent = () => import('./pages/intel-panel/ioc-extractor/file-scanner.component').then(m => m.FileScannerComponent);
const loadTextAnalysisComponent = () => import('./pages/intel-panel/text-analysis/text-analysis.component').then(m => m.TextAnalysisComponent);
const loadSocialMapperComponent = () => import('./pages/graphs/social-graph/social-mapper.component').then(m => m.SocialMapperComponent);
const loadNetworkIntelComponent = () => import('./pages/network-intel/network-intel').then(m => m.NetworkIntel);
const loadSidebarUserCaseManagement = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-case-management/sidebar-user-case-management').then(m => m.SidebarUserCaseManagement);
const loadUserProfileActivityComponent = () => import('./pages/profile/user-profile-activity/user-profile-activity.component').then(m => m.UserProfileActivityComponent);
const loadCaseDetailsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-case-management/model/case-details/case-details').then(m => m.CaseDetails);
const HASH_CONSOLIDATED_ROUTE = {
  resolve: { reportdata: ReportConsolidatedResolver },
  data: { type: 'consolidated', animation: 'HashPage' }
};
const consolidatedChildren: Route[] = [
  {
    path: '',
    redirectTo: 'all',
    pathMatch: 'full'
  },
  {
    path: 'all',
    loadComponent: loadDashboardConsolidatedComponent,
    data: { type: 'consolidated', animation: 'DataBreach' }
  },
  {
    path: 'chat/:m_hash',
    loadComponent: loadReportChatComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'social/:m_hash',
    loadComponent: loadReportChatComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'general/:m_hash',
    loadComponent: loadReportComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'leak/:m_hash',
    loadComponent: loadReportComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'exploit/:m_hash',
    loadComponent: loadReportComponent,
    ...HASH_CONSOLIDATED_ROUTE
  },
  {
    path: 'defacement/:m_hash',
    loadComponent: loadReportDefacementComponent,
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
    loadComponent: loadSignupComponent,
    data: { animation: 'SignupPage' }
  },
  {
    path: 'login',
    loadComponent: loadLoginComponent,
    data: { animation: 'LoginPage' }
  },
  {
    path: 'onboarding',
    resolve: { config: ConfigResolver },
    loadComponent: loadTenantComponent,
    canActivate: [TenantGuard],
    data: { animation: 'TenantPage' }
  },
  {
    path: 'welcome',
    loadComponent: loadWelcomeComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'WelcomePage' }
  },
  {
    path: 'welcome/:token',
    loadComponent: loadWelcomeComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'WelcomePage' }
  },
  {
    path: 'paymentGateway',
    loadComponent: loadTrailNotificationComponent,
    data: { animation: 'TrailNotificationPage' }
  },
  {
    path: 'reset',
    loadComponent: loadResetPasswordComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'ForgotPasswordComponent' }
  },
  {
    path: 'notification',
    loadComponent: loadNotificationComponent,
    data: { animation: 'PaymentGatewayComponent' }
  },
  {
    path: 'reset/:token',
    loadComponent: loadResetPasswordComponent,
    canActivate: [NotificationGuard],
    data: { animation: 'ForgotPasswordComponent' }
  },
  {
    path: 'dashboard',
    loadComponent: loadDashboardComponent,
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
        loadComponent: loadSecurityScanComponent,
        data: { animation: 'HomePage' }
      },
      {
        path: 'home',
        loadComponent: loadHomepageComponent,
        data: { animation: 'HomePage' }
      },
      {
        path: 'ctigraph',
        loadComponent: () => import('./pages/graphs/cti-graph/graphs.component').then(m => m.GraphComponent),
        data: { animation: 'ctigraph' }
      },
      {
        path: 'social-graph',
        loadComponent: loadSocialMapperComponent,
        data: { animation: 'SocialMapper' }
      },
      {
        path: 'social-intel',
        loadComponent: loadSocialMapperComponent,
        data: { animation: 'SocialMapper' }
      },
      {
        path: 'social-mapper',
        redirectTo: 'social-intel',
        pathMatch: 'full'
      },
      {
        path: 'directory',
        loadComponent: loadDirectoryComponent,
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
            loadComponent: loadDashboardApiComponent,
            data: { animation: 'EmailAPI', type: 'user' }
          },
          {
            path: 'social-scanner',
            loadComponent: loadDashboardApiComponent,
            data: { animation: 'SocialAPI', type: 'social' }
          },
          {
            path: 'wanted-list',
            loadComponent: loadDashboardApiComponent,
            data: { animation: 'WantedAPI', type: 'wanted' }
          },
          {
            path: 'national-identity',
            loadComponent: loadDashboardApiComponent,
            data: { animation: 'NationalIdentityAPI', type: 'national-identity' }
          },
          {
            path: 'playstore-scanner',
            loadComponent: loadDashboardApiComponent,
            data: { animation: 'CrackedAPI', type: 'cracked' }
          },
          {
            path: 'software-scanner',
            loadComponent: loadDashboardApiComponent,
            data: { animation: 'SoftwareAPI', type: 'software' }
          },
          {
            path: 'file-scanner',
            loadComponent: loadFileScannerComponent,
            data: {
              animation: 'FileAPI',
              type: 'filescan',
              title: 'File Analysis',
              description: 'Upload a file to extract Indicators of Compromise (IOCs)'
            }
          },
          {
            path: 'text-analysis',
            loadComponent: loadTextAnalysisComponent,
            data: {
              animation: 'TextAnalysisAPI',
              title: 'Text Analysis',
              description: 'Analyze text for spam and malicious URLs'
            }
          },
          {
            path: 'crypto-scanner',
            loadComponent: loadDashboardApiComponent,
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
            loadComponent: loadDashboardResultContainer,
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
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: ':category/social/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'Social', animation: 'Discussion' },
            pathMatch: 'full'
          },
          {
            path: 'social/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'general/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'leak/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'exploit/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: { type: 'consolidated', animation: 'HashPage' }
          },
          {
            path: 'defacement/:m_hash',
            loadComponent: loadReportDefacementComponent,
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
            loadComponent: loadDashboardResultContainer,
            data: { type: 'Breach', animation: 'DataBreach' }
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
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
            loadComponent: loadDashboardResultContainer,
            data: { type: 'strategic', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
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
            loadComponent: loadDashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: 'hacked',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: 'phishing',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: 'databases',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'defacement', animation: 'DataBreach' }
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'Defacement', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportDefacementComponent,
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
            loadComponent: loadDashboardResultContainer,
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
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'twitter',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'mastodon',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'pastebin',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'forum',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: 'reddit',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: { type: 'social', animation: 'DataBreach' }
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'Social', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportResolver },
            data: { type: 'Social', animation: 'HashPage' }
          },
          {
            path: ':category/all/:m_hash',
            loadComponent: loadReportChatComponent,
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
            loadComponent: loadDashboardResultContainer,
            data: { type: 'Feed', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
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
            loadComponent: loadDashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'tools',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'cve',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: 'zeroday',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'exploit', animation: 'DataBreach' }
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: { type: 'Social', animation: 'CategoryPage' }
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
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
            redirectTo: 'network-scan',
            pathMatch: 'full'
          },
          {
            path: 'network-scan',
            loadComponent: loadNetworkIntelComponent,
            data: { animation: 'CategoryPage' }
          },
          {
            path: 'repository-scan',
            loadComponent: loadSecurityScanComponent,
            data: { type: 'repo', animation: 'CategoryPage' }
          },
          {
            path: 'seo-scan',
            loadComponent: loadSecurityScanComponent,
            data: { type: 'seo', animation: 'CategoryPage' }
          },
          {
            path: 'apk-scan',
            loadComponent: loadFileScannerComponent,
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
            loadComponent: loadDumpComponent,
            data: { type: 'listing', animation: 'CategoryPage' }
          },
          {
            path: 'credential',
            loadComponent: loadCredentialComponent,
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
            loadComponent: loadCredentialComponent,
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
            loadComponent: loadManageProfileComponent,
            data: { type: 'view', animation: 'CategoryPage' }
          },
          {
            path: 'view-tenants',
            loadComponent: loadViewTenantComponent,
            data: { type: 'view', animation: 'CategoryPage' }
          },
          {
            path: 'auditlog',
            loadComponent: loadAuditlogComponent,
            data: { type: 'auditlog', animation: 'CategoryPage' }
          }
        ]
      },
      {
        path: 'netint',
        canActivate: [subscriptionGuard],
        loadComponent: loadNetworkIntelComponent,
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
            path: 'ai',
            loadComponent: loadAiWorkspaceComponent,
            data: { type: 'ai', animation: 'CategoryPage' }
          },
          {
            canActivate: [subscriptionGuard],
            path: 'consolidated',
            data: { animation: 'ConsolidatedPage' },
            children: consolidatedChildren
          },
          {
            path: 'alerts/:type',
            loadComponent: loadCategoryAlertReportComponent,
            data: { type: 'alert', animation: 'AlertPage' },
          },
          {
            path: 'addcustomalert',
            loadComponent: loadAddCustomAlertComponent,
            data: { type: 'alert', animation: 'AlertPage' },
          },
          {
            path: 'homepage',
            loadComponent: loadSidebarUserHomepageComponent,
            data: { type: 'homepage', animation: 'HomepagePage' },
          },
          {
            path: 'statistics',
            loadComponent: loadSidebarUserStatisticsComponent,
            resolve: { insights: InsightResolver },
            data: { type: 'settings', animation: 'ProfilePage' }
          },
          {
            path: 'ioc',
            loadComponent: loadSidebarUserIocComponent,
            data: { type: 'settings', animation: 'ProfilePage' }
          },
          {
            path: 'consolidated',
            data: { animation: 'ConsolidatedPage' },
            children: consolidatedChildren
          },
          {
            path: 'auditlog',
            loadComponent: loadAuditlogComponent,
            data: { type: 'auditlog', animation: 'CategoryPage' }
          },
          {
            path: 'users',
            loadComponent: loadManageProfileComponent,
            data: { type: 'profile', animation: 'CategoryPage' }
          },
          {
            path: 'account',
            loadComponent: loadAccountSettingsComponent,
            data: { type: 'account', animation: 'CategoryPage' }
          },
          {
            path: 'event-management',
            loadComponent: loadSidebarUserEventManagementComponent,
            data: { type: 'event-management', animation: 'CategoryPage' }
          },
          {
            path: 'feeder',
            loadComponent: loadSidebarUserFeederComponent,
            data: { type: 'feeder', animation: 'CategoryPage' }
          },
          {
            path: 'user/:user_id',
            loadComponent: loadUserProfileActivityComponent,
            data: { type: 'account', animation: 'CategoryPage' }
          },
          {
            path: 'tenant-settings',
            loadComponent: loadTenantSettingsComponent,
            data: { type: 'settings', animation: 'CategoryPage' }
          },
          {
            path: 'tenant',
            loadComponent: loadViewTenantComponent,
            data: { type: 'view', animation: 'CategoryPage' }
          },
          {
            path: 'system-settings',
            loadComponent: loadSidebarProfileSystemSettingsComponent,
            data: { type: 'srttings', animation: 'CategoryPage' }
          },
          {
            path: 'case-management',
            data: { type: 'case-management', animation: 'CategoryPage' },
            children: [
              {
                path: '',
                loadComponent: loadSidebarUserCaseManagement
              },
              {
                path: 'case-details',
                loadComponent: loadCaseDetailsComponent,
                data: { type: 'case-details', animation: 'CaseDetailsPage' }
              }
            ]
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
    loadComponent: loadErrorHandlerComponent,
    data: { animation: 'ErrorPage' }
  }
];
