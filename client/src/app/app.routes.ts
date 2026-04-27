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
const loadSecurityScanComponent = () => import('./pages/security-scan/security-scan.component').then(m => m.SecurityScanComponent);
const loadTenantComponent = () => import('./pages/tenant/tenant.component').then(m => m.TenantComponent);
const loadWelcomeComponent = () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent);
const loadResetPasswordComponent = () => import('./shared/partials/forgot-password/reset-password.component').then(m => m.ResetPasswordComponent);
const loadSidebarUserStatisticsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component').then(m => m.SidebarUserStatisticsComponent);
const loadSidebarUserIocComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component').then(m => m.SidebarUserIocComponent);
const loadAuditlogComponent = () => import('./pages/admin/auditlog/auditlog.component').then(m => m.AuditlogComponent);
const loadNotificationComponent = () => import('./shared/partials/notification/notification.component').then(m => m.NotificationComponent);
const loadTrailNotificationComponent = () => import('./shared/partials/trail-notification/trail-notification.component').then(m => m.TrailNotificationComponent);
const loadAccountSettingsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/account-settings.component').then(m => m.AccountSettingsComponent);
const loadSidebarUserHomepageComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component').then(m => m.SidebarUserHomepageComponent);
const loadCategoryAlertReportComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component').then(m => m.CategoryAlertReportComponent);
const loadAddCustomAlertComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component').then(m => m.AddCustomAlertComponent);
const loadManageProfileComponent = () => import('./pages/tenant/tenant-management/view-profile/manage-profile.component').then(m => m.ManageProfileComponent);
const loadViewTenantComponent = () => import('./pages/tenant/tenant-management/view-tenant/view-tenant.component').then(m => m.ViewTenantComponent);
const loadSidebarProfileSystemSettingsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component').then(m => m.SidebarProfileSystemSettingsComponent);
const loadTenantSettingsComponent = () => import('./pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component').then(m => m.TenantSettingsComponent);
const loadFileScannerComponent = () => import('./pages/intel-panel/ioc-extractor/file-scanner.component').then(m => m.FileScannerComponent);
const loadSocialMapperComponent = () => import('./pages/graphs/social-graph/social-mapper.component').then(m => m.SocialMapperComponent);
const loadNetworkIntelComponent = () => import('./pages/network-intel/network-intel').then(m => m.NetworkIntel);
const loadUserProfileActivityComponent = () => import('./pages/profile/user-profile-activity/user-profile-activity.component').then(m => m.UserProfileActivityComponent);
const HASH_CONSOLIDATED_ROUTE = {
  resolve: { reportdata: ReportConsolidatedResolver },
  data: { type: 'consolidated', animation: 'HashPage' }
};
const consolidatedChildren :Route[] = [
  {
    path: '',
    data: { description: 'Default redirect route for this section.' },
    redirectTo: 'all',
    pathMatch: 'full'
  },
  {
    path: 'all',
    loadComponent: loadDashboardConsolidatedComponent,
    data: {type: 'consolidated', animation: 'DataBreach', description: 'All-items listing for this intelligence section.'}
  },
  {
    path: 'chat/:m_hash',
    loadComponent: loadReportChatComponent,
    ...HASH_CONSOLIDATED_ROUTE,
    data: { ...HASH_CONSOLIDATED_ROUTE.data, description: 'Chat report detail route by message hash.' }
  },
  {
    path: 'social/:m_hash',
    loadComponent: loadReportChatComponent,
    ...HASH_CONSOLIDATED_ROUTE,
    data: { ...HASH_CONSOLIDATED_ROUTE.data, description: 'Social report detail route by message hash.' }
  },
  {
    path: 'general/:m_hash',
    loadComponent: loadReportComponent,
    ...HASH_CONSOLIDATED_ROUTE,
    data: { ...HASH_CONSOLIDATED_ROUTE.data, description: 'General report detail route by message hash.' }
  },
  {
    path: 'leak/:m_hash',
    loadComponent: loadReportComponent,
    ...HASH_CONSOLIDATED_ROUTE,
    data: { ...HASH_CONSOLIDATED_ROUTE.data, description: 'Leak report detail route by message hash.' }
  },
  {
    path: 'exploit/:m_hash',
    loadComponent: loadReportComponent,
    ...HASH_CONSOLIDATED_ROUTE,
    data: { ...HASH_CONSOLIDATED_ROUTE.data, description: 'Exploit report detail route by message hash.' }
  },
  {
    path: 'defacement/:m_hash',
    loadComponent: loadReportDefacementComponent,
    ...HASH_CONSOLIDATED_ROUTE,
    data: { ...HASH_CONSOLIDATED_ROUTE.data, description: 'Defacement report detail route by message hash.' }
  }
];
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
    data: {animation: 'RootPage', description: 'Default redirect route for this section.'}
  },
  {
    path: 'signup',
    loadComponent: loadSignupComponent,
    data: {animation: 'SignupPage', description: 'User signup page for creating a new account.'}
  },
  {
    path: 'login',
    loadComponent: loadLoginComponent,
    data: {animation: 'LoginPage', description: 'User login page for authentication.'}
  },
  {
    path: 'onboarding',
    resolve: { config: ConfigResolver },
    loadComponent: loadTenantComponent,
    canActivate: [TenantGuard],
    data: {animation: 'TenantPage', description: 'Tenant onboarding flow for account setup.'}
  },
  {
    path: 'welcome',
    loadComponent: loadWelcomeComponent,
    canActivate: [NotificationGuard],
    data: {animation: 'WelcomePage', description: 'Welcome page shown after onboarding or invite.'}
  },
  {
    path: 'welcome/:token',
    loadComponent: loadWelcomeComponent,
    canActivate: [NotificationGuard],
    data: {animation: 'WelcomePage', description: 'Token-based welcome route for invited users.'}
  },
  {
    path: 'paymentGateway',
    loadComponent: loadTrailNotificationComponent,
    data: {animation: 'TrailNotificationPage', description: 'Payment gateway callback and billing status route.'}
  },
  {
    path: 'reset',
    loadComponent: loadResetPasswordComponent,
    canActivate: [NotificationGuard],
    data: {animation: 'ForgotPasswordComponent', description: 'Password reset request and update page.'}
  },
  {
    path: 'notification',
    loadComponent: loadNotificationComponent,
    data: {animation: 'PaymentGatewayComponent', description: 'Notification landing page for system events.'}
  },
  {
    path: 'reset/:token',
    loadComponent: loadResetPasswordComponent,
    canActivate: [NotificationGuard],
    data: {animation: 'ForgotPasswordComponent', description: 'Token-based password reset confirmation route.'}
  },
  {
    path: 'dashboard',
    loadComponent: loadDashboardComponent,
    canActivate: [AuthGuard],
    resolve: {
      config: ConfigResolver,
      session: DashboardResolver
    },
    data: {animation: 'DashboardPage', description: 'Main dashboard shell for authenticated users.'},
    children: [
      {
        path: '',
        data: { description: 'Default redirect route for this section.' },
        redirectTo: 'profile',
        pathMatch: 'full'
      },
      {
        path: 'scan',
        loadComponent: loadSecurityScanComponent,
        data: {animation: 'HomePage', description: 'Security scanning entry page.'}
      },
      {
        path: 'home',
        loadComponent: loadHomepageComponent,
        data: {animation: 'HomePage', description: 'Dashboard home overview and summary route.'}
      },
      {
        path: 'ctigraph',
        loadComponent: () => import('./pages/graphs/cti-graph/graphs.component').then(m => m.GraphComponent),
        data: {animation: 'ctigraph', description: 'CTI graph visualization and relationship explorer.'}
      },
      {
        path: 'social-graph',
        loadComponent: loadSocialMapperComponent,
        data: {animation: 'SocialMapper', description: 'Social graph mapping view for entities.'}
      },
      {
        path: 'social-intel',
        loadComponent: loadSocialMapperComponent,
        data: {animation: 'SocialMapper', description: 'Social intelligence analysis workspace.'}
      },
      {
        path: 'social-mapper',
        data: { description: 'Legacy social mapper redirect route.' },
        redirectTo: 'social-intel',
        pathMatch: 'full'
      },
      {
        path: 'directory',
        loadComponent: loadDirectoryComponent,
        data: {animation: 'DirectoryPage', description: 'Directory view for indexed intelligence entities.'}
      },
      {
        path: 'api',
        canActivate: [subscriptionGuard],
        data: {animation: 'APIPage', description: 'API tools and integrations route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'email-breach',
            pathMatch: 'full'
          },
          {
            path: 'email-breach',
            loadComponent: loadDashboardApiComponent,
            data: {animation: 'EmailAPI', type: 'user', description: 'Email breach lookup API page.'}
          },
          {
            path: 'social-scanner',
            loadComponent: loadDashboardApiComponent,
            data: {animation: 'SocialAPI', type: 'social', description: 'Social scanner API page for social signals.'}
          },
          {
            path: 'wanted-list',
            loadComponent: loadDashboardApiComponent,
            data: {animation: 'WantedAPI', type: 'wanted', description: 'Wanted-list intelligence API page.'}
          },
          {
            path: 'national-identity',
            loadComponent: loadDashboardApiComponent,
            data: {animation: 'NationalIdentityAPI', type: 'national-identity', description: 'National identity verification API page.'}
          },
          {
            path: 'playstore-scanner',
            loadComponent: loadDashboardApiComponent,
            data: {animation: 'CrackedAPI', type: 'cracked', description: 'Play Store and cracked app scanner page.'}
          },
          {
            path: 'software-scanner',
            loadComponent: loadDashboardApiComponent,
            data: {animation: 'SoftwareAPI', type: 'software', description: 'Software scanner page for package checks.'}
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
        data: {animation: 'Discussion', description: 'Discussion intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category/social',
            data: { description: 'Redirect route for category social subview.' },
            redirectTo: '/dashboard/discussion/:category',
            pathMatch: 'full'
          },
          {
            path: 'all',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Social', animation: 'Discussion', description: 'All-items listing for this intelligence section.'},
            pathMatch: 'full'
          },
          {
            path: ':category/chat',
            data: { description: 'Redirect route for category chat subview.' },
            redirectTo: '/dashboard/discussion/:category',
            pathMatch: 'full'
          },
          {
            path: ':category/chat/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'Category chat detail route by message hash.'}
          },
          {
            path: ':category/social/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'Category social detail route by message hash.'}
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Social', animation: 'Discussion', description: 'Category listing route for the current section.'},
            pathMatch: 'full'
          },
          {
            path: 'social/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'Social report detail route by message hash.'}
          },
          {
            path: 'general/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'General report detail route by message hash.'}
          },
          {
            path: 'leak/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'Leak report detail route by message hash.'}
          },
          {
            path: 'exploit/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'Exploit report detail route by message hash.'}
          },
          {
            path: 'defacement/:m_hash',
            loadComponent: loadReportDefacementComponent,
            resolve: { reportdata: ReportConsolidatedResolver },
            data: {type: 'consolidated', animation: 'HashPage', description: 'Defacement report detail route by message hash.'}
          },
          {
            path: '**',
            data: { description: 'Wildcard fallback route for unknown paths.' },
            redirectTo: 'all'
          }
        ]
      },
      {
        path: 'breach',
        data: {animation: 'DataBreach', description: 'Data breach intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Breach', animation: 'DataBreach', description: 'Category listing route for the current section.'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'Breach', animation: 'HashPage', description: 'Category item detail route by message hash.'}
          }
        ]
      },
      {
        path: 'strategic',
        data: {animation: 'StrategicPage', description: 'Strategic intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'strategic', animation: 'CategoryPage', description: 'Category listing route for the current section.'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'strategic', animation: 'HashPage', description: 'Category item detail route by message hash.'}
          }
        ]
      },
      {
        path: 'defacement',
        data: {animation: 'DefacementPage', description: 'Website defacement intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'defacement', animation: 'DataBreach', description: 'All-items listing for this intelligence section.'}
          },
          {
            path: 'hacked',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'defacement', animation: 'DataBreach', description: 'Hacked-site listing within defacement intelligence.'}
          },
          {
            path: 'phishing',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'defacement', animation: 'DataBreach', description: 'Phishing-related listing within defacement intelligence.'}
          },
          {
            path: 'databases',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'defacement', animation: 'DataBreach', description: 'Database exposure listing within defacement intelligence.'}
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Defacement', animation: 'CategoryPage', description: 'Category listing route for the current section.'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportDefacementComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'Defacement', animation: 'HashPage', description: 'Category item detail route by message hash.'}
          }
        ]
      },
      {
        path: 'social',
        data: {animation: 'SocialPage', description: 'Social intelligence route group and listings.'},
        children: [
          {
            path: '',
            redirectTo: 'all',
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Default redirect route for this section.'}
          },
          {
            path: 'all',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'All-items listing for this intelligence section.'}
          },
          {
            path: 'chat',
            redirectTo: '/dashboard/social/all',
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Chat-specific route or redirect for social intelligence.'}
          },
          {
            path: 'telegram',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Telegram intelligence listing.'}
          },
          {
            path: 'twitter',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Twitter intelligence listing.'}
          },
          {
            path: 'mastodon',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Mastodon intelligence listing.'}
          },
          {
            path: 'pastebin',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Pastebin intelligence listing.'}
          },
          {
            path: 'forum',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Forum intelligence listing.'}
          },
          {
            path: 'reddit',
            loadComponent: loadDashboardResultContainer,
            pathMatch: 'full',
            data: {type: 'social', animation: 'DataBreach', description: 'Reddit intelligence listing.'}
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Social', animation: 'CategoryPage', description: 'Category listing route for the current section.'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'Social', animation: 'HashPage', description: 'Category item detail route by message hash.'}
          },
          {
            path: ':category/all/:m_hash',
            loadComponent: loadReportChatComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'Social', animation: 'HashPage', description: 'Category all-feed detail route by message hash.'}
          }
        ]
      },
      {
        path: 'feed',
        data: {animation: 'FeedPage', description: 'News and feed intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'news',
            pathMatch: 'full'
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Feed', animation: 'CategoryPage', description: 'Category listing route for the current section.'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'Feed', animation: 'HashPage', description: 'Category item detail route by message hash.'}
          }
        ]
      },
      {
        path: 'exploit',
        data: {animation: 'ExploitPage', description: 'Exploit intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'all',
            pathMatch: 'full'
          },
          {
            path: 'all',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'exploit', animation: 'DataBreach', description: 'All-items listing for this intelligence section.'}
          },
          {
            path: 'tools',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'exploit', animation: 'DataBreach', description: 'Exploit tools intelligence listing.'}
          },
          {
            path: 'cve',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'exploit', animation: 'DataBreach', description: 'CVE intelligence listing.'}
          },
          {
            path: 'zeroday',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'exploit', animation: 'DataBreach', description: 'Zero-day intelligence listing.'}
          },
          {
            path: ':category',
            loadComponent: loadDashboardResultContainer,
            data: {type: 'Social', animation: 'CategoryPage', description: 'Category listing route for the current section.'}
          },
          {
            path: ':category/:m_hash',
            loadComponent: loadReportComponent,
            resolve: { reportdata: ReportResolver },
            data: {type: 'Exploit', animation: 'HashPage', description: 'Category item detail route by message hash.'}
          }
        ]
      },
      {
        canActivate: [subscriptionGuard],
        path: 'consolidated',
        data: {animation: 'ConsolidatedPage', description: 'Consolidated intelligence route group.'},
        children: consolidatedChildren
      },
      {
        canActivate: [subscriptionGuard],
        path: 'scanner',
        data: {animation: 'ScannerPage', description: 'Security scanner route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'basic-scan',
            pathMatch: 'full'
          },
          {
            path: 'basic-scan',
            loadComponent: loadSecurityScanComponent,
            data: {type: 'basic', animation: 'CategoryPage', description: 'Basic scanner mode route.'}
          },
          {
            path: 'port-scan',
            loadComponent: loadSecurityScanComponent,
            data: {type: 'advanced', animation: 'CategoryPage', description: 'Port scanner mode route.'}
          },
          {
            path: 'repository-scan',
            loadComponent: loadSecurityScanComponent,
            data: {type: 'repo', animation: 'CategoryPage', description: 'Repository scanner mode route.'}
          },
          {
            path: 'seo-scan',
            loadComponent: loadSecurityScanComponent,
            data: {type: 'seo', animation: 'CategoryPage', description: 'SEO scanner mode route.'}
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
        data: {animation: 'DumpPage', description: 'Dump intelligence route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'listing',
            pathMatch: 'full'
          },
          {
            path: 'listing',
            loadComponent: loadDumpComponent,
            data: {type: 'listing', animation: 'CategoryPage', description: 'Dump listing route for available records.'}
          },
          {
            path: 'credential',
            loadComponent: loadCredentialComponent,
            data: {type: 'credential', animation: 'CategoryPage', description: 'Credential dump listing route.'}
          }
        ]
      },
      {
        path: 'stealerlogs',
        canActivate: [subscriptionGuard],
        data: {animation: 'StealerlogsPage', description: 'Stealer logs route group for IOC review.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'iocs',
            pathMatch: 'full'
          },
          {
            path: 'iocs',
            loadComponent: loadCredentialComponent,
            data: {type: 'credential', animation: 'CategoryPage', description: 'Indicator-of-compromise listing route.'}
          }
        ]
      },
      {
        path: 'tenant',
        canActivate: [subscriptionGuard],
        data: {animation: 'TenantPage', description: 'Tenant management route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'view-profiles',
            pathMatch: 'full'
          },
          {
            path: 'view-profiles',
            loadComponent: loadManageProfileComponent,
            data: {type: 'view', animation: 'CategoryPage', description: 'Tenant profile listing and management route.'}
          },
          {
            path: 'view-tenants',
            loadComponent: loadViewTenantComponent,
            data: {type: 'view', animation: 'CategoryPage', description: 'Tenant listing and management route.'}
          },
          {
            path: 'auditlog',
            loadComponent: loadAuditlogComponent,
            data: {type: 'auditlog', animation: 'CategoryPage', description: 'Audit log route for administrative tracking.'}
          }
        ]
      },
      {
        path: 'netint',
        canActivate: [subscriptionGuard],
        loadComponent: loadNetworkIntelComponent,
        data: {animation: 'CategoryPage', description: 'Network intelligence single-page route.'}
      },
      {
        path: 'profile',
        canActivate: [subscriptionGuard, OnboardingGuard],
        resolve: { ioc: IocResolver },
        data: {animation: 'ProifilePage', description: 'User profile and settings route group.'},
        children: [
          {
            path: '',
            data: { description: 'Default redirect route for this section.' },
            redirectTo: 'homepage',
            pathMatch: 'full'
          },
          {
            canActivate: [subscriptionGuard],
            path: 'consolidated',
            data: {animation: 'ConsolidatedPage', description: 'Consolidated intelligence route group.'},
            children: consolidatedChildren
          },
          {
            path: 'alerts/:type',
            loadComponent: loadCategoryAlertReportComponent,
            data: {type: 'alert', animation: 'AlertPage', description: 'Typed alert listing route for selected alert class.'},
          },
          {
            path: 'addcustomalert',
            loadComponent: loadAddCustomAlertComponent,
            data: {type: 'alert', animation: 'AlertPage', description: 'Route for creating custom user alerts.'},
          },
          {
            path: 'homepage',
            loadComponent: loadSidebarUserHomepageComponent,
            data: {type: 'homepage', animation: 'HomepagePage', description: 'User profile homepage and personal dashboard route.'},
          },
          {
            path: 'statistics',
            loadComponent: loadSidebarUserStatisticsComponent,
            resolve: { insights: InsightResolver },
            data: {type: 'settings', animation: 'ProfilePage', description: 'User statistics and insight charts route.'}
          },
          {
            path: 'ioc',
            loadComponent: loadSidebarUserIocComponent,
            data: {type: 'settings', animation: 'ProfilePage', description: 'IOC summary route for user profile.'}
          },
          {
            path: 'consolidated',
            data: {animation: 'ConsolidatedPage', description: 'Consolidated intelligence route group.'},
            children: consolidatedChildren
          },
          {
            path: 'auditlog',
            loadComponent: loadAuditlogComponent,
            data: {type: 'auditlog', animation: 'CategoryPage', description: 'Audit log route for administrative tracking.'}
          },
          {
            path: 'users',
            loadComponent: loadManageProfileComponent,
            data: {type: 'profile', animation: 'CategoryPage', description: 'User management route for administrators.'}
          },
          {
            path: 'account',
            loadComponent: loadAccountSettingsComponent,
            data: {type: 'account', animation: 'CategoryPage', description: 'Account settings and user preferences route.'}
          },
          {
            path: 'user/:user_id',
            loadComponent: loadUserProfileActivityComponent,
            data: {type: 'account', animation: 'CategoryPage', description: 'User activity details route by user identifier.'}
          },
          {
            path: 'tenant-settings',
            loadComponent: loadTenantSettingsComponent,
            data: {type: 'settings', animation: 'CategoryPage', description: 'Tenant settings management route.'}
          },
          {
            path: 'tenant',
            loadComponent: loadViewTenantComponent,
            data: {type: 'view', animation: 'CategoryPage', description: 'Tenant management route group.'}
          },
          {
            path: 'system-settings',
            loadComponent: loadSidebarProfileSystemSettingsComponent,
            data: {type: 'srttings', animation: 'CategoryPage', description: 'System settings route for platform configuration.'}
          },
          {
            path: 'alerts',
            data: { description: 'Alerts shortcut route under profile.' },
            redirectTo: 'homepage',
            pathMatch: 'full'
          },
          {
            path: '**',
            data: { description: 'Wildcard fallback route for unknown paths.' },
            redirectTo: 'consolidated/all'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    loadComponent: loadErrorHandlerComponent,
    data: {animation: 'ErrorPage', description: 'Wildcard fallback route for unknown paths.'}
  }
];
