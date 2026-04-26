(frontend-source-reference)=

# Frontend Source Reference

This reference is generated from Angular route declarations, component metadata, injectable metadata, and HTML templates under `client/src/app`.

Generated Angular route entries: **135**.
Generated Angular artifacts: **210**.

## Angular Route Entries

| Path | Line | Load Component | Redirect | Data |
| --- | ---: | --- | --- | --- |
| `` | 59 | `-` | `all` | `-` |
| `all` | 64 | `loadDashboardConsolidatedComponent` | `-` | `type: 'consolidated', animation: 'DataBreach'` |
| `chat/:m_hash` | 69 | `loadReportChatComponent` | `-` | `-` |
| `social/:m_hash` | 74 | `loadReportChatComponent` | `-` | `-` |
| `general/:m_hash` | 79 | `loadReportComponent` | `-` | `-` |
| `leak/:m_hash` | 84 | `loadReportComponent` | `-` | `-` |
| `exploit/:m_hash` | 89 | `loadReportComponent` | `-` | `-` |
| `defacement/:m_hash` | 94 | `loadReportDefacementComponent` | `-` | `-` |
| `` | 101 | `-` | `dashboard` | `animation: 'RootPage'` |
| `signup` | 107 | `loadSignupComponent` | `-` | `animation: 'SignupPage'` |
| `login` | 112 | `loadLoginComponent` | `-` | `animation: 'LoginPage'` |
| `onboarding` | 117 | `loadTenantComponent` | `-` | `animation: 'TenantPage'` |
| `welcome` | 124 | `loadWelcomeComponent` | `-` | `animation: 'WelcomePage'` |
| `welcome/:token` | 130 | `loadWelcomeComponent` | `-` | `animation: 'WelcomePage'` |
| `paymentGateway` | 136 | `loadTrailNotificationComponent` | `-` | `animation: 'TrailNotificationPage'` |
| `reset` | 141 | `loadResetPasswordComponent` | `-` | `animation: 'ForgotPasswordComponent'` |
| `notification` | 147 | `loadNotificationComponent` | `-` | `animation: 'PaymentGatewayComponent'` |
| `reset/:token` | 152 | `loadResetPasswordComponent` | `-` | `animation: 'ForgotPasswordComponent'` |
| `dashboard` | 158 | `loadDashboardComponent` | `-` | `animation: 'DashboardPage'` |
| `` | 168 | `-` | `profile` | `-` |
| `scan` | 173 | `loadSecurityScanComponent` | `-` | `animation: 'HomePage'` |
| `home` | 178 | `loadHomepageComponent` | `-` | `animation: 'HomePage'` |
| `ctigraph` | 183 | `() => import('./pages/graphs/cti-graph/graphs.component').then(m => m.GraphComponent)` | `-` | `animation: 'ctigraph'` |
| `social-graph` | 188 | `loadSocialMapperComponent` | `-` | `animation: 'SocialMapper'` |
| `social-intel` | 193 | `loadSocialMapperComponent` | `-` | `animation: 'SocialMapper'` |
| `social-mapper` | 198 | `-` | `social-intel` | `-` |
| `directory` | 203 | `loadDirectoryComponent` | `-` | `animation: 'DirectoryPage'` |
| `api` | 208 | `-` | `-` | `animation: 'APIPage'` |
| `` | 213 | `-` | `email-breach` | `-` |
| `email-breach` | 218 | `loadDashboardApiComponent` | `-` | `animation: 'EmailAPI', type: 'user'` |
| `social-scanner` | 223 | `loadDashboardApiComponent` | `-` | `animation: 'SocialAPI', type: 'social'` |
| `wanted-list` | 228 | `loadDashboardApiComponent` | `-` | `animation: 'WantedAPI', type: 'wanted'` |
| `national-identity` | 233 | `loadDashboardApiComponent` | `-` | `animation: 'NationalIdentityAPI', type: 'national-identity'` |
| `playstore-scanner` | 238 | `loadDashboardApiComponent` | `-` | `animation: 'CrackedAPI', type: 'cracked'` |
| `software-scanner` | 243 | `loadDashboardApiComponent` | `-` | `animation: 'SoftwareAPI', type: 'software'` |
| `file-scanner` | 248 | `loadFileScannerComponent` | `-` | `animation: 'FileAPI', type: 'filescan', title: 'File Analysis', description: 'Upload a file to extract Indicators of Compromise (IOCs)'` |
| `text-analysis` | 258 | `loadTextAnalysisComponent` | `-` | `animation: 'TextAnalysisAPI', title: 'Text Analysis', description: 'Analyze text for spam and malicious URLs'` |
| `crypto-scanner` | 267 | `loadDashboardApiComponent` | `-` | `animation: 'FileAPI', type: 'crypto', title: 'Crypto Analysis', description: 'provide a cryptocurrency address to extract related information and potential risks'` |
| `discussion` | 279 | `-` | `-` | `animation: 'Discussion'` |
| `` | 283 | `-` | `all` | `-` |
| `:category/social` | 288 | `-` | `/dashboard/discussion/:category` | `-` |
| `all` | 293 | `loadDashboardResultContainer` | `-` | `type: 'Social', animation: 'Discussion'` |
| `:category/chat` | 299 | `-` | `/dashboard/discussion/:category` | `-` |
| `:category/chat/:m_hash` | 304 | `loadReportChatComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `:category/social/:m_hash` | 310 | `loadReportChatComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `:category` | 316 | `loadDashboardResultContainer` | `-` | `type: 'Social', animation: 'Discussion'` |
| `social/:m_hash` | 322 | `loadReportChatComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `general/:m_hash` | 328 | `loadReportComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `leak/:m_hash` | 334 | `loadReportComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `exploit/:m_hash` | 340 | `loadReportComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `defacement/:m_hash` | 346 | `loadReportDefacementComponent` | `-` | `type: 'consolidated', animation: 'HashPage'` |
| `**` | 352 | `-` | `all` | `-` |
| `breach` | 358 | `-` | `-` | `animation: 'DataBreach'` |
| `` | 362 | `-` | `all` | `-` |
| `:category` | 367 | `loadDashboardResultContainer` | `-` | `type: 'Breach', animation: 'DataBreach'` |
| `:category/:m_hash` | 372 | `loadReportComponent` | `-` | `type: 'Breach', animation: 'HashPage'` |
| `strategic` | 380 | `-` | `-` | `animation: 'StrategicPage'` |
| `` | 384 | `-` | `all` | `-` |
| `:category` | 389 | `loadDashboardResultContainer` | `-` | `type: 'strategic', animation: 'CategoryPage'` |
| `:category/:m_hash` | 394 | `loadReportComponent` | `-` | `type: 'strategic', animation: 'HashPage'` |
| `defacement` | 402 | `-` | `-` | `animation: 'DefacementPage'` |
| `` | 406 | `-` | `all` | `-` |
| `all` | 411 | `loadDashboardResultContainer` | `-` | `type: 'defacement', animation: 'DataBreach'` |
| `hacked` | 416 | `loadDashboardResultContainer` | `-` | `type: 'defacement', animation: 'DataBreach'` |
| `phishing` | 421 | `loadDashboardResultContainer` | `-` | `type: 'defacement', animation: 'DataBreach'` |
| `databases` | 426 | `loadDashboardResultContainer` | `-` | `type: 'defacement', animation: 'DataBreach'` |
| `:category` | 431 | `loadDashboardResultContainer` | `-` | `type: 'Defacement', animation: 'CategoryPage'` |
| `:category/:m_hash` | 436 | `loadReportDefacementComponent` | `-` | `type: 'Defacement', animation: 'HashPage'` |
| `social` | 444 | `-` | `-` | `animation: 'SocialPage'` |
| `` | 448 | `-` | `all` | `type: 'social', animation: 'DataBreach'` |
| `all` | 454 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `chat` | 460 | `-` | `/dashboard/social/all` | `type: 'social', animation: 'DataBreach'` |
| `telegram` | 466 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `twitter` | 472 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `mastodon` | 478 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `pastebin` | 484 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `forum` | 490 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `reddit` | 496 | `loadDashboardResultContainer` | `-` | `type: 'social', animation: 'DataBreach'` |
| `:category` | 502 | `loadDashboardResultContainer` | `-` | `type: 'Social', animation: 'CategoryPage'` |
| `:category/:m_hash` | 507 | `loadReportChatComponent` | `-` | `type: 'Social', animation: 'HashPage'` |
| `:category/all/:m_hash` | 513 | `loadReportChatComponent` | `-` | `type: 'Social', animation: 'HashPage'` |
| `feed` | 521 | `-` | `-` | `animation: 'FeedPage'` |
| `` | 525 | `-` | `news` | `-` |
| `:category` | 530 | `loadDashboardResultContainer` | `-` | `type: 'Feed', animation: 'CategoryPage'` |
| `:category/:m_hash` | 535 | `loadReportComponent` | `-` | `type: 'Feed', animation: 'HashPage'` |
| `exploit` | 543 | `-` | `-` | `animation: 'ExploitPage'` |
| `` | 547 | `-` | `all` | `-` |
| `all` | 552 | `loadDashboardResultContainer` | `-` | `type: 'exploit', animation: 'DataBreach'` |
| `tools` | 557 | `loadDashboardResultContainer` | `-` | `type: 'exploit', animation: 'DataBreach'` |
| `cve` | 562 | `loadDashboardResultContainer` | `-` | `type: 'exploit', animation: 'DataBreach'` |
| `zeroday` | 567 | `loadDashboardResultContainer` | `-` | `type: 'exploit', animation: 'DataBreach'` |
| `:category` | 572 | `loadDashboardResultContainer` | `-` | `type: 'Social', animation: 'CategoryPage'` |
| `:category/:m_hash` | 577 | `loadReportComponent` | `-` | `type: 'Exploit', animation: 'HashPage'` |
| `consolidated` | 586 | `-` | `-` | `animation: 'ConsolidatedPage'` |
| `scanner` | 592 | `-` | `-` | `animation: 'ScannerPage'` |
| `` | 596 | `-` | `network-scan` | `-` |
| `network-scan` | 601 | `loadNetworkIntelComponent` | `-` | `animation: 'CategoryPage'` |
| `repository-scan` | 606 | `loadSecurityScanComponent` | `-` | `type: 'repo', animation: 'CategoryPage'` |
| `seo-scan` | 611 | `loadSecurityScanComponent` | `-` | `type: 'seo', animation: 'CategoryPage'` |
| `apk-scan` | 616 | `loadFileScannerComponent` | `-` | `animation: 'CategoryPage', type: 'apk', title: 'APK Analysis', description: 'Upload an Android APK to perform static analysis, extract Indicators of Compromise (IOCs), and inspect permissions and b...` |
| `dump` | 629 | `-` | `-` | `animation: 'DumpPage'` |
| `` | 633 | `-` | `listing` | `-` |
| `listing` | 638 | `loadDumpComponent` | `-` | `type: 'listing', animation: 'CategoryPage'` |
| `credential` | 643 | `loadCredentialComponent` | `-` | `type: 'credential', animation: 'CategoryPage'` |
| `stealerlogs` | 650 | `-` | `-` | `animation: 'StealerlogsPage'` |
| `` | 655 | `-` | `iocs` | `-` |
| `iocs` | 660 | `loadCredentialComponent` | `-` | `type: 'credential', animation: 'CategoryPage'` |
| `tenant` | 667 | `-` | `-` | `animation: 'TenantPage'` |
| `` | 672 | `-` | `view-profiles` | `-` |
| `view-profiles` | 677 | `loadManageProfileComponent` | `-` | `type: 'view', animation: 'CategoryPage'` |
| `view-tenants` | 682 | `loadViewTenantComponent` | `-` | `type: 'view', animation: 'CategoryPage'` |
| `auditlog` | 687 | `loadAuditlogComponent` | `-` | `type: 'auditlog', animation: 'CategoryPage'` |
| `netint` | 694 | `loadNetworkIntelComponent` | `-` | `animation: 'CategoryPage'` |
| `profile` | 700 | `-` | `-` | `animation: 'ProifilePage'` |
| `` | 706 | `-` | `homepage` | `-` |
| `ai` | 711 | `loadAiWorkspaceComponent` | `-` | `type: 'ai', animation: 'CategoryPage'` |
| `consolidated` | 717 | `-` | `-` | `animation: 'ConsolidatedPage'` |
| `alerts/:type` | 722 | `loadCategoryAlertReportComponent` | `-` | `type: 'alert', animation: 'AlertPage'` |
| `addcustomalert` | 727 | `loadAddCustomAlertComponent` | `-` | `type: 'alert', animation: 'AlertPage'` |
| `homepage` | 732 | `loadSidebarUserHomepageComponent` | `-` | `type: 'homepage', animation: 'HomepagePage'` |
| `statistics` | 737 | `loadSidebarUserStatisticsComponent` | `-` | `type: 'settings', animation: 'ProfilePage'` |
| `ioc` | 743 | `loadSidebarUserIocComponent` | `-` | `type: 'settings', animation: 'ProfilePage'` |
| `consolidated` | 748 | `-` | `-` | `animation: 'ConsolidatedPage'` |
| `auditlog` | 753 | `loadAuditlogComponent` | `-` | `type: 'auditlog', animation: 'CategoryPage'` |
| `users` | 758 | `loadManageProfileComponent` | `-` | `type: 'profile', animation: 'CategoryPage'` |
| `account` | 763 | `loadAccountSettingsComponent` | `-` | `type: 'account', animation: 'CategoryPage'` |
| `event-management` | 768 | `loadSidebarUserEventManagementComponent` | `-` | `type: 'event-management', animation: 'CategoryPage'` |
| `feeder` | 773 | `loadSidebarUserFeederComponent` | `-` | `type: 'feeder', animation: 'CategoryPage'` |
| `user/:user_id` | 778 | `loadUserProfileActivityComponent` | `-` | `type: 'account', animation: 'CategoryPage'` |
| `tenant-settings` | 783 | `loadTenantSettingsComponent` | `-` | `type: 'settings', animation: 'CategoryPage'` |
| `tenant` | 788 | `loadViewTenantComponent` | `-` | `type: 'view', animation: 'CategoryPage'` |
| `system-settings` | 793 | `loadSidebarProfileSystemSettingsComponent` | `-` | `type: 'srttings', animation: 'CategoryPage'` |
| `alerts` | 798 | `-` | `homepage` | `-` |
| `**` | 803 | `-` | `consolidated/all` | `-` |
| `**` | 811 | `loadErrorHandlerComponent` | `-` | `animation: 'ErrorPage'` |

## Components

| Class | Selector | Source | Template | Injected Services |
| --- | --- | --- | --- | --- |
| `AuditlogListComponent` | `app-auditlog-list` | `client/src/app/pages/admin/auditlog/auditlog-list/auditlog-list.component.ts` | `./auditlog-list.component.html` | `auditService: AuditlogService`, `appService: AppService` |
| `AuditlogComponent` | `app-auditlog` | `client/src/app/pages/admin/auditlog/auditlog.component.ts` | `./auditlog.component.html` | - |
| `AppComponent` | `app-root` | `client/src/app/pages/app/app.component.ts` | `./app.component.html` | `router: Router`, `errorStore: ErrorStoreService`, `appService: AppService` |
| `CredentialListComponent` | `app-credential-list` | `client/src/app/pages/credentials/credential-list/credential-list.component.ts` | `./credential-list.component.html` | `router: Router` |
| `CredentialComponent` | `app-credential` | `client/src/app/pages/credentials/credential.component.ts` | `./credential.component.html` | `helperService: HelperService`, `router: Router`, `route: ActivatedRoute`, `cdr: ChangeDetectorRef`, `dashboardService: DashboardService`, `reportExportService: ReportExportService` |
| `ExpandedRowComponent` | `app-expanded-row` | `client/src/app/pages/credentials/expanded-row/expanded-row.component.ts` | `./expanded-row.component.html` | `rowHelper: ResultRowHelperService` |
| `PasswordSchemaComponent` | `app-password-schema` | `client/src/app/pages/credentials/password-schema/password-schema.component.ts` | `./password-schema.component.html` | `appService: AppService` |
| `SidebarSectionComponent` | `app-dashboard-sidebar-collapsed` | `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component.ts` | `./dashboard-sidebar-collapsed.component.html` | `licenseService: LicenseService`, `sidebarHomepageService: SidebarHomepageService` |
| `DashboardSidebarItemsComponent` | `app-dashboard-sidebar-items` | `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar-items/dashboard-sidebar-items.component.ts` | `./dashboard-sidebar-items.component.html` | `selectionStore: SelectionStoreService`, `licenseService: LicenseService`, `subscriptionService: SubscriptionService`, `sidebarHomepageService: SidebarHomepageService` |
| `DashboardSidebarComponent` | `app-dashboard-sidebar` | `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar.component.ts` | `./dashboard-sidebar.component.html` | `scrollService: ScrollService`, `dashboardService: DashboardService`, `selectionStore: SelectionStoreService`, `appService: AppService`, `router: Router`, `authService: AuthService` |
| `SidebarUserEventManagementComponent` | `app-sidebar-user-event-management` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-event-management/sidebar-user-event-management.component.ts` | `./sidebar-user-event-management.component.html` | `apiService: ApiService`, `appService: AppService`, `licenseService: LicenseService`, `router: Router`, `dashboardService: DashboardService`, `sidebarService: SidebarService` |
| `SidebarUserFeederAddComponent` | `app-sidebar-user-feeder-add` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/add/sidebar-user-feeder-add.component.ts` | `./sidebar-user-feeder-add.component.html` | `feederService: FeederService`, `messageNotificationService: MessageNotificationService` |
| `SidebarUserFeederOwnerDialogComponent` | `app-sidebar-user-feeder-owner-dialog` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/owner-dialog/sidebar-user-feeder-owner-dialog.component.ts` | `./sidebar-user-feeder-owner-dialog.component.html` | `feederService: FeederService`, `messageNotificationService: MessageNotificationService` |
| `SidebarUserFeederComponent` | `app-sidebar-user-feeder` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/sidebar-user-feeder.component.ts` | `./sidebar-user-feeder.component.html` | `feederService: FeederService`, `route: ActivatedRoute`, `router: Router` |
| `SidebarUserFeederViewComponent` | `app-sidebar-user-feeder-view` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/view/sidebar-user-feeder-view.component.ts` | `./sidebar-user-feeder-view.component.html` | `feederService: FeederService`, `messageNotificationService: MessageNotificationService`, `appService: AppService` |
| `AddCustomAlertComponent` | `app-add-custom-alert` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component.ts` | `./add-custom-alert.component.html` | `appService: AppService`, `apiService: ApiService`, `router: Router`, `route: ActivatedRoute`, `messageNotificationService: MessageNotificationService` |
| `AlertExportComponentComponent` | `app-alert-export-component` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-export-component/alert-export-component.component.ts` | `./alert-export-component.component.html` | - |
| `AlertScanLoadingComponent` | `app-alert-scan-loading` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-scan-loading/alert-scan-loading.component.ts` | `./alert-scan-loading.component.html` | `alertService: AlertService`, `licenseService: LicenseService`, `appService: AppService` |
| `CategoryAlertReportComponent` | `app-category-alert-report` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component.ts` | `./category-alert-report.component.html` | `router: Router`, `route: ActivatedRoute`, `appService: AppService`, `sidebarService: SidebarService`, `apiService: ApiService`, `messageNotificationService: MessageNotificationService` |
| `SidebarUserHomepageComponent` | `app-sidebar-user-homepage` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component.ts` | `./sidebar-user-homepage.component.html` | `appService: AppService`, `alertService: AlertService`, `dashboardService: DashboardService`, `router: Router`, `apiService: ApiService`, `messageNotificationService: MessageNotificationService` |
| `SidebarUserIocComponent` | `app-sidebar-user-ioc` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component.ts` | `./sidebar-user-ioc.component.html` | `apiService: ApiService`, `authService: AuthService`, `appService: AppService` |
| `AccountSettingsComponent` | `app-sidebar-profile-settings` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/account-settings.component.ts` | `./account-settings.component.html` | `apiService: ApiService`, `appService: AppService`, `licenseService: LicenseService`, `messageNotificationService: MessageNotificationService` |
| `TenantSettingsComponent` | `app-tenant-settings` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component.ts` | `./tenant-settings.component.html` | `apiService: ApiService`, `appService: AppService`, `authService: AuthService`, `licenseService: LicenseService`, `messageNotificationService: MessageNotificationService` |
| `UserImagePickerComponent` | `app-user-image-picker` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/user-image-picker/user-image-picker.component.ts` | `./user-image-picker.component.html` | - |
| `SidebarUserStatisticsComponent` | `app-sidebar-user-statistics` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component.ts` | `./sidebar-user-statistics.component.html` | - |
| `SidebarProfileSystemSettingsComponent` | `app-sidebar-user-system-settings` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component.ts` | `./sidebar-user-system-settings.component.html` | `apiService: ApiService`, `appService: AppService`, `authService: AuthService`, `messageNotificationService: MessageNotificationService` |
| `DashboardComponent` | `app-dashboard` | `client/src/app/pages/dashboard/dashboard.component.ts` | `./dashboard.component.html` | `dashboardService: DashboardService`, `cdr: ChangeDetectorRef`, `router: Router`, `authService: AuthService`, `appService: AppService` |
| `DemoTourComponent` | `app-demo-tour` | `client/src/app/pages/demo-tour/demo-tour/demo-tour.component.ts` | `./demo-tour.component.html` | `tourService: DemoTourService`, `cdr: ChangeDetectorRef`, `ngZone: NgZone` |
| `DirectoryListComponent` | `app-directory-list` | `client/src/app/pages/directory/directory-list/directory-list.component.ts` | `./directory-list.component.html` | `directoryService: DirectoryService` |
| `DirectoryComponent` | `app-directory` | `client/src/app/pages/directory/directory.component.ts` | `./directory.component.html` | `router: Router`, `route: ActivatedRoute`, `sidebarService: SidebarService`, `directoryService: DirectoryService` |
| `DumpListComponent` | `dump-list` | `client/src/app/pages/dump/dump-list/dump-list.component.ts` | `./dump-list.component.html` | `dumpService: DumpService`, `router: Router`, `route: ActivatedRoute` |
| `DumpComponent` | `app-dump` | `client/src/app/pages/dump/dump.component.ts` | `./dump.component.html` | - |
| `GraphContextMenuComponent` | `app-graph-context-menu` | `client/src/app/pages/graphs/cti-graph/context-menu/context-menu.component.ts` | `-` | - |
| `CtiSidebarComponent` | `app-cti-sidebar` | `client/src/app/pages/graphs/cti-graph/cti-sidebar/cti-sidebar.component.ts` | `-` | - |
| `ExpandToggleButtonComponent` | `app-expand-toggle-button` | `client/src/app/pages/graphs/cti-graph/expand-toggle-button/expand-toggle-button.component.ts` | `./expand-toggle-button.component.html` | - |
| `GraphComponent` | `app-graphs` | `client/src/app/pages/graphs/cti-graph/graphs.component.ts` | `./graphs.component.html` | `api: ApiService`, `clipboard: Clipboard`, `route: ActivatedRoute`, `graphReportExport: ReportExportService` |
| `SidebarComponent` | `graph-sidebar` | `client/src/app/pages/graphs/cti-graph/sidebar/sidebar.component.ts` | `./sidebar.component.html` | - |
| `GraphLoadingComponent` | `app-graph-loading` | `client/src/app/pages/graphs/shared/graph-loading/graph-loading.component.ts` | `-` | - |
| `GraphToolbarComponent` | `app-graph-toolbar` | `client/src/app/pages/graphs/shared/graph-toolbar/graph-toolbar.component.ts` | `./graph-toolbar.component.html` | - |
| `SidebarShellComponent` | `app-graph-sidebar-shell` | `client/src/app/pages/graphs/shared/sidebar-shell/sidebar-shell.component.ts` | `./sidebar-shell.component.html` | - |
| `TabBarComponent` | `app-tab-bar` | `client/src/app/pages/graphs/shared/tab-bar/tab-bar.component.ts` | `./tab-bar.component.html` | `hostElementRef: ElementRef` |
| `AddEntityModalComponent` | `app-add-entity-modal` | `client/src/app/pages/graphs/social-graph/entity-manager/add-entity-modal/add-entity-modal.component.ts` | `./add-entity-modal.component.html` | - |
| `EntityManagerComponent` | `app-entity-manager` | `client/src/app/pages/graphs/social-graph/entity-manager/entity-manager.component.ts` | `./entity-manager.component.html` | - |
| `EntityMenuComponent` | `app-entity-menu` | `client/src/app/pages/graphs/social-graph/entity-menu/entity-menu.component.ts` | `./entity-menu.component.html` | - |
| `FollowerScanPopupComponent` | `app-follower-scan-popup` | `client/src/app/pages/graphs/social-graph/follower-scan-popup/follower-scan-popup.component.ts` | `./follower-scan-popup.component.html` | - |
| `GraphSearchTriggerComponent` | `app-graph-search-trigger` | `client/src/app/pages/graphs/social-graph/graph-search-trigger/graph-search-trigger.component.ts` | `./graph-search-trigger.component.html` | - |
| `HomeMenuComponent` | `app-home-menu` | `client/src/app/pages/graphs/social-graph/home-menu/home-menu.component.ts` | `./home-menu.component.html` | - |
| `ListViewComponent` | `app-list-view` | `client/src/app/pages/graphs/social-graph/list-view/list-view.component.ts` | `./list-view.component.html` | - |
| `MetadataPopupComponent` | `app-metadata-popup` | `client/src/app/pages/graphs/social-graph/metadata-popup/metadata-popup.component.ts` | `./metadata-popup.component.html` | - |
| `ContextMenuComponent` | `app-context-menu` | `client/src/app/pages/graphs/social-graph/network-graph/context-menu/context-menu.component.ts` | `./context-menu.component.html` | - |
| `NetworkGraphComponent` | `app-network-graph` | `client/src/app/pages/graphs/social-graph/network-graph/network-graph.component.ts` | `./network-graph.component.html` | - |
| `NotificationBarComponent` | `app-notification-bar` | `client/src/app/pages/graphs/social-graph/notification-bar/notification-bar.component.ts` | `./notification-bar.component.html` | - |
| `ManageProfilesModalComponent` | `app-manage-profiles-modal` | `client/src/app/pages/graphs/social-graph/profile-summary-popup/manage-profiles-modal/manage-profiles-modal.component.ts` | `./manage-profiles-modal.component.html` | - |
| `ProfileSummaryPopupComponent` | `app-profile-summary-popup` | `client/src/app/pages/graphs/social-graph/profile-summary-popup/profile-summary-popup.component.ts` | `./profile-summary-popup.component.html` | - |
| `SummaryAllPlatformsViewComponent` | `app-summary-all-platforms-view` | `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-all-platforms-view/summary-all-platforms-view.component.ts` | `./summary-all-platforms-view.component.html` | - |
| `SummaryPlatformViewComponent` | `app-summary-platform-view` | `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-platform-view/summary-platform-view.component.ts` | `./summary-platform-view.component.html` | - |
| `RelationshipDetailsPopupComponent` | `app-relationship-details-popup` | `client/src/app/pages/graphs/social-graph/relationship-details-popup/relationship-details-popup.component.ts` | `./relationship-details-popup.component.html` | - |
| `SocialMapperComponent` | `app-social-graph` | `client/src/app/pages/graphs/social-graph/social-mapper.component.ts` | `./social-mapper.component.html` | `scanService: SocialScanService`, `destroyRef: DestroyRef`, `tabManager: TabManagerService`, `fetchingState: FetchingStateService`, `graphOrchestrator: GraphOrchestratorService`, `scanJobService: SocialScanJobService` |
| `HomeInsightComponent` | `app-home-insight` | `client/src/app/pages/homepage/home-insight/home-insight.component.ts` | `./home-insight.component.html` | `router: Router`, `route: ActivatedRoute`, `appService: AppService`, `licenseService: LicenseService`, `insightCacheService: InsightCacheService` |
| `HomeSearchComponent` | `app-home-search` | `client/src/app/pages/homepage/home-search/home-search.component.ts` | `./home-search.component.html` | `dashboardService: DashboardService`, `route: ActivatedRoute`, `router: Router`, `app_service: AppService`, `authService: AuthService`, `licenseService: LicenseService` |
| `HomepageComponent` | `app-index` | `client/src/app/pages/homepage/homepage.component.ts` | `./homepage.component.html` | `router: Router`, `authService: AuthService`, `licenseService: LicenseService`, `appService: AppService` |
| `SearchFiltersComponent` | `app-search-filters` | `client/src/app/pages/homepage/search-filters/search-filters.component.ts` | `./search-filters.component.html` | `helperService: HelperService`, `app_service: AppService`, `suggestionService: SuggestionService` |
| `SelectedFilterBarComponent` | `app-selected-filter-bar` | `client/src/app/pages/homepage/selected-filter-bar/selected-filter-bar.component.ts` | `./selected-filter-bar.component.html` | `app_service: AppService`, `dashboardService: DashboardService`, `router: Router` |
| `HeatmapReportComponent` | `app-heatmap-report` | `client/src/app/pages/homepage/world-heatmap/heatmap-report/heatmap-report.component.ts` | `./heatmap-report.component.html` | - |
| `WorldHeatmapComponent` | `app-world-heatmap` | `client/src/app/pages/homepage/world-heatmap/world-heatmap.component.ts` | `./world-heatmap.component.html` | `route: ActivatedRoute`, `appService: AppService`, `apiService: ApiService`, `insightCacheService: InsightCacheService` |
| `AiSummaryComponent` | `app-ai-summary` | `client/src/app/pages/intel-panel/ai-workspace/ai-summary/ai-summary.component.ts` | `./ai-summary.component.html` | - |
| `AiWorkspaceComponent` | `app-ai-workspace` | `client/src/app/pages/intel-panel/ai-workspace/ai-workspace.component.ts` | `./ai-workspace.component.html` | - |
| `ChatWidgetComponent` | `app-chat-widget` | `client/src/app/pages/intel-panel/ai-workspace/chat-widget/chat-widget.component.ts` | `./chat-widget.component.html` | `appService: AppService`, `dashboardService: DashboardService`, `cdr: ChangeDetectorRef`, `zone: NgZone`, `subscriptionService: SubscriptionService`, `nexusChatService: NexusChatService` |
| `DashboardApiComponent` | `app-dashboard-api` | `client/src/app/pages/intel-panel/dashboard-api/dashboard-api.component.ts` | `./dashboard-api.component.html` | `route: ActivatedRoute`, `http: HttpClient`, `graphReportExport: ReportExportService` |
| `ConsolidatedIocComponent` | `app-consolidated-ioc` | `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-ioc/consolidated-ioc.component.ts` | `./consolidated-ioc.component.html` | - |
| `ConsolidatedScanComponent` | `app-consolidated-scan` | `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-scan/consolidated-scan.component.ts` | `./consolidated-scan.component.html` | `api: ConsolidatedApiService` |
| `DashboardConsolidatedComponent` | `app-dashboard-consolidated` | `client/src/app/pages/intel-panel/dashboard-consolidated/dashboard-consolidated.component.ts` | `./dashboard-consolidated.component.html` | `http: HttpClient`, `appService: AppService`, `dashboardService: DashboardService`, `router: Router`, `route: ActivatedRoute`, `cdr: ChangeDetectorRef` |
| `ThreatResultsComponent` | `app-defacement-results` | `client/src/app/pages/intel-panel/dashboard-consolidated/defacement-results/threat-results.component.ts` | `./threat-results.component.html` | `helperService: HelperService`, `dashboardService: DashboardService`, `rowHelper: ResultRowHelperService` |
| `DashboardResultContainer` | `app-dashboard-result-container` | `client/src/app/pages/intel-panel/dashboard-result-container/dashboard-result-container.component.ts` | `./dashboard-result-container.component.html` | `helperService: HelperService`, `appService: AppService`, `dashboardService: DashboardService`, `router: Router`, `route: ActivatedRoute`, `cdr: ChangeDetectorRef` |
| `DashboardResultChatComponent` | `app-dashboard-result-chat` | `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-chat/dashboard-result-chat.component.ts` | `./dashboard-result-chat.component.html` | `authService: AuthService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService` |
| `DashboardResultDefacementComponent` | `app-dashboard-result-defacement` | `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-defacement/dashboard-result-defacement.component.ts` | `./dashboard-result-defacement.component.html` | `authService: AuthService`, `appService: AppService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService` |
| `DashboardResultExploitComponent` | `app-dashboard-result-exploit` | `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component.ts` | `./dashboard-result-exploit.component.html` | `authService: AuthService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService` |
| `DashboardResultSocialComponent` | `app-dashboard-result-social` | `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-social/dashboard-result-social.component.ts` | `./dashboard-result-social.component.html` | `authService: AuthService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService` |
| `DashboardResultsGeneralComponent` | `app-dashboard-results-general-grid` | `client/src/app/pages/intel-panel/dashboard-results/dashboard-results-general-grid/dashboard-results-general.component.ts` | `./dashboard-results-general.component.html` | `authService: AuthService`, `activatedRoute: ActivatedRoute`, `helperService: HelperService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService` |
| `FileScannerComponent` | `app-ioc-extractor` | `client/src/app/pages/intel-panel/ioc-extractor/file-scanner.component.ts` | `./file-scanner.component.html` | `api: ApiService`, `route: ActivatedRoute`, `router: Router` |
| `ResultInsightsComponent` | `app-result-insights` | `client/src/app/pages/intel-panel/result-insights/result-insights.component.ts` | `./result-insights.component.html` | - |
| `TextAnalysisComponent` | `app-text-analysis` | `client/src/app/pages/intel-panel/text-analysis/text-analysis.component.ts` | `./text-analysis.component.html` | `http: HttpClient`, `route: ActivatedRoute`, `router: Router` |
| `LoginContainerComponent` | `app-login-container` | `client/src/app/pages/login/login-container/login-container.component.ts` | `./login-container.component.html` | `authService: AuthService`, `router: Router`, `appService: AppService`, `route: ActivatedRoute` |
| `LoginComponent` | `app-login-header` | `client/src/app/pages/login/login.component.ts` | `./login.component.html` | - |
| `DnsSectionComponent` | `app-network-intel-dns-section` | `client/src/app/pages/network-intel/dns-section/dns-section.component.ts` | `./dns-section.component.html` | `router: Router`, `ui: ScanHelperMethodsService` |
| `IpDetailComponent` | `app-ip-detail` | `client/src/app/pages/network-intel/ip-detail/ip-detail.component.ts` | `./ip-detail.component.html` | `ui: ScanHelperMethodsService`, `sanitizer: DomSanitizer` |
| `GeoCoordinatesModalComponent` | `app-geo-coordinates-modal` | `client/src/app/pages/network-intel/modal/geo-coordinates-modal/geo-coordinates-modal.component.ts` | `./geo-coordinates-modal.component.html` | `appService: AppService` |
| `NetworkIntel` | `app-network-intel` | `client/src/app/pages/network-intel/network-intel.ts` | `./network-intel.html` | `scanHelper: ScanHelperMethodsService`, `route: ActivatedRoute`, `router: Router`, `reportExport: ReportExportService` |
| `ShodanSectionComponent` | `app-network-intel-shodan-section` | `client/src/app/pages/network-intel/shodan-section/shodan-section.component.ts` | `./shodan-section.component.html` | `router: Router`, `ui: ScanHelperMethodsService` |
| `VulnerabilitySectionComponent` | `app-network-intel-vulnerability-section` | `client/src/app/pages/network-intel/vulnerability-section/vulnerability-section.component.ts` | `./vulnerability-section.component.html` | `router: Router`, `ui: ScanHelperMethodsService` |
| `UserProfileActivityComponent` | `app-user-profile-activity` | `client/src/app/pages/profile/user-profile-activity/user-profile-activity.component.ts` | `./user-profile-activity.component.html` | - |
| `SecurityScanExportComponentComponent` | `app-security-scan-export-component` | `client/src/app/pages/security-scan/security-scan-export-component/security-scan-export-component.component.ts` | `./security-scan-export-component.component.html` | `helperService: HelperService` |
| `SecurityScanComponent` | `app-security-scan` | `client/src/app/pages/security-scan/security-scan.component.ts` | `./security-scan.component.html` | `router: Router`, `route: ActivatedRoute`, `scanner: ScannerService`, `graphReportExport: ReportExportService`, `scanHelperMethodsService: ScanHelperMethodsService` |
| `SignupComponent` | `app-signup` | `client/src/app/pages/signup/signup.component.ts` | `./signup.component.html` | `router: Router`, `auth_service: AuthService`, `route: ActivatedRoute`, `appService: AppService` |
| `AddTenantComponent` | `app-add-tenant` | `client/src/app/pages/tenant/tenant-management/add-tenant/add-tenant.component.ts` | `./add-tenant.component.html` | `apiService: ApiService`, `appService: AppService`, `licenseService: LicenseService` |
| `ManageProfileComponent` | `app-view-profile` | `client/src/app/pages/tenant/tenant-management/view-profile/manage-profile.component.ts` | `./manage-profile.component.html` | `apiService: ApiService`, `appService: AppService`, `nodeResolver: NodeResolver`, `licenseService: LicenseService` |
| `ViewTenantComponent` | `app-view-tenant` | `client/src/app/pages/tenant/tenant-management/view-tenant/view-tenant.component.ts` | `./view-tenant.component.html` | `apiService: ApiService`, `licenseService: LicenseService` |
| `TenantComponent` | `app-tenant` | `client/src/app/pages/tenant/tenant.component.ts` | `./tenant.component.html` | `router: Router`, `apiService: ApiService`, `appService: AppService` |
| `WelcomeComponent` | `app-welcome` | `client/src/app/pages/welcome/welcome.component.ts` | `./welcome.component.html` | `router: Router`, `route: ActivatedRoute`, `apiService: ApiService`, `appService: AppService` |
| `ReportFeedbackCommentsComponent` | `app-report-feedback-comments` | `client/src/app/sections/report/social-interactions/report-feedback-comments/report-feedback-comments.component.ts` | `./report-feedback-comments.component.html` | - |
| `ReportFeedbackComponent` | `app-report-feedback` | `client/src/app/sections/report/social-interactions/report-feedback/report-feedback.component.ts` | `./report-feedback.component.html` | - |
| `ReportInteractionHostComponent` | `app-report-interaction-host` | `client/src/app/sections/report/social-interactions/report-interaction-host/report-interaction-host.component.ts` | `./report-interaction-host.component.html` | `dashboardService: DashboardService` |
| `ReportUserSidebarComponent` | `app-report-user-sidebar` | `client/src/app/sections/report/social-interactions/report-user-sidebar/report-user-sidebar.component.ts` | `./report-user-sidebar.component.html` | - |
| `ReportChatComponent` | `app-report-chat` | `client/src/app/sections/report/templates/report-chat/report-chat.component.ts` | `./report-chat.component.html` | `appService: AppService`, `route: ActivatedRoute`, `authService: AuthService`, `dashboardService: DashboardService`, `router: Router`, `scrollService: ScrollService` |
| `ReportDefacementComponent` | `app-report-defacement` | `client/src/app/sections/report/templates/report-defacement/report-defacement.component.ts` | `./report-defacement.component.html` | `route: ActivatedRoute`, `appService: AppService`, `scrollService: ScrollService`, `elementRef: ElementRef` |
| `ReportComponent` | `app-result-panel` | `client/src/app/sections/report/templates/report_general/report.component.ts` | `./report.component.html` | `api: ApiService`, `cdr: ChangeDetectorRef`, `dashboardService: DashboardService`, `route: ActivatedRoute`, `helperService: HelperService`, `appService: AppService` |
| `SocialIconComponent` | `app-social-icon` | `client/src/app/shared/components/social-icon/social-icon.component.ts` | `-` | - |
| `AlertNotificationComponent` | `app-alert-notification` | `client/src/app/shared/partials/alert-notification/alert-notification.component.ts` | `./alert-notification.component.html` | `appService: AppService`, `apiService: ApiService`, `messageNotificationService: MessageNotificationService`, `alertExportService: AlertExportService` |
| `CodeBlockComponent` | `app-code-block` | `client/src/app/shared/partials/code-block/code-block.component.ts` | `./code-block.component.html` | - |
| `ConfirmationPopupComponent` | `app-confirmation-popup` | `client/src/app/shared/partials/confirmation-popup/confirmation-popup.component.ts` | `./confirmation-popup.component.html` | - |
| `EmptyQueryComponent` | `app-empty-query` | `client/src/app/shared/partials/empty-query/empty-query.component.ts` | `./empty-query.component.html` | - |
| `EmptyResultComponent` | `app-empty-result` | `client/src/app/shared/partials/empty-result/empty-result.component.ts` | `./empty-result.component.html` | - |
| `ErrorHandlerComponent` | `app-error-handler` | `client/src/app/shared/partials/error-handler/error-handler.component.ts` | `./error-handler.component.html` | - |
| `ExportChoiceModalComponent` | `app-export-choice-modal` | `client/src/app/shared/partials/export-choice-modal/export-choice-modal.component.ts` | `./export-choice-modal.component.html` | - |
| `DatePickerComponent` | `app-date-picker` | `client/src/app/shared/partials/filters/date-picker/date-picker.component.ts` | `./date-picker.component.html` | - |
| `FiltersComponent` | `app-filters` | `client/src/app/shared/partials/filters/filters.component.ts` | `./filters.component.html` | `dashboard: DashboardService`, `scrollService: ScrollService` |
| `ResetPasswordComponent` | `app-forgot-password` | `client/src/app/shared/partials/forgot-password/reset-password.component.ts` | `./reset-password.component.html` | `router: Router`, `route: ActivatedRoute`, `auth_service: AuthService` |
| `DashboardHeaderComponent` | `app-dashboard-header` | `client/src/app/shared/partials/header/dashboard-header/dashboard-header.component.ts` | `./dashboard-header.component.html` | `authService: AuthService`, `router: Router`, `appService: AppService` |
| `HeaderComponent` | `app-header` | `client/src/app/shared/partials/header/login-header/header.component.ts` | `./header.component.html` | `appService: AppService` |
| `IocSearchComponent` | `app-ioc-search` | `client/src/app/shared/partials/ioc-search/ioc-search.component.ts` | `./ioc-search.component.html` | `sidebarService: SidebarService`, `route: ActivatedRoute` |
| `JsonApiViewerComponent` | `app-json-api-viewer` | `client/src/app/shared/partials/json-api-viewer/json-api-viewer.component.ts` | `./json-api-viewer.component.html` | - |
| `JsonViewerComponent` | `app-json-viewer` | `client/src/app/shared/partials/json-api-viewer/json-viewer/json-viewer.component.ts` | `./json-viewer.component.html` | - |
| `LoaderComponent` | `app-loader` | `client/src/app/shared/partials/loader/loader.component.ts` | `./loader.component.html` | `loadingService: LoadingService` |
| `LoadingFormComponent` | `app-loading-form` | `client/src/app/shared/partials/loading-form/loading-form.component.ts` | `./loading-form.component.html` | - |
| `MessageNotificationComponent` | `app-message-notification` | `client/src/app/shared/partials/message-notification/message-notification.component.ts` | `./message-notification.component.html` | `notificationService: MessageNotificationService` |
| `MessagePopupComponent` | `app-message-popup` | `client/src/app/shared/partials/message-popup/message-popup.component.ts` | `./message-popup.component.html` | - |
| `NotificationComponent` | `app-notification` | `client/src/app/shared/partials/notification/notification.component.ts` | `./notification.component.html` | `router: Router` |
| `CrossSearchCardComponent` | `app-cross-search-card` | `client/src/app/shared/partials/onion-search-engine/cross-search-card.component.ts` | `./cross-search-card.component.html` | `http: HttpClient` |
| `PaginationComponent` | `app-pagination` | `client/src/app/shared/partials/pagination/pagination.component.ts` | `./pagination.component.html` | `appService: AppService` |
| `ProSubscriptionComponent` | `app-pro-subscription` | `client/src/app/shared/partials/pro-subscription/pro-subscription.component.ts` | `./pro-subscription.component.html` | `api: ApiService`, `router: Router` |
| `ProfileComponent` | `app-profile` | `client/src/app/shared/partials/profile/profile.component.ts` | `./profile.component.html` | `authService: AuthService`, `router: Router`, `dashboardService: DashboardService`, `appService: AppService`, `licenseService: LicenseService` |
| `ReportHeaderComponent` | `app-report-header` | `client/src/app/shared/partials/report-header/report-header.component.ts` | `./report-header.component.html` | `helperService: HelperService`, `api: ApiService`, `appService: AppService`, `dashboardService: DashboardService`, `route: Router`, `licenseServise: LicenseService` |
| `ReportMappingComponent` | `app-report-mapping` | `client/src/app/shared/partials/report-mapping/report-mapping.component.ts` | `./report-mapping.component.html` | `api: ApiService`, `dashboardservice: DashboardService`, `authService: AuthService`, `subscriptionService: SubscriptionService`, `licenseService: LicenseService` |
| `ResultListComponent` | `app-result-list` | `client/src/app/shared/partials/result-components/result-list/result-list.component.ts` | `./result-list.component.html` | - |
| `ResultSectionComponent` | `app-result-section` | `client/src/app/shared/partials/result-components/result-section/result-section.component.ts` | `./result-section.component.html` | - |
| `ResultComponent` | `app-result` | `client/src/app/shared/partials/result/result.component.ts` | `./result.component.html` | `scrollService: ScrollService`, `router: Router`, `helperService: HelperService`, `app_service: AppService`, `dashboardService: DashboardService`, `sidebarService: SidebarService` |
| `ScanHelperMethods` | `app-scan-helper` | `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods.component.ts` | `./scan-helper-methods.component.html` | `scanService: ScanHelperMethodsService`, `appService: AppService` |
| `ScrollTopComponent` | `app-scroll-top` | `client/src/app/shared/partials/scroll-top/scroll-top.component.ts` | `./scroll-top.component.html` | - |
| `SupportComponent` | `app-support` | `client/src/app/shared/partials/support/support.component.ts` | `./support.component.html` | `apiService: ApiService`, `messageNotificationService: MessageNotificationService` |
| `TrailNotificationComponent` | `app-trail-notification` | `client/src/app/shared/partials/trail-notification/trail-notification.component.ts` | `./trail-notification.component.html` | `subscriptionService: SubscriptionService` |

### `AuditlogListComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/admin/auditlog/auditlog-list/auditlog-list.component.ts`
- **Selector:** `app-auditlog-list`
- **Template:** `./auditlog-list.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-auditlog-list. Template has 8 data-testid markers and 3 event bindings.
- **Imports:** `AsyncPipe`, `DatePipe`, `ConfirmationPopupComponent`
- **Injected services:** `auditService: AuditlogService`, `appService: AppService`
- **Inputs:** `isLoading`
- **Outputs:** -
- **Properties:** `isLoading`, `isDeleteConfirmationOpen`, `selectedDeleteId`
- **Methods:** `constructor`, `isAdmin`, `openDeleteConfirmation`, `deleteAuditLog`, `if`
- **Template data-testid markers:** `auditlog-row`, `auditlog-actor`, `auditlog-delete-button`, `auditlog-empty-state`, `auditlog-row`, `auditlog-actor`, `auditlog-delete-button`, `auditlog-empty-state`
- **Template router links:** -
- **Template events:** `click`, `click`, `confirmed`

### `AuditlogComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/admin/auditlog/auditlog.component.ts`
- **Selector:** `app-auditlog`
- **Template:** `./auditlog.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-auditlog. Template has 2 data-testid markers and 8 event bindings.
- **Imports:** `FormsModule`, `PaginationComponent`, `AsyncPipe`, `AuditlogListComponent`, `FiltersComponent`, `NgOptimizedImage`, `NgClass`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `helperService`, `sidebarService`, `service`, `filterModel`, `selectedActor`, `sidebarReady`
- **Methods:** `ngAfterViewInit`, `setTimeout`, `openSidebar`, `closeSidebar`, `onActorChange`, `exportAuditLogs`, `if`
- **Template data-testid markers:** `auditlog-user-search`, `auditlog-export-button`
- **Template router links:** -
- **Template events:** `keyup.enter`, `click`, `click`, `click`, `filterChanged`, `filterClose`, `filterReset`, `pageChange`

### `AppComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/app/app.component.ts`
- **Selector:** `app-root`
- **Template:** `./app.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-root. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `RouterOutlet`, `MessageNotificationComponent`, `LoaderComponent`, `TrailNotificationComponent`
- **Injected services:** `router: Router`, `errorStore: ErrorStoreService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `currentRoute`, `isVisible`
- **Methods:** `constructor`, `effect`, `shouldAnimate`, `applyTheme`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `CredentialListComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/credentials/credential-list/credential-list.component.ts`
- **Selector:** `app-credential-list`
- **Template:** `./credential-list.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-credential-list. Template has 8 data-testid markers and 6 event bindings.
- **Imports:** `ExpandedRowComponent`, `DatePipe`
- **Injected services:** `router: Router`
- **Inputs:** `rankedResultInput`, `currentPage`, `type`, `isLoading`, `searchQuery`
- **Outputs:** -
- **Properties:** `selector`, `pageSize`, `thretsExpandedRows`, `stealersExpandedRows`, `currentPage`, `type`, `isLoading`, `rankedResult`, `searchQuery`
- **Methods:** `constructor`, `effect`, `isStealerlogsRoute`, `trackByIndex`, `getDisplayIndex`, `toggleRow`, `isExpanded`, `onRowKeydown`, `if`, `sliceText`, `if`, `getThreatPrimaryUrl`, `if`, `getThreatPrimaryUrlShort`
- **Template data-testid markers:** `ioc-stealer-table`, `ioc-stealer-row`, `ioc-stealer-row-index`, `ioc-stealer-row-toggle`, `ioc-threats-heading`, `ioc-threat-table`, `ioc-threat-row`, `ioc-threat-row-toggle`
- **Template router links:** -
- **Template events:** `click`, `keydown`, `click`, `click`, `keydown`, `click`

### `CredentialComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/credentials/credential.component.ts`
- **Selector:** `app-credential`
- **Template:** `./credential.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-credential. Template has 3 data-testid markers and 14 event bindings.
- **Imports:** `ResultComponent`, `CredentialListComponent`, `FormsModule`, `EmptyQueryComponent`, `NgClass`, `PaginationComponent`, `IocSearchComponent`, `PasswordSchemaComponent`, `ScanHelperMethods`, `ExportChoiceModalComponent`
- **Injected services:** `helperService: HelperService`, `router: Router`, `route: ActivatedRoute`, `cdr: ChangeDetectorRef`, `dashboardService: DashboardService`, `reportExportService: ReportExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `isSearchLoading`, `isRankedLoading`, `reportExportOptions`, `searchQuery`, `isLoading`, `firstTrigger`, `url`, `stealerlogCallbackModel`, `rankedResult`, `breachesApiTime`, `allSearchApiTime`, `showPasswordscheme`, `showSubdomains`, `isExportChoiceOpen`, `subdomainList`, `isStandaloneStealerlogsRoute`, `key`, `order`, `order`, `values`
- **Methods:** `setLoading`, `if`, `constructor`, `ngOnInit`, `if`, `if`, `triggerSearch`, `fetchSearchResults`, `if`, `if`, `onToggleSort`, `if`, `reloadFilters`, `resetFilters`, `fetchRanked`, `if`, `if`, `getTotalResultCount`, `getApiTime`, `getAssetSearched`, `onPageChange`, `getAggregatedDataWells`, `onDownload`, `closeExportChoice`, `selectExport`, `if`, `downloadCombinedResultsCsv`, `exportCombinedResultsPdf`, `if`, `if`, `buildCombinedExportRows`, `buildStealerExportRows`, `buildRankedExportRows`, `buildPdfSection`, `toExportValue`
- **Template data-testid markers:** `ioc-open-password-scheme`, `consolidated-open-domain-scanner`, `ioc-download-results`
- **Template router links:** -
- **Template events:** `searchTriggered`, `onToggleSort`, `reloadData`, `reloadFilters`, `click`, `click`, `click`, `pageChange`, `close`, `search`, `close`, `search`, `closed`, `optionSelected`

### `ExpandedRowComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/credentials/expanded-row/expanded-row.component.ts`
- **Selector:** `app-expanded-row`
- **Template:** `./expanded-row.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-expanded-row. Template has 29 data-testid markers and 25 event bindings.
- **Imports:** `NgClass`, `TitleCasePipe`, `TooltipDirective`
- **Injected services:** `rowHelper: ResultRowHelperService`
- **Inputs:** `mode`, `item`, `result`, `index`, `searchQuery`
- **Outputs:** -
- **Properties:** `selector`, `telemetryGroupsCache`, `activeTelemetryKey`, `matchedValues`, `copiedKey`, `mode`, `item`, `result`, `index`, `searchQuery`, `part`, `value`
- **Methods:** `constructor`, `ngOnDestroy`, `if`, `ngOnChanges`, `if`, `if`, `if`, `if`, `parseSearchQuery`, `if`, `for`, `if`, `if`, `isTelemetryMatched`, `isValueMatched`, `if`, `selectTelemetry`, `if`, `if`, `telemetryIcon`, `copyText`, `copyAll`, `if`, `if`, `downloadReport`, `if`, `setTimeout`, `isCopied`, `rebuildTelemetryGroups`, `getReportPayload`, `if`, `buildReportText`, `if`, `for`, `if`
- **Template data-testid markers:** `ioc-expanded-row`, `ioc-expanded-type`, `ioc-expanded-copy-all`, `ioc-expanded-download-report`, `ioc-expanded-meta-channel`, `ioc-expanded-meta-channel-value`, `ioc-expanded-meta-year`, `ioc-expanded-meta-year-value`, `ioc-expanded-meta-file-type`, `ioc-expanded-meta-file-type-value`, `ioc-expanded-identity-title`, `ioc-expanded-email-value`, `ioc-expanded-domain-value`, `ioc-expanded-ip-value`, `ioc-expanded-password-value`, `ioc-expanded-telemetry-title`, `ioc-expanded-telemetry-tabs`, `ioc-expanded-telemetry-tab`, `ioc-expanded-telemetry-details`, `ioc-expanded-telemetry-value`, `ioc-expanded-raw-title`, `ioc-expanded-raw-value`, `ioc-expanded-copy-all`, `ioc-expanded-download-report`, `ioc-expanded-telemetry-title`, `ioc-expanded-telemetry-tabs`, `ioc-expanded-telemetry-tab`, `ioc-expanded-telemetry-details`, `ioc-expanded-telemetry-value`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `PasswordSchemaComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/credentials/password-schema/password-schema.component.ts`
- **Selector:** `app-password-schema`
- **Template:** `./password-schema.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-password-schema. Template has 7 data-testid markers and 7 event bindings.
- **Imports:** `FormsModule`, `NgClass`
- **Injected services:** `appService: AppService`
- **Inputs:** `isOpen`
- **Outputs:** `close`, `search`
- **Properties:** `selector`, `isOpen`, `close`, `search`
- **Methods:** `constructor`, `onSearch`, `onClose`, `onOutsideClick`, `normalizeRange`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** `password-scheme-modal`, `password-scheme-title`, `password-scheme-min-length`, `password-scheme-max-length`, `password-scheme-has-alphabets`, `password-scheme-has-numbers`, `password-scheme-search`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `ngModelChange`, `ngModelChange`, `click`, `click`

### `SidebarSectionComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-collapsed-sidebar/dashboard-sidebar-collapsed.component.ts`
- **Selector:** `app-dashboard-sidebar-collapsed`
- **Template:** `./dashboard-sidebar-collapsed.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-sidebar-collapsed. Template has 0 data-testid markers and 3 event bindings.
- **Imports:** `NgClass`, `AsyncPipe`, `RouterLink`, `TooltipDirective`, `LowerPipe`
- **Injected services:** `licenseService: LicenseService`, `sidebarHomepageService: SidebarHomepageService`
- **Inputs:** `title`, `icon`, `items`, `category`, `routePrefix`, `selectionStore`, `tooltip`
- **Outputs:** `sectionSelected`, `optionSelected`
- **Properties:** `selector`, `title`, `icon`, `items`, `category`, `routePrefix`, `selectionStore`, `tooltip`, `sectionSelected`, `optionSelected`
- **Methods:** `constructor`, `selectSection`, `selectOption`, `requestSubscription`, `getItemTooltip`, `if`, `getItemIcon`
- **Template data-testid markers:** -
- **Template router links:** `licenseService.canAccess(category()) ? routePrefix() : null`, `licenseService.canAccess(category()) ? routePrefix() + `
- **Template events:** `click`, `click`, `click`

### `DashboardSidebarItemsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar-items/dashboard-sidebar-items.component.ts`
- **Selector:** `app-dashboard-sidebar-items`
- **Template:** `./dashboard-sidebar-items.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-sidebar-items. Template has 0 data-testid markers and 3 event bindings.
- **Imports:** `NgClass`, `NgOptimizedImage`, `AsyncPipe`, `RouterLink`, `TooltipDirective`, `LowerPipe`
- **Injected services:** `selectionStore: SelectionStoreService`, `licenseService: LicenseService`, `subscriptionService: SubscriptionService`, `sidebarHomepageService: SidebarHomepageService`
- **Inputs:** `title`, `icon`, `items`, `category`, `routePrefix`, `tooltip`
- **Outputs:** `sectionSelected`, `optionSelected`
- **Properties:** `selector`, `icon`, `items`, `category`, `routePrefix`, `tooltip`, `sectionSelected`, `optionSelected`
- **Methods:** `constructor`, `selectSection`, `selectOption`, `requestSubscription`, `replaceDashWithSpace`, `if`
- **Template data-testid markers:** -
- **Template router links:** `licenseService.canAccess(category()) ? [routePrefix()] : null`, `licenseService.canAccess(category()) ? [routePrefix(), item.toLowerCase()] : null`
- **Template events:** `click`, `click`, `click`

### `DashboardSidebarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/dashboard-sidebar.component.ts`
- **Selector:** `app-dashboard-sidebar`
- **Template:** `./dashboard-sidebar.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-sidebar. Template has 2 data-testid markers and 56 event bindings.
- **Imports:** `NgOptimizedImage`, `NgClass`, `RouterLink`, `AsyncPipe`, `DashboardSidebarItemsComponent`, `SidebarSectionComponent`, `TooltipDirective`
- **Injected services:** `scrollService: ScrollService`, `dashboardService: DashboardService`, `selectionStore: SelectionStoreService`, `appService: AppService`, `router: Router`, `authService: AuthService`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** `menuToggle`
- **Properties:** `selector`, `sidebar_default`, `min_detected`, `mobile_menu_status`, `animationsDisabled`, `apiCategories`, `exploitCategories`, `dumpCategories`, `newsCategories`, `generalCategories`, `leakCategories`, `defacementCategories`, `socialCategories`, `stealerlogsCategories`, `scannerCategories`, `tenantCategories`, `profileCategories`, `category`, `menuToggle`, `firstSubcategory`, `firstSubcategory`, `firstSubcategory`, `firstSubcategory`, `firstSubcategory`, `firstSubcategory`
- **Methods:** `if`, `constructor`, `ngOnInit`, `if`, `handleProfileRoute`, `ngOnDestroy`, `checkScreenWidth`, `if`, `onSectionSelected`, `if`, `switch`, `if`, `if`, `onResetCallback`, `onOptionSelected`, `if`, `onToggleSidebar`, `canAccessNetworkIntel`, `canAccessSocialIntel`, `canAccessStandaloneDataCollection`, `canAccessWhistleBlowing`, `shouldShowWhistleBlowing`, `requestStandaloneSubscription`, `if`, `if`, `if`, `getProfileCategories`, `isAdmin`, `isDemo`, `isMember`
- **Template data-testid markers:** `sidebar-collapse-button`, `sidebar-expand-button`
- **Template router links:** `canAccessNetworkIntel() && !appService.isMobileMode() ? `, `canAccessNetworkIntel() && !appService.isMobileMode() ? `
- **Template events:** `click`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `click`, `click`, `click`, `click`, `click`, `click`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`, `optionSelected`, `sectionSelected`

### `SidebarUserEventManagementComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-event-management/sidebar-user-event-management.component.ts`
- **Selector:** `app-sidebar-user-event-management`
- **Template:** `./sidebar-user-event-management.component.html`
- **Styles:** `./sidebar-user-event-management.component.css`
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-sidebar-user-event-management. Template has 2 data-testid markers and 9 event bindings.
- **Imports:** `CommonModule`, `PaginationComponent`, `FiltersComponent`, `EmptyQueryComponent`, `EmptyResultComponent`, `LoadingFormComponent`, `IocSearchComponent`
- **Injected services:** `apiService: ApiService`, `appService: AppService`, `licenseService: LicenseService`, `router: Router`, `dashboardService: DashboardService`, `sidebarService: SidebarService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `searchBuilderLabels`, `searchBuilderValueValidators`, `searchBuilderTagValidators`, `query`, `displayQuery`, `loading`, `queryTriggered`, `errorMessage`, `expandedResultIndex`, `batchSize`, `emptyQueryBatchSize`, `currentPage`, `filterModel`, `sidebarReady`, `trackByIndex`, `q`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `ngAfterViewInit`, `setTimeout`, `canAccessEventManagement`, `triggerSearch`, `clearSidebarFilters`, `reloadFilters`, `onPageChange`, `getDisplayIndex`, `executeSearch`, `toggleResultItem`, `getResultTitle`, `getRawPreview`, `if`, `getEventTimestamp`, `getExtractedIocs`, `if`, `getActorLabel`
- **Template data-testid markers:** `siem-log-row`, `siem-log-row-toggle`
- **Template router links:** -
- **Template events:** `searchTriggered`, `click`, `click`, `filterClose`, `filterChanged`, `filterReset`, `click`, `click`, `pageChange`

### `SidebarUserFeederAddComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/add/sidebar-user-feeder-add.component.ts`
- **Selector:** `app-sidebar-user-feeder-add`
- **Template:** `./sidebar-user-feeder-add.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder-add. Template has 8 data-testid markers and 9 event bindings.
- **Imports:** `FormsModule`, `ConfirmationPopupComponent`
- **Injected services:** `feederService: FeederService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** `rules`, `selectedRuleKey`, `isCatalogLoading`
- **Outputs:** `scriptUploaded`
- **Properties:** `selector`, `pendingUploadInput`, `sharedRuleScripts`, `uploadMode`, `selectedFiles`, `valuesText`, `isSubmitting`, `isSharedScriptStatusLoading`, `isValuesLoading`, `uploadProgressCurrent`, `uploadProgressTotal`, `isReplaceConfirmationOpen`, `formError`, `replaceConfirmationMessage`, `ruleKey`, `error`, `ruleKey`, `next`, `error`, `next`, `error`, `next`, `error`, `safeStem`
- **Methods:** `constructor`, `ngOnChanges`, `if`, `hasSharedScriptUploaded`, `isSharedValueBlocked`, `if`, `if`, `if`, `if`, `onFileSelected`, `supportsValueUpload`, `supportsFileUpload`, `uploadSharedFile`, `uploadSharedValues`, `clearFile`, `uploadScript`, `if`, `if`, `if`, `for`, `if`, `if`, `confirmReplaceUpload`, `if`, `if`, `loadCurrentRuleValues`, `syncUploadMode`, `loadSharedRuleScripts`, `if`, `submitUpload`, `if`, `if`, `if`, `if`, `submitFileUploads`
- **Template data-testid markers:** `feeder-form-error`, `feeder-file-input`, `feeder-select-file-button`, `feeder-upload-script-button`, `feeder-values-input`, `feeder-upload-values-button`, `feeder-select-file-button`, `feeder-values-input`
- **Template router links:** -
- **Template events:** `confirmed`, `change`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `SidebarUserFeederOwnerDialogComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/owner-dialog/sidebar-user-feeder-owner-dialog.component.ts`
- **Selector:** `app-sidebar-user-feeder-owner-dialog`
- **Template:** `./sidebar-user-feeder-owner-dialog.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder-owner-dialog. Template has 4 data-testid markers and 4 event bindings.
- **Imports:** `FormsModule`
- **Injected services:** `feederService: FeederService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** `script`
- **Outputs:** `closed`, `saved`
- **Properties:** `selector`, `isOwnerSaving`, `selectedOwnerUserId`, `ownerUsers`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnChanges`, `if`, `getAvailableOwnerUsers`, `confirmOwnerTransfer`, `if`, `loadOwnerUsers`
- **Template data-testid markers:** `feeder-owner-dialog`, `feeder-owner-select`, `feeder-owner-cancel`, `feeder-owner-submit`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`

### `SidebarUserFeederComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/sidebar-user-feeder.component.ts`
- **Selector:** `app-sidebar-user-feeder`
- **Template:** `./sidebar-user-feeder.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder. Template has 5 data-testid markers and 5 event bindings.
- **Imports:** `NgClass`, `FormsModule`, `SidebarUserFeederAddComponent`, `SidebarUserFeederViewComponent`
- **Injected services:** `feederService: FeederService`, `route: ActivatedRoute`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `highlightedScript`, `rules`, `selectedRuleKey`, `isCatalogLoading`, `formError`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `hasScriptTab`, `hasValuesTab`, `setActiveTab`, `onScriptUploaded`, `onRuleChange`, `getRuleLabel`, `loadCatalog`, `if`, `if`, `humanizeKey`, `ensureValidActiveTab`, `syncRuleQueryParam`
- **Template data-testid markers:** `feeder-page-title`, `feeder-rule-select`, `feeder-tab-add`, `feeder-tab-script`, `feeder-tab-values`
- **Template router links:** -
- **Template events:** `ngModelChange`, `click`, `click`, `click`, `scriptUploaded`

### `SidebarUserFeederViewComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/view/sidebar-user-feeder-view.component.ts`
- **Selector:** `app-sidebar-user-feeder-view`
- **Template:** `./sidebar-user-feeder-view.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-sidebar-user-feeder-view. Template has 9 data-testid markers and 23 event bindings.
- **Imports:** `NgClass`, `DatePipe`, `PaginationComponent`, `ConfirmationPopupComponent`, `ScrollTopComponent`, `SidebarUserFeederOwnerDialogComponent`
- **Injected services:** `feederService: FeederService`, `messageNotificationService: MessageNotificationService`, `appService: AppService`
- **Inputs:** `active`, `selectedRuleKey`, `entryType`, `highlightedScript`
- **Outputs:** -
- **Properties:** `selector`, `consumedHighlightedScriptId`, `scriptTotal`, `rawScripts`, `scripts`, `displayedScripts`, `rawValues`, `displayedValues`, `valuesRecord`, `selectedValueUrl`, `searchText`, `selectedScript`, `isScriptsLoading`, `isOwnerDialogOpen`, `ownerDialogScript`, `isConfirmationOpen`, `confirmationMessage`, `hasLoadedScripts`, `currentPage`, `totalPages`, `sortStatusDirection`, `shimmerRows`, `ruleKey`, `next`, `error`
- **Methods:** `constructor`, `ngOnChanges`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `canTransferOwnership`, `canTransferScript`, `canBulkToggle`, `canToggleScript`, `loadScripts`, `if`, `if`, `if`, `getScriptPathLabel`, `if`, `getSectionTitle`, `if`, `getSectionDescription`, `if`, `getEmptyStateDescription`, `if`, `getScriptDisplayName`, `if`, `getValueRowNumber`, `getValueStatus`, `if`, `if`, `if`, `getValueUpdatedAt`, `toggleStatusSort`, `hasValuePreview`
- **Template data-testid markers:** `feeder-search-input`, `feeder-reload-button`, `feeder-enable-all-button`, `feeder-disable-all-button`, `feeder-clear-all-button`, `feeder-empty-values`, `feeder-empty-scripts`, `feeder-script-preview-url-panel`, `feeder-script-preview-url`
- **Template router links:** -
- **Template events:** `closed`, `saved`, `confirmed`, `input`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `pageChange`

### `AddCustomAlertComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/add-custom-alert/add-custom-alert.component.ts`
- **Selector:** `app-add-custom-alert`
- **Template:** `./add-custom-alert.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-add-custom-alert. Template has 9 data-testid markers and 8 event bindings.
- **Imports:** `CommonModule`, `FormsModule`
- **Injected services:** `appService: AppService`, `apiService: ApiService`, `router: Router`, `route: ActivatedRoute`, `messageNotificationService: MessageNotificationService`
- **Inputs:** `heading`, `description`, `edit`, `editAlertData`
- **Outputs:** `cancle`
- **Properties:** `selector`, `iocDropdownOpen`, `alert`, `formError`, `alertTypes`, `allowedIocTypes`, `heading`, `description`, `edit`, `editAlertData`, `cancle`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `if`, `if`, `if`, `onIOCTypeChange`, `onIocValueChange`, `syncAllIoc`, `if`, `isValidUrl`, `validateForm`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `saveAlert`, `if`, `toggleIocDropdown`, `onDocumentClick`, `cancleAlert`, `getAlertTypeLabel`, `if`, `getIOCTypeLabel`, `if`
- **Template data-testid markers:** `tenant-alert-modal`, `tenant-alert-title`, `tenant-alert-description`, `tenant-alert-ioc-type-toggle`, `tenant-alert-ioc-type-option`, `tenant-alert-source`, `tenant-alert-url`, `tenant-alert-ioc-value`, `tenant-alert-save`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `ngModelChange`, `click`, `click`

### `AlertExportComponentComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-export-component/alert-export-component.component.ts`
- **Selector:** `app-alert-export-component`
- **Template:** `./alert-export-component.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-alert-export-component. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `CommonModule`, `UpperCasePipe`, `NgClass`
- **Injected services:** -
- **Inputs:** `alertsInput`
- **Outputs:** -
- **Properties:** `selector`, `viewAlerts`
- **Methods:** `constructor`, `effect`, `statusClass`, `if`, `if`, `formatDate`, `getRiskLevel`, `switch`, `riskClass`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AlertScanLoadingComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/alert-scan-loading/alert-scan-loading.component.ts`
- **Selector:** `app-alert-scan-loading`
- **Template:** `./alert-scan-loading.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-alert-scan-loading. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** `NgClass`
- **Injected services:** `alertService: AlertService`, `licenseService: LicenseService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** `constructor`, `cancelScan`
- **Template data-testid markers:** `tenant-scan-cancel`
- **Template router links:** -
- **Template events:** `click`

### `CategoryAlertReportComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/category-alert-report/category-alert-report.component.ts`
- **Selector:** `app-category-alert-report`
- **Template:** `./category-alert-report.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-category-alert-report. Template has 5 data-testid markers and 32 event bindings.
- **Imports:** `CommonModule`, `FormsModule`, `AddCustomAlertComponent`, `FiltersComponent`, `ConfirmationPopupComponent`, `TooltipDirective`, `EmptyResultComponent`, `ExportChoiceModalComponent`
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `appService: AppService`, `sidebarService: SidebarService`, `apiService: ApiService`, `messageNotificationService: MessageNotificationService`, `licenseService: LicenseService`, `helperService: HelperService`, `alertExportService: AlertExportService`, `sidebarHomepageService: SidebarHomepageService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `alertLookupById`, `filterModel`, `alerts`, `filteredAlerts`, `visibleFilteredAlerts`, `serverPageSize`, `incrementalDelayMs`, `currentPage`, `hasMoreAlerts`, `isLoadingMoreAlerts`, `isInitialLoading`, `activeDateRange`, `searchText`, `category`, `iocTypes`, `showCustomAlertPopup`, `showEditAlertPopup`, `isFlushAllConfirmationOpen`, `isDeleteAlertConfirmationOpen`, `selectedDeleteAlertId`, `importedAlert`, `alertToShowReport`, `isExportChoiceOpen`, `alertExportOptions`
- **Methods:** `constructor`, `decrementUnseenSummary`, `if`, `isLightTheme`, `setReportToolHover`, `ngOnInit`, `if`, `clearAppendTimer`, `if`, `appendVisibleAlertsIncrementally`, `if`, `if`, `loadAlertsPage`, `if`, `if`, `for`, `if`, `if`, `canLoadMoreAlerts`, `loadMoreAlerts`, `flushAll`, `flushAllConfirmation`, `if`, `showAlertPopup`, `switch`, `if`, `toggleActionMenu`, `closeActionMenus`, `isAlertExpanded`, `toggleAlertExpanded`, `onDocumentClick`, `exportAlert`, `switch`, `if`, `canExportstix`
- **Template data-testid markers:** `tenant-alert-add-button`, `tenant-alert-flush-all`, `tenant-alert-open-sidebar`, `tenant-alert-report-card`, `tenant-alert-report-see-details`
- **Template router links:** -
- **Template events:** `click`, `click`, `mouseenter`, `mouseleave`, `click`, `mouseenter`, `mouseleave`, `change`, `click`, `mouseenter`, `mouseleave`, `click`, `mouseenter`, `mouseleave`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `confirmed`, `click`, `cancle`, `cancle`, `click`, `filterClose`, `filterChanged`, `confirmed`, `closed`, `optionSelected`

### `SidebarUserHomepageComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-homepage/sidebar-user-homepage.component.ts`
- **Selector:** `app-sidebar-user-homepage`
- **Template:** `./sidebar-user-homepage.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-sidebar-user-homepage. Template has 4 data-testid markers and 15 event bindings.
- **Imports:** `CommonModule`, `FormsModule`, `HomeSearchComponent`, `TooltipDirective`, `ConfirmationPopupComponent`, `AlertScanLoadingComponent`, `HomepageComponent`, `HomeInsightComponent`, `NgOptimizedImage`, `MessagePopupComponent`, `ExportChoiceModalComponent`
- **Injected services:** `appService: AppService`, `alertService: AlertService`, `dashboardService: DashboardService`, `router: Router`, `apiService: ApiService`, `messageNotificationService: MessageNotificationService`, `authService: AuthService`, `licenseService: LicenseService`, `alertExportService: AlertExportService`, `sidebarHomepageService: SidebarHomepageService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `hoveredHomeTool`, `alertCategories`, `criticalRisks`, `highRisks`, `mediumRisks`, `lowRisks`, `isConfirmationOpen`, `noIocPopup`, `showAlertScanLoading`, `isExportChoiceOpen`, `alertExportOptions`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `effect`, `effect`, `if`, `ngOnInit`, `initializeData`, `queueMicrotask`, `checkScanProgress`, `if`, `isAdmin`, `isAnalyst`, `isDemo`, `isMember`, `convertCountsToCategories`, `for`, `countRiskFromSummary`, `hasReports`, `getRiskLevel`, `entityFiltersCount`, `editIocs`, `openAlerts`, `if`, `scanIOCs`, `if`, `clossNoIocPopup`, `flushAll`, `flushAllConfirmation`, `if`, `queueMicrotask`, `ngOnDestroy`, `startManualLoadingDisplay`, `isLightTheme`, `setHomeToolHover`, `openExportChoice`, `closeExportChoice`
- **Template data-testid markers:** `tenant-home-print-alerts`, `tenant-home-flush-all`, `tenant-home-scan-all`, `tenant-home-alert-category-card`
- **Template router links:** -
- **Template events:** `click`, `mouseenter`, `mouseleave`, `click`, `mouseenter`, `mouseleave`, `click`, `mouseenter`, `mouseleave`, `click`, `click`, `confirmed`, `confirmed`, `closed`, `optionSelected`

### `SidebarUserIocComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-ioc/sidebar-user-ioc.component.ts`
- **Selector:** `app-sidebar-user-ioc`
- **Template:** `./sidebar-user-ioc.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-sidebar-user-ioc. Template has 3 data-testid markers and 8 event bindings.
- **Imports:** `NgClass`, `CommonModule`, `FormsModule`, `TooltipDirective`, `ConfirmationPopupComponent`
- **Injected services:** `apiService: ApiService`, `authService: AuthService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `showLeftFade`, `showRightFade`, `selectedCategoryId`, `iocSearchText`, `categories`, `isConfirmationOpen`, `name`, `name`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `if`, `onCategoryClick`, `addIoc`, `removeIoc`, `if`, `scrollLeft`, `scrollRight`, `hasIocsWithValues`, `update`, `setIocLocal`, `clearAllIocs`, `if`, `if`, `openConfirmationPopup`, `isLightTheme`
- **Template data-testid markers:** `tenant-ioc-search-input`, `tenant-ioc-value-input`, `tenant-ioc-add-button`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `keyup.enter`, `click`, `click`, `confirmed`

### `AccountSettingsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/account-settings.component.ts`
- **Selector:** `app-sidebar-profile-settings`
- **Template:** `./account-settings.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-sidebar-profile-settings. Template has 5 data-testid markers and 6 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `UserImagePickerComponent`
- **Injected services:** `apiService: ApiService`, `appService: AppService`, `licenseService: LicenseService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `twoFactorEnabled`, `isDarkMode`, `isProfileVisible`, `editableUsername`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `if`, `setItemsFromPreferences`, `isTenantProfileVisibilityEnabled`, `isAdmin`, `applyTheme`, `getCurrentTheme`, `toggleTheme`, `if`, `toggleTwoFa`, `toggleProfileVisibility`, `getLocationDisplay`, `updateUser`, `updateUserResource`, `if`, `deleteUserResource`, `getUserLicensesLabel`, `if`
- **Template data-testid markers:** `account-settings-form`, `account-settings-title`, `account-settings-twofa-toggle`, `account-settings-theme-toggle`, `account-settings-profile-visibility-toggle`
- **Template router links:** -
- **Template events:** `ngSubmit`, `onImageSelected`, `onClear`, `click`, `click`, `click`

### `TenantSettingsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/tenant-settings/tenant-settings.component.ts`
- **Selector:** `app-tenant-settings`
- **Template:** `./tenant-settings.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-tenant-settings. Template has 0 data-testid markers and 6 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `UserImagePickerComponent`
- **Injected services:** `apiService: ApiService`, `appService: AppService`, `authService: AuthService`, `licenseService: LicenseService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `isEditing`, `userId`, `id`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `isMember`, `toggleSection`, `if`, `toggleEdit`, `getLocationDisplay`, `updateUser`, `cancelEdit`, `updateUserResource`, `if`, `deleteUserResource`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `onImageSelected`, `onClear`, `click`, `click`, `click`, `click`

### `UserImagePickerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-settings/user-image-picker/user-image-picker.component.ts`
- **Selector:** `app-user-image-picker`
- **Template:** `./user-image-picker.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-user-image-picker. Template has 0 data-testid markers and 5 event bindings.
- **Imports:** `NgClass`
- **Injected services:** -
- **Inputs:** `imageUrlInput`, `id`, `defaultImage`, `wide`
- **Outputs:** `onImageSelected`, `onClear`
- **Properties:** `imageUrlInput`, `id`, `defaultImage`, `wide`, `onImageSelected`, `onClear`
- **Methods:** `constructor`, `effect`, `if`, `onFileSelected`, `if`, `if`, `deleteImage`, `if`, `hasCustomImage`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `keydown.enter`, `keydown.space`, `change`, `click`

### `SidebarUserStatisticsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-statistics/sidebar-user-statistics.component.ts`
- **Selector:** `app-sidebar-user-statistics`
- **Template:** `./sidebar-user-statistics.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-sidebar-user-statistics. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `HomeInsightComponent`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SidebarProfileSystemSettingsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-system-settings/sidebar-user-system-settings.component.ts`
- **Selector:** `app-sidebar-user-system-settings`
- **Template:** `./sidebar-user-system-settings.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-sidebar-user-system-settings. Template has 5 data-testid markers and 11 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `UserImagePickerComponent`
- **Injected services:** `apiService: ApiService`, `appService: AppService`, `authService: AuthService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `formError`, `systemData`, `form`, `languageOptions`, `onionPattern`, `urlPattern`, `metaInfo`, `metaInfo`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `loadSettings`, `if`, `toggleEdit`, `if`, `cancelEdit`, `updateUserResource`, `if`, `if`, `if`, `if`, `deleteUserResource`, `if`, `save`, `for`, `if`, `if`
- **Template data-testid markers:** `system-settings-edit`, `system-settings-save`, `system-settings-app-name`, `system-settings-onion-address`, `system-settings-ai-endpoint-enabled`
- **Template router links:** -
- **Template events:** `onImageSelected`, `onClear`, `click`, `click`, `click`, `onImageSelected`, `onClear`, `onImageSelected`, `onClear`, `onImageSelected`, `onClear`

### `DashboardComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dashboard/dashboard.component.ts`
- **Selector:** `app-dashboard`
- **Template:** `./dashboard.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard. Template has 13 data-testid markers and 2 event bindings.
- **Imports:** `DashboardSidebarComponent`, `DashboardHeaderComponent`, `NgClass`, `RouterOutlet`, `ScrollingModule`, `ProSubscriptionComponent`, `DemoTourComponent`
- **Injected services:** `dashboardService: DashboardService`, `cdr: ChangeDetectorRef`, `router: Router`, `authService: AuthService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `demoTourMounted`, `dashboardAnimationsReady`
- **Methods:** `constructor`, `ngOnInit`, `redirectMobileDemoDashboardEntry`, `toggleNavigation`, `isCompactViewport`, `prepareRoute`, `if`, `isCtiGraph`, `ngAfterViewInit`, `hideSubscription`, `shouldShowDemoTour`
- **Template data-testid markers:** `pro-subscription`, `dashboard-main`, `dashboard-sidebar-main`, `menu-toggle`, `dashboard-sidebar`, `dashboard-sidebar-component`, `dashboard-shell`, `dashboard-container`, `dashboard-header`, `dashboard-body`, `router-outlet`, `cti-graph-container`, `cti-router-outlet`
- **Template router links:** -
- **Template events:** `close`, `menuToggle`

### `DemoTourComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/demo-tour/demo-tour/demo-tour.component.ts`
- **Selector:** `app-demo-tour`
- **Template:** `./demo-tour.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-demo-tour. Template has 4 data-testid markers and 2 event bindings.
- **Imports:** -
- **Injected services:** `tourService: DemoTourService`, `cdr: ChangeDetectorRef`, `ngZone: NgZone`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `activeElement`, `animationFrameId`, `geometryTrackingFrameId`, `cutoutAnimationFrameId`, `activeElementResizeObserver`, `activeElementMutationObserver`, `stepPreparationToken`, `activeInput`, `activeInputWasDisabled`, `nextTransitionInProgress`, `scrollLockY`, `preparingStep`, `loadingStartedAt`, `geometryFrozen`, `lastRenderedGeometry`, `runtimeStyleSheet`, `stepIndexTimerId`, `startTourTimerId`, `step`, `visible`, `stepReady`, `loadingVisible`, `positionStyle`, `currentIndex`
- **Methods:** `constructor`, `ngOnInit`, `if`, `ngAfterViewInit`, `applyStepIndex`, `if`, `updateAccentTheme`, `ngOnDestroy`, `if`, `if`, `if`, `if`, `if`, `onWindowResize`, `if`, `onDocumentKeydown`, `if`, `if`, `if`, `updatePosition`, `if`, `if`, `if`, `if`, `if`, `shouldSkipGeometryUpdate`, `if`, `isWithinTolerance`, `schedulePositionUpdate`, `if`, `if`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** `demo-tour-overlay`, `demo-tour-tooltip`, `demo-tour-step`, `demo-tour-next`
- **Template router links:** -
- **Template events:** `click`, `click`

### `DirectoryListComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/directory/directory-list/directory-list.component.ts`
- **Selector:** `app-directory-list`
- **Template:** `./directory-list.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-directory-list. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `CommonModule`, `NgClass`
- **Injected services:** `directoryService: DirectoryService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `visibleCount`, `totalItems`, `loadingMore`
- **Methods:** `constructor`, `isRecent`, `if`, `ngAfterViewInit`, `if`, `if`, `loadMore`, `if`, `if`, `setTimeout`, `ngOnDestroy`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DirectoryComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/directory/directory.component.ts`
- **Selector:** `app-directory`
- **Template:** `./directory.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-directory. Template has 0 data-testid markers and 6 event bindings.
- **Imports:** `FiltersComponent`, `DirectoryListComponent`, `PaginationComponent`, `NgOptimizedImage`, `AsyncPipe`, `NgClass`
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `sidebarService: SidebarService`, `directoryService: DirectoryService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `filterModel`, `selectedFilters`, `totalPages`, `isLoaded`, `relativeTo`, `relativeTo`
- **Methods:** `constructor`, `if`, `ngOnInit`, `if`, `if`, `openSidebar`, `closeSidebar`, `applyFilters`, `resetFilters`, `onPageChange`, `if`, `updateQueryParams`, `reloadDirectory`, `getFilteredParams`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `filterChanged`, `filterClose`, `filterReset`, `pageChange`

### `DumpListComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dump/dump-list/dump-list.component.ts`
- **Selector:** `dump-list`
- **Template:** `./dump-list.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector dump-list. Template has 0 data-testid markers and 1 event bindings.
- **Imports:** `AsyncPipe`, `DatePipe`, `NgClass`
- **Injected services:** `dumpService: DumpService`, `router: Router`, `route: ActivatedRoute`
- **Inputs:** `isLoadingInput`
- **Outputs:** -
- **Properties:** `selector`, `isLoading`, `mDumpCallbackLinks`, `relativeTo`
- **Methods:** `constructor`, `effect`, `ngOnInit`, `if`, `onPageChange`, `copyRowData`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`

### `DumpComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/dump/dump.component.ts`
- **Selector:** `app-dump`
- **Template:** `./dump.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dump. Template has 0 data-testid markers and 7 event bindings.
- **Imports:** `NgOptimizedImage`, `PaginationComponent`, `AsyncPipe`, `NgClass`, `FiltersComponent`, `DumpListComponent`, `FormsModule`, `ReactiveFormsModule`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `service`, `filterModel`
- **Methods:** `openSidebar`, `closeSidebar`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `filterChanged`, `filterClose`, `filterReset`, `submit`, `pageChange`

### `GraphContextMenuComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/cti-graph/context-menu/context-menu.component.ts`
- **Selector:** `app-graph-context-menu`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-graph-context-menu.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `nodeId`, `canExpand`, `canCollapse`, `showOpenCti`, `showCopyLabel`, `showOpenReport`
- **Outputs:** `expand`, `collapse`, `openCti`, `copyLabel`, `openReport`
- **Properties:** `selector`, `nodeId`, `canExpand`, `canCollapse`, `showOpenCti`, `showCopyLabel`, `showOpenReport`, `expand`, `collapse`, `openCti`, `copyLabel`, `openReport`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `CtiSidebarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/cti-graph/cti-sidebar/cti-sidebar.component.ts`
- **Selector:** `app-cti-sidebar`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-cti-sidebar.
- **Imports:** `SidebarComponent`
- **Injected services:** -
- **Inputs:** `filters`, `collapsed`
- **Outputs:** `filtersApplied`, `filtersChanged`, `collapsedChange`
- **Properties:** `selector`, `filters`, `collapsed`, `filtersApplied`, `filtersChanged`, `collapsedChange`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ExpandToggleButtonComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/cti-graph/expand-toggle-button/expand-toggle-button.component.ts`
- **Selector:** `app-expand-toggle-button`
- **Template:** `./expand-toggle-button.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-expand-toggle-button. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `toggled`
- **Properties:** `selector`, `toggled`
- **Methods:** -
- **Template data-testid markers:** `cti-expand-groups-toggle`
- **Template router links:** -
- **Template events:** `click`

### `GraphComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/cti-graph/graphs.component.ts`
- **Selector:** `app-graphs`
- **Template:** `./graphs.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-graphs. Template has 3 data-testid markers and 27 event bindings.
- **Imports:** `CtiSidebarComponent`, `GraphContextMenuComponent`, `ProfileComponent`, `GraphToolbarComponent`, `ExpandToggleButtonComponent`, `ExportChoiceModalComponent`, `NgClass`, `TabBarComponent`, `GraphLoadingComponent`
- **Injected services:** `api: ApiService`, `clipboard: Clipboard`, `route: ActivatedRoute`, `graphReportExport: ReportExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `groupInfo`, `groupedSubNodesByParent`, `groupParentByGroupId`, `groupExpandedState`, `highlightedNodeId`, `physicsTimeoutId`, `nodeTypeById`, `lastSavedSessionSignature`, `pendingSessionState`, `rawNodes`, `rawEdges`, `contextMenuNodeId`, `contextCanExpand`, `contextCanCollapse`, `contextShowOpenCti`, `contextShowOpenReport`, `selectedType`, `singleInput`, `propertyType`, `propertyValue`, `maxEdge`, `maxDepth`, `loading`, `physicsEnabled`
- **Methods:** `if`, `if`, `if`, `if`, `getNodeLabelColor`, `if`, `if`, `if`, `ngOnInit`, `if`, `ngOnDestroy`, `onSidebarCollapsedChange`, `tryApplyPendingFilters`, `if`, `tryRestorePendingSessionState`, `if`, `buildRouteFilterOverride`, `if`, `applyRouteFilterOverride`, `if`, `createDefaultSessionState`, `normalizePlaygroundTab`, `if`, `generateId`, `if`, `getActiveTab`, `applyActiveTabState`, `if`, `restoreGraphSessionState`, `if`, `if`, `if`, `if`, `saveSessions`, `if`
- **Template data-testid markers:** `cti-highlighted-count`, `cti-network-container`, `cti-listings-toggle`
- **Template router links:** -
- **Template events:** `tabSelected`, `tabClosed`, `tabEditStarted`, `tabRenameSubmitted`, `tabRenameCancelled`, `newSessionRequested`, `exportCurrentRequested`, `exportReportRequested`, `fileSelected`, `filtersChanged`, `filtersApplied`, `collapsedChange`, `searchChanged`, `searchSubmitted`, `clearSearchClicked`, `viewModeChanged`, `physicsToggled`, `toggled`, `click`, `click`, `expand`, `collapse`, `openCti`, `copyLabel`, `openReport`, `closed`, `optionSelected`

### `SidebarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/cti-graph/sidebar/sidebar.component.ts`
- **Selector:** `graph-sidebar`
- **Template:** `./sidebar.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector graph-sidebar. Template has 3 data-testid markers and 17 event bindings.
- **Imports:** `FormsModule`, `ReactiveFormsModule`, `TitleCasePipe`, `SidebarShellComponent`
- **Injected services:** -
- **Inputs:** `filters`, `collapsed`
- **Outputs:** `filtersApplied`, `filtersChanged`, `collapsedChange`
- **Properties:** `selector`, `isMobile`, `selectedType`, `singleInput`, `propertyType`, `propertyValue`, `maxNodes`, `maxDepth`, `graphTypeOptions`, `graphClusterOptions`, `graphAllowedProperties`, `filters`, `collapsed`, `filtersApplied`, `filtersChanged`, `collapsedChange`
- **Methods:** `buildFilterPayload`, `emitFilters`, `emitDraftFilters`, `applyIncomingFilters`, `ngOnInit`, `ngOnChanges`, `if`, `if`, `updateViewportState`, `if`, `if`, `if`, `onWindowResize`, `applyFilters`, `toggleCollapsed`, `onMobileBackdropClick`, `if`, `resetFilters`, `onFormatPropertyType`, `onTypeChange`, `if`, `validateMaxNodes`, `if`, `validateMaxDepth`, `if`
- **Template data-testid markers:** `cti-filter-type-select`, `cti-filter-apply`, `cti-filter-reset`
- **Template router links:** -
- **Template events:** `click`, `toggleClicked`, `ngModelChange`, `ngModelChange`, `ngModelChange`, `ngModelChange`, `ngModelChange`, `blur`, `ngModelChange`, `blur`, `ngModelChange`, `click`, `click`, `click`, `click`, `click`, `click`

### `GraphLoadingComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/shared/graph-loading/graph-loading.component.ts`
- **Selector:** `app-graph-loading`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-graph-loading.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `actionTriggered`
- **Properties:** `selector`, `changeDetection`, `subtitle`, `actionLabel`, `actionTriggered`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `GraphToolbarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/shared/graph-toolbar/graph-toolbar.component.ts`
- **Selector:** `app-graph-toolbar`
- **Template:** `./graph-toolbar.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-graph-toolbar. Template has 10 data-testid markers and 12 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `searchChanged`, `searchSubmitted`, `imageSearchClicked`, `clearSearchClicked`, `viewModeChanged`, `physicsToggled`, `editModeToggled`
- **Properties:** `selector`, `isSearchDisabled`, `searchPlaceholder`, `searchActionLabel`, `showSearchActionButton`, `showImageButton`, `showClearButton`, `applyOuterPadding`, `viewMode`, `showViewModeToggle`, `isPhysicsEnabled`, `showPhysicsToggle`, `isEditMode`, `canEditConnections`, `showEditToggle`, `searchChanged`, `searchSubmitted`, `imageSearchClicked`, `clearSearchClicked`, `viewModeChanged`, `physicsToggled`, `editModeToggled`
- **Methods:** `onSearchInput`, `onSetViewMode`, `toggleViewMode`
- **Template data-testid markers:** `graph-toolbar-root`, `graph-toolbar-search-input`, `graph-toolbar-image-search`, `graph-toolbar-clear-search`, `graph-toolbar-search-button`, `graph-toolbar-view-toggle`, `graph-toolbar-view-graph`, `graph-toolbar-view-list`, `graph-toolbar-physics-toggle`, `graph-toolbar-edit-toggle`
- **Template router links:** -
- **Template events:** `input`, `keyup.enter`, `keydown.arrowleft`, `keydown.arrowright`, `keydown.home`, `keydown.end`, `click`, `click`, `click`, `click`, `click`, `click`

### `SidebarShellComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/shared/sidebar-shell/sidebar-shell.component.ts`
- **Selector:** `app-graph-sidebar-shell`
- **Template:** `./sidebar-shell.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-graph-sidebar-shell. Template has 0 data-testid markers and 1 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `toggleClicked`
- **Properties:** `selector`, `isCollapsed`, `logoAlt`, `homeHref`, `toggleClicked`
- **Methods:** `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`

### `TabBarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/shared/tab-bar/tab-bar.component.ts`
- **Selector:** `app-tab-bar`
- **Template:** `./tab-bar.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-tab-bar. Template has 0 data-testid markers and 23 event bindings.
- **Imports:** `AutofocusDirective`, `ProfileComponent`, `ExportChoiceModalComponent`
- **Injected services:** `hostElementRef: ElementRef`
- **Inputs:** -
- **Outputs:** `tabSelected`, `tabClosed`, `tabEditStarted`, `tabRenameSubmitted`, `tabRenameCancelled`, `newSessionRequested`, `exportCurrentRequested`, `exportReportRequested`, `fileSelected`
- **Properties:** `selector`, `tabs`, `activeTabId`, `editingTabId`, `mode`, `manageReportExportInternally`, `isAddMenuVisible`, `isHeaderMenuVisible`, `isReportExportModalOpen`, `graphExportOptions`, `tabSelected`, `tabClosed`, `tabEditStarted`, `tabRenameSubmitted`, `tabRenameCancelled`, `newSessionRequested`, `exportCurrentRequested`, `exportReportRequested`, `fileSelected`
- **Methods:** `constructor`, `currentTabs`, `if`, `currentActiveTabId`, `if`, `currentEditingTabId`, `if`, `toggleAddMenu`, `toggleHeaderMenu`, `closeMenus`, `onDocumentClick`, `if`, `createNewTab`, `if`, `openReportExportModal`, `closeReportExportModal`, `exportByType`, `onFileSelected`, `if`, `if`, `handleRename`, `if`, `cancelRename`, `if`, `trackById`, `isPinnedPlaygroundTab`, `displayTabName`, `onTabNameDblClick`, `isActiveTab`, `isEditingTab`, `selectTab`, `if`, `startEditing`, `if`, `closeTab`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `blur`, `keydown.enter`, `keydown.escape`, `keydown.arrowleft`, `keydown.arrowright`, `keydown.home`, `keydown.end`, `click`, `dblclick`, `click`, `change`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `closed`, `optionSelected`

### `AddEntityModalComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/entity-manager/add-entity-modal/add-entity-modal.component.ts`
- **Selector:** `app-add-entity-modal`
- **Template:** `./add-entity-modal.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-add-entity-modal. Template has 8 data-testid markers and 13 event bindings.
- **Imports:** `CommonModule`, `TitleCasePipe`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `close`, `addEntity`
- **Properties:** `selector`, `close`, `addEntity`, `entityValue`, `entityLabel`, `apiQuery`, `inputMode`, `isTouched`, `validationError`, `isValidInput`
- **Methods:** `constructor`, `effect`, `onEntityValueChange`, `onEntityLabelChange`, `onApiQueryChange`, `setInputMode`, `confirm`, `getValidationError`, `if`, `if`, `if`, `if`, `if`, `if`, `getModalTitle`, `if`, `if`, `getSubmitLabel`, `if`
- **Template data-testid markers:** `add-entity-modal-overlay`, `add-entity-modal`, `add-entity-mode-api`, `add-entity-mode-manual`, `add-entity-value-input`, `add-entity-api-query-input`, `add-entity-label-input`, `add-entity-submit`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `input`, `keyup.enter`, `input`, `keyup.enter`, `input`, `keyup.enter`, `click`, `click`

### `EntityManagerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/entity-manager/entity-manager.component.ts`
- **Selector:** `app-entity-manager`
- **Template:** `./entity-manager.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-entity-manager. Template has 0 data-testid markers and 4 event bindings.
- **Imports:** `EntityMenuComponent`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `toggle`, `deleteEntityRequested`
- **Properties:** `selector`, `tabManager`, `api`, `destroyRef`, `extractionTasks`, `isDestroyed`, `isCollapsed`, `isSmallScreen`, `activeTabState`, `toggle`, `deleteEntityRequested`, `addEntityModalData`, `type`, `nodes`, `progress`, `progress`, `next`, `status`, `value`, `error`
- **Methods:** `constructor`, `effect`, `if`, `for`, `ngOnDestroy`, `openAddEntityModal`, `openEditEntityModal`, `if`, `closeAddEntityModal`, `confirmAddEntity`, `if`, `if`, `if`, `if`, `if`, `addEntityToGraph`, `deleteCustomEntity`, `cancelEntityScan`, `getApiConfig`, `switch`, `flattenStrings`, `if`, `if`, `if`, `extractBestValue`, `if`, `startApiExtraction`, `if`, `startApiPolling`, `if`, `if`, `if`, `if`, `if`, `cleanupExtractionTask`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `toggle`, `addEntityClicked`, `entityClicked`, `deleteEntityClicked`

### `EntityMenuComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/entity-menu/entity-menu.component.ts`
- **Selector:** `app-entity-menu`
- **Template:** `./entity-menu.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-entity-menu. Template has 0 data-testid markers and 14 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `toggle`, `addEntityClicked`, `entityClicked`, `deleteEntityClicked`
- **Properties:** `selector`, `isCollapsed`, `isSmallScreen`, `customEntities`, `toggle`, `addEntityClicked`, `entityClicked`, `deleteEntityClicked`, `mobilePanelOpen`, `addSearchTerm`, `entityAddOptions`
- **Methods:** `if`, `onAddSearchInput`, `toggleMobilePanel`, `if`, `closeMobilePanel`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `input`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `input`, `click`, `click`, `click`, `click`

### `FollowerScanPopupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/follower-scan-popup/follower-scan-popup.component.ts`
- **Selector:** `app-follower-scan-popup`
- **Template:** `./follower-scan-popup.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-follower-scan-popup. Template has 10 data-testid markers and 20 event bindings.
- **Imports:** `SocialIconComponent`, `PlatformIconBgDirective`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `close`, `scan`, `fetchFollowers`, `fetchFollowing`
- **Properties:** `selector`, `platform`, `isFetchingFollowers`, `isFetchingFollowing`, `close`, `scan`, `fetchFollowers`, `fetchFollowing`, `activeTab`, `searchTerm`, `selectedUsernames`, `displayFollowers`, `displayFollowing`, `displayConnections`, `isLoadingMoreFollowers`, `isLoadingMoreFollowing`, `isLoadingMoreConnections`, `MAX_SELECTION`, `followers`, `following`, `connections`, `filteredFollowers`, `filteredFollowing`, `filteredConnections`
- **Methods:** `if`, `if`, `if`, `constructor`, `effect`, `effect`, `effect`, `effect`, `onSearchInput`, `toggleSelection`, `if`, `isSelected`, `confirmScan`, `scanSingle`, `loadMoreFollowers`, `loadMoreFollowing`, `loadMoreConnections`, `trackByUsername`, `getProfileUrl`, `getCurrentAccountUrl`, `if`
- **Template data-testid markers:** `social-follower-scan-overlay`, `social-follower-scan-popup`, `social-follower-scan-filter`, `social-follower-tab-followers`, `social-follower-tab-following`, `social-follower-tab-connections`, `follower-scan-single`, `follower-scan-single`, `social-follower-scan-cancel`, `social-follower-scan-confirm`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `input`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `GraphSearchTriggerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/graph-search-trigger/graph-search-trigger.component.ts`
- **Selector:** `app-graph-search-trigger`
- **Template:** `./graph-search-trigger.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-graph-search-trigger. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `triggered`
- **Properties:** `selector`, `triggered`
- **Methods:** -
- **Template data-testid markers:** `social-graph-search-trigger`
- **Template router links:** -
- **Template events:** `click`

### `HomeMenuComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/home-menu/home-menu.component.ts`
- **Selector:** `app-home-menu`
- **Template:** `./home-menu.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-home-menu. Template has 4 data-testid markers and 16 event bindings.
- **Imports:** `SidebarShellComponent`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `toggle`, `tabSelected`, `searchChanged`, `jobClicked`, `entityClicked`, `deleteEntity`, `cancelEntityScan`, `cancelScan`, `cancelAllFetches`
- **Properties:** `selector`, `animationFrameId`, `socialEntityUiService`, `isCollapsed`, `activeTab`, `searchTerm`, `jobs`, `customEntities`, `activeUsernames`, `viewMode`, `isSmallScreen`, `toggle`, `tabSelected`, `searchChanged`, `jobClicked`, `entityClicked`, `deleteEntity`, `cancelEntityScan`, `cancelScan`, `cancelAllFetches`, `state`, `visibleJobsCount`, `visibleEntitiesCount`, `animatedProgressByJobId`, `animatedProgressByEntityId`
- **Methods:** `if`, `constructor`, `effect`, `effect`, `ngOnDestroy`, `if`, `loadMoreJobs`, `loadMoreEntities`, `onSearchInput`, `getJobClasses`, `if`, `if`, `if`, `getEntityClasses`, `if`, `if`, `getEntityProgress`, `getAnimatedEntityProgress`, `if`, `showEntityProgress`, `trackByJobId`, `trackByEntityId`, `getAnimatedProgress`, `if`, `if`, `shouldShowCompletionProgress`, `if`, `isUserBusy`, `pruneAnimatedProgress`, `if`, `pruneAnimatedEntityProgress`, `if`, `startProgressAnimation`, `if`, `for`
- **Template data-testid markers:** `home-menu-tab-history`, `home-menu-tab-entities`, `home-menu-tab-history-collapsed`, `home-menu-tab-entities-collapsed`
- **Template router links:** -
- **Template events:** `toggleClicked`, `input`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `ListViewComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/list-view/list-view.component.ts`
- **Selector:** `app-list-view`
- **Template:** `./list-view.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-list-view. Template has 6 data-testid markers and 9 event bindings.
- **Imports:** `SocialIconComponent`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `nodeClicked`, `platformNodeClicked`, `deleteCustomEntity`
- **Properties:** `selector`, `scanResults`, `customEntities`, `isSmallScreen`, `expandedPlatformNodeId`, `nodeClicked`, `platformNodeClicked`, `deleteCustomEntity`, `state`, `socialEntityUiService`, `expandedEntityIds`, `formatFollowers`, `formatKey`, `isUrl`, `isImageUrl`, `activeUserNodes`, `activeEntityNodesOnGraph`, `connectedNodeId`, `connectedNodeId`
- **Methods:** `getPlatformsForUserNode`, `getFollowers`, `getFollowing`, `getFollowerPreview`, `getFollowingPreview`, `getFollowerSummary`, `if`, `if`, `if`, `getProfileUrl`, `getPlatformData`, `if`, `getEntityData`, `getEntityReportRecords`, `getEntityRecordEntries`, `getNodeById`, `getConnectionsForNode`, `if`, `if`, `if`, `getNodeIcon`, `if`, `getMetadataEntries`, `trackById`, `trackByKey`, `trackByUsername`, `trackConnectionById`, `isEntityExpanded`, `toggleEntity`
- **Template data-testid markers:** `social-list-user-summary-trigger`, `social-list-manage-profiles`, `social-list-platform-row`, `social-list-platform-open-link`, `social-list-followers-following`, `social-list-platform-visit-profile`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `MetadataPopupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/metadata-popup/metadata-popup.component.ts`
- **Selector:** `app-metadata-popup`
- **Template:** `./metadata-popup.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-metadata-popup. Template has 18 data-testid markers and 27 event bindings.
- **Imports:** `SocialIconComponent`, `PlatformIconBgDirective`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `close`, `fetchProfile`, `fetchPosts`, `fetchImages`, `fetchFollowers`, `fetchFollowing`, `scanUsernames`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchImages`, `cancelFetchFollowers`, `cancelFetchFollowing`
- **Properties:** `selector`, `isScanInProgress`, `close`, `fetchProfile`, `fetchPosts`, `fetchImages`, `fetchFollowers`, `fetchFollowing`, `scanUsernames`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchImages`, `cancelFetchFollowers`, `cancelFetchFollowing`, `isFetching`, `isFetchingPosts`, `isFetchingImages`, `isFetchingFollowers`, `isFetchingFollowing`, `formatFollowers`, `formatKey`, `isUrl`, `isImageUrl`
- **Methods:** `constructor`, `effect`, `getPlatformUniqueKey`, `onClose`, `getMetadataEntries`, `getProfileDetailEntries`, `trackByKey`, `trackByPostUrl`, `trackByUsername`, `trackByImageUrl`, `trackByIndex`, `getAccountUrl`
- **Template data-testid markers:** `social-platform-popup-overlay`, `social-platform-popup`, `social-platform-popup-visit-profile`, `social-platform-popup-close-icon`, `social-platform-popup-profile-details`, `social-platform-popup-fetch-profile`, `social-platform-popup-recent-posts`, `social-platform-popup-fetch-posts`, `social-platform-popup-post-connections`, `social-platform-popup-followers`, `social-platform-popup-fetch-followers`, `social-platform-popup-following`, `social-platform-popup-fetch-following`, `social-platform-popup-images`, `social-platform-popup-fetch-images-inline`, `social-platform-popup-fetch-images`, `social-platform-popup-raw-metadata`, `social-platform-popup-done`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `ContextMenuComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/network-graph/context-menu/context-menu.component.ts`
- **Selector:** `app-context-menu`
- **Template:** `./context-menu.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-context-menu. Template has 1 data-testid markers and 9 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `action`
- **Properties:** `selector`, `action`, `menuTitle`, `menuSubtitle`, `menuPosition`
- **Methods:** `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `toPositionValue`
- **Template data-testid markers:** `social-context-menu-panel`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `NetworkGraphComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/network-graph/network-graph.component.ts`
- **Selector:** `app-network-graph`
- **Template:** `./network-graph.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-network-graph. Template has 2 data-testid markers and 3 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `nodeClicked`, `platformNodeClicked`, `relationshipNodeClicked`, `groupClicked`, `followersShortcutClicked`, `dragStart`, `zoom`, `edgeAdded`, `edgeDeleted`
- **Properties:** `selector`, `networkInstance`, `visData`, `animationFrameId`, `animationStartTime`, `minZoomLockPosition`, `data`, `focusNodeId`, `editMode`, `physicsEnabled`, `searchTerm`, `nodesWithFollows`, `container`, `nodeClicked`, `platformNodeClicked`, `relationshipNodeClicked`, `groupClicked`, `followersShortcutClicked`, `dragStart`, `zoom`, `edgeAdded`, `edgeDeleted`, `state`, `selectedEdgeId`, `deleteButtonState`
- **Methods:** `focus`, `addEdgeMode`, `disableEditMode`, `unselectAll`, `setOptions`, `redraw`, `getPositions`, `getScale`, `getPosition`, `canvasToDOM`, `on`, `getNodeAt`, `getViewPosition`, `moveTo`, `destroy`, `for`, `if`, `for`, `if`, `if`, `for`, `if`, `normalizeSearchValue`, `getGraphNodeLabelColor`, `if`, `constructor`, `effect`, `effect`, `if`, `effect`, `if`, `effect`, `if`, `effect`, `if`
- **Template data-testid markers:** `social-relationship-node-trigger`, `social-network-container`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `NotificationBarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/notification-bar/notification-bar.component.ts`
- **Selector:** `app-notification-bar`
- **Template:** `./notification-bar.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-notification-bar. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `CommonModule`, `NgClass`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ManageProfilesModalComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/profile-summary-popup/manage-profiles-modal/manage-profiles-modal.component.ts`
- **Selector:** `app-manage-profiles-modal`
- **Template:** `./manage-profiles-modal.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-manage-profiles-modal. Template has 7 data-testid markers and 17 event bindings.
- **Imports:** `SocialIconComponent`, `PlatformIconBgDirective`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `close`, `updateGraph`, `searchUsername`
- **Properties:** `selector`, `close`, `updateGraph`, `searchUsername`, `platforms`, `searchTerm`, `visibleCount`, `filteredPlatforms`, `displayPlatforms`, `hasMatches`, `areAllVisibleSelected`, `areAllVisibleDeselected`, `stableKey`, `resolvedUrl`, `resolvedUrl`, `resolvedUrl`, `resolvedUrl`
- **Methods:** `if`, `if`, `if`, `constructor`, `effect`, `if`, `if`, `if`, `if`, `onSearchChanged`, `clearSearch`, `isImageFlowUsername`, `isImageExtractedFlow`, `if`, `isInformational`, `loadMore`, `hasValidDraftUsername`, `extractMatchedPageUrl`, `getProfileUrl`, `if`, `if`, `if`, `if`, `if`, `isProfileUrlDisabled`, `onOpenProfileClick`, `onUsernameChanged`, `if`, `onSearchUsernameClick`, `if`, `onPlatformCardClick`, `toggleSelection`, `if`, `onUsernameInputClick`, `onSelectionSwitchClick`
- **Template data-testid markers:** `social-manage-profiles-overlay`, `social-manage-profiles-modal`, `social-manage-profiles-filter`, `social-manage-profiles-select-all`, `social-manage-profiles-deselect-all`, `social-manage-profiles-cancel`, `social-manage-profiles-update-graph`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `input`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `input`, `click`, `click`, `click`, `click`, `click`

### `ProfileSummaryPopupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/profile-summary-popup/profile-summary-popup.component.ts`
- **Selector:** `app-profile-summary-popup`
- **Template:** `./profile-summary-popup.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-profile-summary-popup. Template has 4 data-testid markers and 22 event bindings.
- **Imports:** `SocialIconComponent`, `SummaryAllPlatformsViewComponent`, `SummaryPlatformViewComponent`, `PlatformIconBgDirective`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `close`, `fetchProfile`, `fetchPosts`, `fetchFollowers`, `fetchFollowing`, `fetchPlatformImages`, `rescan`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchFollowers`, `cancelFetchFollowing`, `cancelFetchPlatformImages`, `cancelAllFetches`
- **Properties:** `username`, `platforms`, `email`, `isScanInProgress`, `close`, `fetchProfile`, `fetchPosts`, `fetchFollowers`, `fetchFollowing`, `fetchPlatformImages`, `rescan`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchFollowers`, `cancelFetchFollowing`, `cancelFetchPlatformImages`, `cancelAllFetches`, `platformSearchTerm`, `selectedPlatform`, `selectedPlatformDetails`, `isAllPlatformsSelected`, `filteredPlatforms`, `isAnythingFetching`, `totalPlatforms`, `populatedProfilesCount`
- **Methods:** `if`, `if`, `constructor`, `effect`, `if`, `if`, `onSearchTermChange`, `clearSearch`, `onClose`, `onAllPlatformsClick`, `onPlatformClick`, `isSelected`, `if`, `trackByUrl`
- **Template data-testid markers:** `social-summary-popup-overlay`, `social-summary-popup`, `social-summary-platform-filter`, `social-summary-all-platforms`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `input`, `click`, `click`, `click`, `fetchProfile`, `fetchPosts`, `fetchFollowers`, `fetchFollowing`, `fetchPlatformImages`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchFollowers`, `cancelFetchFollowing`, `cancelFetchPlatformImages`, `fetchProfile`, `fetchPosts`, `fetchPlatformImages`

### `SummaryAllPlatformsViewComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-all-platforms-view/summary-all-platforms-view.component.ts`
- **Selector:** `app-summary-all-platforms-view`
- **Template:** `./summary-all-platforms-view.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-summary-all-platforms-view. Template has 0 data-testid markers and 26 event bindings.
- **Imports:** `CommonModule`, `SocialIconComponent`, `PlatformIconBgDirective`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `fetchProfile`, `fetchPosts`, `fetchPlatformImages`, `scanUsernames`
- **Properties:** `selector`, `tabManager`, `destroyRef`, `username`, `email`, `platforms`, `isScanInProgress`, `fetchProfile`, `fetchPosts`, `fetchPlatformImages`, `scanUsernames`, `detailsSearchTerm`, `postsSearchTerm`, `imagesSearchTerm`, `visibleDetailsPlatformsCount`, `visiblePostsPlatformsCount`, `visibleImagesPlatformsCount`, `fetchingState`, `formatKey`, `profileLeaksLoading`, `profileLeaksLoaded`, `profileLeaksError`, `profileBreachCards`, `profileStealerRows`, `profileMetadataTokenInput`
- **Methods:** `constructor`, `effect`, `if`, `effect`, `if`, `loadMoreDetailsPlatforms`, `loadMorePostsPlatforms`, `loadMoreImagesPlatforms`, `onDetailsSearch`, `onPostsSearch`, `onImagesSearch`, `clearDetailsSearch`, `clearPostsSearch`, `clearImagesSearch`, `getProfileDetailEntries`, `getPlatformUniqueKey`, `getVisiblePostConnections`, `canLoadMorePostConnections`, `loadMorePlatformPostConnections`, `fetchProfileLeaks`, `if`, `fetchProfileMetadata`, `if`, `if`, `if`, `removeMetadataToken`, `clearMetadataTokens`, `isArrayValue`, `filterPlatforms`, `if`, `if`, `if`, `incrementVisible`, `onSearch`, `clearSearch`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `input`, `keydown`, `blur`, `click`, `click`, `input`, `click`, `click`, `click`, `input`, `click`, `click`, `click`, `input`, `click`, `click`, `click`, `click`, `input`, `click`, `click`, `click`, `click`

### `SummaryPlatformViewComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/profile-summary-popup/summary-platform-view/summary-platform-view.component.ts`
- **Selector:** `app-summary-platform-view`
- **Template:** `./summary-platform-view.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-summary-platform-view. Template has 0 data-testid markers and 29 event bindings.
- **Imports:** `CommonModule`, `SocialIconComponent`, `PlatformIconBgDirective`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `fetchProfile`, `fetchPosts`, `fetchFollowers`, `fetchFollowing`, `fetchPlatformImages`, `scanUsernames`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchFollowers`, `cancelFetchFollowing`, `cancelFetchPlatformImages`
- **Properties:** `selector`, `destroyRef`, `platform`, `isScanInProgress`, `fetchProfile`, `fetchPosts`, `fetchFollowers`, `fetchFollowing`, `fetchPlatformImages`, `scanUsernames`, `cancelFetchProfile`, `cancelFetchPosts`, `cancelFetchFollowers`, `cancelFetchFollowing`, `cancelFetchPlatformImages`, `fetchingState`, `formatFollowers`, `formatKey`, `metadataTokenInput`, `metadataTokens`, `metadataLoading`, `metadataLoaded`, `metadataError`, `metadataResult`, `next`
- **Methods:** `constructor`, `effect`, `getPlatformUniqueKey`, `getProfileDetailEntries`, `getAccountUrl`, `trackByIndex`, `fetchPlatformMetadata`, `if`, `if`, `removeMetadataToken`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `input`, `keydown`, `blur`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `RelationshipDetailsPopupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/relationship-details-popup/relationship-details-popup.component.ts`
- **Selector:** `app-relationship-details-popup`
- **Template:** `./relationship-details-popup.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-relationship-details-popup. Template has 4 data-testid markers and 4 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** `close`
- **Properties:** `selector`, `close`
- **Methods:** `trackByConnection`, `relationLabel`, `if`, `if`, `getAccountUrl`
- **Template data-testid markers:** `social-relationship-popup-overlay`, `social-relationship-popup`, `social-relationship-open-account`, `social-relationship-close`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`

### `SocialMapperComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/graphs/social-graph/social-mapper.component.ts`
- **Selector:** `app-social-graph`
- **Template:** `./social-mapper.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-social-graph. Template has 9 data-testid markers and 80 event bindings.
- **Imports:** `NetworkGraphComponent`, `MetadataPopupComponent`, `ProfileSummaryPopupComponent`, `HomeMenuComponent`, `ListViewComponent`, `TabBarComponent`, `FollowerScanPopupComponent`, `ManageProfilesModalComponent`, `ConfirmationPopupComponent`, `MessagePopupComponent`, `ContextMenuComponent`, `NotificationBarComponent`, `EntityManagerComponent`, `AddEntityModalComponent`, `RelationshipDetailsPopupComponent`
- **Injected services:** `scanService: SocialScanService`, `destroyRef: DestroyRef`, `tabManager: TabManagerService`, `fetchingState: FetchingStateService`, `graphOrchestrator: GraphOrchestratorService`, `scanJobService: SocialScanJobService`, `platformFetchService: PlatformFetchService`, `relationshipResolver: RelationshipResolverService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `cancelScanSubjects`, `cancelProfileFetchSubjects`, `cancelPostFetchSubjects`, `cancelPlatformImageFetchSubjects`, `cancelFollowersFetchSubjects`, `cancelFollowingFetchSubjects`, `mediaQueryList`, `state`, `isTailwindReady`, `searchTerm`, `homeMenuSearchTerm`, `jobs`, `networkData`, `scanResults`, `activeUsernames`, `customEntities`, `isEditMode`, `isHomeMenuCollapsed`, `isEntityMenuCollapsed`, `activeHomeMenuTab`, `isPhysicsEnabled`, `viewMode`, `expandedPlatformNodeId`, `graphSearchTerm`
- **Methods:** `for`, `if`, `requireActiveTabState`, `if`, `effect`, `effect`, `if`, `if`, `if`, `if`, `ngOnInit`, `ngOnDestroy`, `isScanInProgressForUsername`, `if`, `updateState`, `if`, `if`, `onSearchChanged`, `onViewModeChanged`, `onPhysicsToggled`, `onEditModeToggled`, `onHomeMenuSearchChanged`, `onHomeMenuToggled`, `onEntityMenuToggled`, `onHomeMenuTabSelected`, `onGraphSearchChanged`, `toggleGraphSearch`, `expandGraphSearch`, `collapseGraphSearch`, `clearGraphSearch`, `onPlatformAliasInputChanged`, `closePlatformAliasModal`, `savePlatformAlias`, `if`, `if`
- **Template data-testid markers:** `social-graph-root`, `social-graph-search-input`, `social-graph-search-clear`, `social-context-menu`, `social-alias-modal-overlay`, `social-alias-modal`, `social-alias-input`, `social-alias-cancel`, `social-alias-save`
- **Template router links:** -
- **Template events:** `change`, `click`, `toggle`, `tabSelected`, `searchChanged`, `jobClicked`, `entityClicked`, `deleteEntity`, `cancelEntityScan`, `cancelScan`, `cancelAllFetches`, `searchChanged`, `searchSubmitted`, `imageSearchClicked`, `viewModeChanged`, `physicsToggled`, `editModeToggled`, `triggered`, `input`, `blur`, `click`, `click`, `nodeClicked`, `platformNodeClicked`, `relationshipNodeClicked`, `groupClicked`, `followersShortcutClicked`, `dragStart`, `zoom`, `edgeAdded`, `edgeDeleted`, `nodeClicked`, `platformNodeClicked`, `deleteCustomEntity`, `toggle`

### `HomeInsightComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/home-insight/home-insight.component.ts`
- **Selector:** `app-home-insight`
- **Template:** `./home-insight.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-home-insight. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** `NgOptimizedImage`, `NgClass`, `TooltipDirective`
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `appService: AppService`, `licenseService: LicenseService`, `insightCacheService: InsightCacheService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `insights`, `latestDocuments`, `models`, `latestDocumentModelKeys`, `isLoading`, `loadingCards`, `model`
- **Methods:** `constructor`, `ngOnInit`, `if`, `applyInsightData`, `getKeys`, `formatModelKey`, `getResultItems`, `openReport`, `getModelRoute`, `if`, `trimUrl`, `if`
- **Template data-testid markers:** `open-report`
- **Template router links:** -
- **Template events:** `click`

### `HomeSearchComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/home-search/home-search.component.ts`
- **Selector:** `app-home-search`
- **Template:** `./home-search.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-home-search. Template has 2 data-testid markers and 13 event bindings.
- **Imports:** `FormsModule`, `NgOptimizedImage`, `CommonModule`, `RouterLink`, `SearchFiltersComponent`, `HomeInsightComponent`, `WorldHeatmapComponent`, `DemoTourComponent`
- **Injected services:** `dashboardService: DashboardService`, `route: ActivatedRoute`, `router: Router`, `app_service: AppService`, `authService: AuthService`, `licenseService: LicenseService`, `homeSearchService: HomeSearchService`
- **Inputs:** `isRoleAdmin`, `hideToolsSection`, `hideHeatmapAndAnalytics`, `compactLayout`
- **Outputs:** -
- **Properties:** `selector`, `insightPointerId`, `insightStartY`, `insightStartOffset`, `insightMoved`, `suppressInsightClick`, `insightMax`, `removeWindowListeners`, `searchQuery`, `selectedSearchBy`, `homeInsightExpanded`, `insightDragging`, `insightDragY`, `insightTranslateY`, `selectedTab`, `isRoleAdmin`, `hideToolsSection`, `hideHeatmapAndAnalytics`, `compactLayout`
- **Methods:** `constructor`, `ngOnInit`, `onResize`, `computeInsightMax`, `getInsightTransform`, `refreshInsightTransformClass`, `onSetMatchType`, `onSearchSubmit`, `getMatchType`, `if`, `if`, `if`, `setFilterOverlay`, `onAdvanceSettingToggle`, `onToolToggle`, `onSearchInput`, `clearSearchInput`, `if`, `closeMatchTypeDropdown`, `if`, `onInsightToggleClick`, `if`, `if`, `onInsightPointerDown`, `attachWindowPointerListeners`, `detachWindowPointerListeners`, `if`, `onInsightPointerMove`, `if`, `onInsightPointerUp`, `if`, `if`, `onInsightPointerCancel`, `if`, `selectTab`
- **Template data-testid markers:** `ioc-basic-tag-AI`, `homepage-search-input`
- **Template router links:** `[`
- **Template events:** `click`, `submit`, `focus`, `input`, `click`, `change`, `click`, `click`, `click`, `click`, `click`, `click`, `pointerdown`

### `HomepageComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/homepage.component.ts`
- **Selector:** `app-index`
- **Template:** `./homepage.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-index. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `HomeSearchComponent`
- **Injected services:** `router: Router`, `authService: AuthService`, `licenseService: LicenseService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** `constructor`, `ngOnInit`, `if`, `ngAfterViewInit`, `scrollToElement`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SearchFiltersComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/search-filters/search-filters.component.ts`
- **Selector:** `app-search-filters`
- **Template:** `./search-filters.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-search-filters. Template has 3 data-testid markers and 12 event bindings.
- **Imports:** `FormsModule`, `CommonModule`
- **Injected services:** `helperService: HelperService`, `app_service: AppService`, `suggestionService: SuggestionService`
- **Inputs:** `showSorting`, `homePage`
- **Outputs:** `checkDomain`, `searchFiltersChange`
- **Properties:** `selector`, `filteredCategories`, `categories`, `suggestionsMap`, `filteredSuggestions`, `showSuggestions`, `selectedCategoryId`, `entitySearch`, `newValue`, `showLeftFade`, `showRightFade`, `showSorting`, `homePage`, `checkDomain`, `searchFiltersChange`, `trimmed`, `id`, `tags`, `id`
- **Methods:** `constructor`, `ngOnInit`, `initializeFilterCategories`, `scrollLeft`, `scrollRight`, `addTag`, `if`, `if`, `getTags`, `removeTag`, `clearSelection`, `updateService`, `toggleExpand`, `onEntityFilterToggle`, `hasAnyTags`, `onCategoryClick`, `initCategories`, `if`, `if`, `if`, `if`, `if`, `onFilterInputChange`, `if`, `onSuggestionClick`, `toTestId`
- **Template data-testid markers:** `entity-filter-clear-selection`, `entity-filter-value-input`, `entity-filter-add-value`
- **Template router links:** -
- **Template events:** `click`, `keydown.enter`, `ngModelChange`, `click`, `click`, `click`, `input`, `keydown.enter`, `click`, `click`, `ngModelChange`, `click`

### `SelectedFilterBarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/selected-filter-bar/selected-filter-bar.component.ts`
- **Selector:** `app-selected-filter-bar`
- **Template:** `./selected-filter-bar.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-selected-filter-bar. Template has 0 data-testid markers and 6 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** `app_service: AppService`, `dashboardService: DashboardService`, `router: Router`
- **Inputs:** `showSorting`
- **Outputs:** `clearAll`, `searchFiltersChange`
- **Properties:** `selector`, `categories`, `isFilterBarExpanded`, `maxVisibleTags`, `showSorting`, `clearAll`, `searchFiltersChange`
- **Methods:** `isLightTheme`, `constructor`, `isConsolidatedRoute`, `ngOnInit`, `clearMatchType`, `clearFilters`, `if`, `if`, `if`, `removeEntityTypeFilterTag`, `for`, `toggleFilterBarCollapse`, `sidebarFilters`, `sidebarFilterCount`, `if`, `entityFiltersCount`, `getVisibleTags`, `getHiddenTagCount`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`

### `HeatmapReportComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/world-heatmap/heatmap-report/heatmap-report.component.ts`
- **Selector:** `app-heatmap-report`
- **Template:** `./heatmap-report.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-heatmap-report. Template has 3 data-testid markers and 4 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `reports`, `loading`, `loadingMore`, `hasMore`
- **Outputs:** `close`, `loadMore`
- **Properties:** `selector`, `loading`, `loadingMore`, `hasMore`, `close`, `loadMore`
- **Methods:** `closePopup`, `onLoadMore`
- **Template data-testid markers:** `heatmap-report-overlay`, `heatmap-report-close`, `heatmap-report-load-more`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`

### `WorldHeatmapComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/homepage/world-heatmap/world-heatmap.component.ts`
- **Selector:** `app-world-heatmap`
- **Template:** `./world-heatmap.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-world-heatmap. Template has 2 data-testid markers and 2 event bindings.
- **Imports:** `HeatmapReportComponent`
- **Injected services:** `route: ActivatedRoute`, `appService: AppService`, `apiService: ApiService`, `insightCacheService: InsightCacheService`
- **Inputs:** `canOpenReports`
- **Outputs:** -
- **Properties:** `categoryOrder`, `valueByName`, `selectedName`, `neutralFill`, `selectedCountryPage`, `canOpenReports`, `activeCategoryKey`, `selectedCountryReports`, `mapData`, `isOpenCountryReport`, `isCountryReportLoading`, `isCountryReportLoadingMore`, `hasMoreCountryReports`, `isMapLoading`, `index`, `x`, `y`, `x`, `y`
- **Methods:** `isLightTheme`, `if`, `getLegendColors`, `constructor`, `ngOnInit`, `if`, `ngAfterViewInit`, `ngOnDestroy`, `ngOnChanges`, `if`, `if`, `onResize`, `waitForWorldJsonAndRender`, `getAvailableCategories`, `applyInsightData`, `if`, `buildIndex`, `for`, `if`, `startCategoryRotation`, `if`, `ensureLegendDefs`, `if`, `for`, `updateLegend`, `if`, `updateActiveCategoryLabel`, `if`, `createChart`, `if`, `for`, `for`, `getValueForFeature`, `getColorScale`, `return`
- **Template data-testid markers:** `world-heatmap-map`, `heatmap-report`
- **Template router links:** -
- **Template events:** `loadMore`, `close`

### `AiSummaryComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/ai-workspace/ai-summary/ai-summary.component.ts`
- **Selector:** `app-ai-summary`
- **Template:** `./ai-summary.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-ai-summary. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `content`
- **Outputs:** -
- **Properties:** `content`, `next`, `error`
- **Methods:** `constructor`, `summarize`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AiWorkspaceComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/ai-workspace/ai-workspace.component.ts`
- **Selector:** `app-ai-workspace`
- **Template:** `./ai-workspace.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-ai-workspace. Template has 7 data-testid markers and 6 event bindings.
- **Imports:** `CommonModule`, `DatePipe`, `FormsModule`, `RouterLink`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `messageDraft`, `messages`, `next`, `error`, `chat_history`, `error`, `next`, `error`, `userOverflow`, `botOverflow`
- **Methods:** `constructor`, `ngOnInit`, `sendMessage`, `if`, `onComposerKeydown`, `if`, `usePrompt`, `retryMessage`, `stopMessageGeneration`, `startNewChat`, `trackMessage`, `createMessage`, `createErrorMessage`, `createCancelledMessage`, `restoreChatHistory`, `persistChatHistory`, `loadChatHistory`, `buildChatHistoryPayload`, `for`, `if`, `for`, `if`, `if`, `scrollToBottom`, `requestAnimationFrame`, `if`, `if`, `if`
- **Template data-testid markers:** `consolidated-tab-ai`, `consolidated-tab-iocs`, `consolidated-tab-deep-search`, `consolidated-tab-network-intelligence`, `chat-widget-messages`, `chat-widget-input`, `chat-widget-send`
- **Template router links:** `[`, `[`, `[`, `[`
- **Template events:** `click`, `click`, `click`, `click`, `keydown`, `click`

### `ChatWidgetComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/ai-workspace/chat-widget/chat-widget.component.ts`
- **Selector:** `app-chat-widget`
- **Template:** `./chat-widget.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-chat-widget. Template has 4 data-testid markers and 8 event bindings.
- **Imports:** `CommonModule`, `FormsModule`
- **Injected services:** `appService: AppService`, `dashboardService: DashboardService`, `cdr: ChangeDetectorRef`, `zone: NgZone`, `subscriptionService: SubscriptionService`, `nexusChatService: NexusChatService`
- **Inputs:** `reportText`
- **Outputs:** -
- **Properties:** `selector`, `isBotTyping`, `botStep`, `newMessage`, `chatOpen`, `reportText`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `if`, `ngAfterViewInit`, `ngOnDestroy`, `sendMessage`, `if`, `if`, `aiSuggest`, `showErrorMessage`, `retryMessage`, `openChat`, `closeChat`, `trackByIndex`, `pushButton`, `setTimeout`, `onMessagesScroll`, `isAtBottom`, `if`, `scrollToNewMessage`, `if`, `requestAnimationFrame`, `scrollToBottom`, `if`, `setupObserversIfPossible`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** `chat-widget-open`, `chat-widget-messages`, `chat-widget-input`, `chat-widget-send`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `scroll`, `click`, `submit`, `click`

### `DashboardApiComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-api/dashboard-api.component.ts`
- **Selector:** `app-dashboard-api`
- **Template:** `./dashboard-api.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-dashboard-api. Template has 17 data-testid markers and 14 event bindings.
- **Imports:** `FormsModule`, `NgOptimizedImage`, `EmptyResultComponent`, `EmptyQueryComponent`, `NgClass`, `UpperCasePipe`
- **Injected services:** `route: ActivatedRoute`, `http: HttpClient`, `graphReportExport: ReportExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `q2`, `displayQ1`, `displayQ2`, `loading`, `breachData`, `query_triggered`, `apiType`, `progress`, `currentStep`, `responseData`, `txDrilldown`, `prevResponseData`, `prevQ1`, `prevQ2`, `prevDisplayQ1`, `prevDisplayQ2`, `prevBreachData`, `expandedResultIndex`, `cryptoSummaryExpanded`, `trackByIndex`, `payload`, `payload`, `payload`, `payload`
- **Methods:** `constructor`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `isArrayValue`, `deduplicateWithCount`, `getGenericTotalFieldCount`, `getVisibleObjectEntries`, `ngOnInit`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `openTx`, `if`, `if`, `if`, `openAddr`, `if`, `backFromTx`, `onSearchSubmit`, `if`
- **Template data-testid markers:** `scan-primary-input`, `scan-search-button`, `scan-secondary-input`, `scan-search-button`, `ioc-threat-table-loading`, `scan-success-badge`, `scan-download-report`, `ioc-threat-table`, `ioc-threat-row`, `ioc-threat-row-toggle`, `defacement-report-card`, `defacement-report-card-title`, `ioc-threat-table`, `ioc-threat-row`, `ioc-threat-row-toggle`, `defacement-report-card`, `defacement-report-card-title`
- **Template router links:** -
- **Template events:** `submit`, `click`, `click`, `click`, `click`, `click`, `click`, `keydown.enter`, `keydown.space`, `click`, `click`, `keydown.enter`, `keydown.space`, `click`

### `ConsolidatedIocComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-ioc/consolidated-ioc.component.ts`
- **Selector:** `app-consolidated-ioc`
- **Template:** `./consolidated-ioc.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-consolidated-ioc. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `CredentialComponent`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ConsolidatedScanComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-consolidated/consolidated-scan/consolidated-scan.component.ts`
- **Selector:** `app-consolidated-scan`
- **Template:** `./consolidated-scan.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-consolidated-scan. Template has 6 data-testid markers and 1 event bindings.
- **Imports:** `CommonModule`, `RouterLink`
- **Injected services:** `api: ConsolidatedApiService`
- **Inputs:** `isLoading`
- **Outputs:** -
- **Properties:** `selector`, `progressByType`, `liveApiEntities`, `today`, `isProcessing`, `isCollapsed`, `targetLabel`, `expectedTypes`, `liveApiResults`, `isLoading`, `error`, `name`
- **Methods:** `constructor`, `toggleCollapse`, `clearResults`, `if`, `if`, `if`, `runScan`, `if`, `if`, `for`, `if`, `if`, `isPending`, `clamp`, `if`, `if`, `extractLiveApiEntities`, `if`, `if`, `if`, `if`, `if`, `for`, `if`, `if`, `for`, `for`, `if`, `gradeBadgeClass`, `if`, `gradeText`
- **Template data-testid markers:** `consolidated-scan-section`, `consolidated-scan-title`, `consolidated-scan-openweb-title`, `consolidated-scan-openweb-detail`, `consolidated-scan-liveapi-title`, `consolidated-scan-liveapi-detail`
- **Template router links:** `{ seo: `
- **Template events:** `click`

### `DashboardConsolidatedComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-consolidated/dashboard-consolidated.component.ts`
- **Selector:** `app-dashboard-consolidated`
- **Template:** `./dashboard-consolidated.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-consolidated. Template has 0 data-testid markers and 5 event bindings.
- **Imports:** `ResultComponent`, `DashboardResultsGeneralComponent`, `TitleCasePipe`, `DashboardResultExploitComponent`, `DashboardResultChatComponent`, `SortGroupedResultsPipe`, `TooltipDirective`, `DashboardResultSocialComponent`, `ResultInsightsComponent`, `ThreatResultsComponent`, `ConsolidatedScanComponent`, `ConsolidatedIocComponent`, `NetworkIntel`, `CrossSearchCardComponent`
- **Injected services:** `http: HttpClient`, `appService: AppService`, `dashboardService: DashboardService`, `router: Router`, `route: ActivatedRoute`, `cdr: ChangeDetectorRef`, `selectionStore: SelectionStoreService`, `licenseService: LicenseService`, `authService: AuthService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `consolidatedCallbackModel`, `stealerlogCallbackModel`, `groupedResults`, `pageCounts`, `isGrouped`, `isIOC`, `isNetworkIntel`, `query`, `isLoading`, `isStealerLogLoading`, `firstTrigger`, `result_count`, `apiCategories`, `dumpCategories`, `newsCategories`, `socialCategories`, `generalCategories`, `leakCategories`, `defacementCategories`, `rankedResult`, `showScanCard`, `queryParams`, `firstSubcategory`, `firstSubcategory`
- **Methods:** `if`, `if`, `if`, `if`, `constructor`, `ngAfterViewInit`, `ngOnInit`, `if`, `fetchSearchResults`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `resetFilters`, `reloadFilters`, `fetchRanked`, `if`, `populateGroupedResults`, `onUpdateQuery`, `getTotalResultCount`, `if`, `isIpReportExpandable`, `onSectionSelected`, `switch`, `if`, `getCategoryFromKey`, `switch`, `onToggleMenu`, `if`, `if`, `checkMember`, `hasIOCs`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `reloadData`, `onToggleSwitch`, `updateQuery`, `reloadFilters`, `click`

### `ThreatResultsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-consolidated/defacement-results/threat-results.component.ts`
- **Selector:** `app-defacement-results`
- **Template:** `./threat-results.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-defacement-results. Template has 6 data-testid markers and 16 event bindings.
- **Imports:** `CommonModule`, `TooltipDirective`
- **Injected services:** `helperService: HelperService`, `dashboardService: DashboardService`, `rowHelper: ResultRowHelperService`
- **Inputs:** `isExpandableInput`, `results_defacement`, `results_stealerlog`
- **Outputs:** -
- **Properties:** `selector`, `copiedTimer`, `isExpandableInput`, `showLimitDefacement`, `showLimitStealer`, `threatTypeCounts`, `copiedKey`, `results_defacement`, `results_stealerlog`, `isExpandable`, `q`, `route`, `type`, `type`
- **Methods:** `constructor`, `effect`, `isLightTheme`, `ngOnInit`, `if`, `ngOnChanges`, `if`, `if`, `if`, `updateThreatTypeCounts`, `explore`, `if`, `if`, `exploreStealer`, `toggleResultsBarCollapse`, `onShowMore`, `if`, `onFilterTypeClick`, `if`, `if`, `if`, `isCopied`, `copyText`, `webServerValue`, `attackerValue`, `teamValue`, `ipValue`, `urlValue`, `dateValue`, `usernameValue`, `passwordValue`, `domainValue`, `hashValue`, `stealerUrlValue`, `truncate`
- **Template data-testid markers:** `defacement-report`, `defacement-report-title`, `defacement-report-chip`, `defacement-report-toggle`, `defacement-report-card`, `defacement-report-card-title`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `DashboardResultContainer`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-result-container/dashboard-result-container.component.ts`
- **Selector:** `app-dashboard-result-container`
- **Template:** `./dashboard-result-container.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-dashboard-result-container. Template has 0 data-testid markers and 5 event bindings.
- **Imports:** `PaginationComponent`, `DashboardResultsGeneralComponent`, `ResultComponent`, `CrossSearchCardComponent`, `DashboardResultExploitComponent`, `DashboardResultSocialComponent`, `DashboardResultChatComponent`, `DashboardResultDefacementComponent`
- **Injected services:** `helperService: HelperService`, `appService: AppService`, `dashboardService: DashboardService`, `router: Router`, `route: ActivatedRoute`, `cdr: ChangeDetectorRef`, `scrollService: ScrollService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `currentResultModel`, `maxPages`, `isResponseLoading`, `type`, `apiEndpoint`, `key`, `key`, `order`, `order`
- **Methods:** `constructor`, `ngAfterViewInit`, `ngAfterViewChecked`, `requestAnimationFrame`, `ngOnInit`, `fetchSearchResults`, `if`, `if`, `onPageChange`, `reloadFilters`, `onUpdateQuery`, `onToggleSort`, `if`, `if`, `if`, `hasResultData`, `buildCacheKey`, `restoreSavedScroll`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `onToggleSort`, `reloadData`, `reloadFilters`, `updateQuery`, `pageChange`

### `DashboardResultChatComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-chat/dashboard-result-chat.component.ts`
- **Selector:** `app-dashboard-result-chat`
- **Template:** `./dashboard-result-chat.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-dashboard-result-chat. Template has 4 data-testid markers and 6 event bindings.
- **Imports:** `DatePipe`, `SlicePipe`, `TooltipDirective`, `CommonModule`, `NormalizeUnicodePipe`, `RouterLink`
- **Injected services:** `authService: AuthService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService`
- **Inputs:** `searchResults`, `isExpandAble`
- **Outputs:** -
- **Properties:** `selector`, `currentUrl`, `queryParams`, `isCollapsed`, `isConsolidatedView`, `searchResults`, `isExpandAble`
- **Methods:** `constructor`, `ngAfterViewInit`, `ngOnInit`, `openExternalUrl`
- **Template data-testid markers:** `result-card`, `open-cti-graph`, `open-report`, `consolidated-section-see-more`
- **Template router links:** `[currentUrl, item.m_hash]`
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`

### `DashboardResultDefacementComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-defacement/dashboard-result-defacement.component.ts`
- **Selector:** `app-dashboard-result-defacement`
- **Template:** `./dashboard-result-defacement.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-result-defacement. Template has 2 data-testid markers and 14 event bindings.
- **Imports:** `RouterLink`, `NgClass`, `DatePipe`, `CommonModule`, `TooltipDirective`
- **Injected services:** `authService: AuthService`, `appService: AppService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService`
- **Inputs:** `searchResultsInput`, `isLoadingInput`, `isExpandAble`, `isList`
- **Outputs:** -
- **Properties:** `selector`, `searchResultsInput`, `isLoadingInput`, `currentUrl`, `sortColumn`, `sortDirection`, `isCollapsed`, `searchResults`, `isExpandAble`, `isList`, `isLoading`, `valueA`, `valueB`, `valueA`, `valueB`, `valueA`, `valueB`
- **Methods:** `constructor`, `effect`, `ngOnInit`, `ngAfterViewInit`, `sortTable`, `if`, `if`, `if`, `if`, `if`, `if`, `getColumnValue`, `getSortClass`, `if`, `openExternalUrl`
- **Template data-testid markers:** `result-card`, `open-report`
- **Template router links:** `[currentUrl, item.m_hash]`, `[currentUrl, item.m_hash]`
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `DashboardResultExploitComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-exploit/dashboard-result-exploit.component.ts`
- **Selector:** `app-dashboard-result-exploit`
- **Template:** `./dashboard-result-exploit.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-dashboard-result-exploit. Template has 4 data-testid markers and 4 event bindings.
- **Imports:** `DatePipe`, `SlicePipe`, `TooltipDirective`, `CommonModule`, `RouterLink`
- **Injected services:** `authService: AuthService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`
- **Inputs:** `searchResults`, `isExpandAble`
- **Outputs:** -
- **Properties:** `selector`, `currentUrl`, `queryParams`, `isCollapsed`, `isConsolidatedView`, `searchResults`, `isExpandAble`
- **Methods:** `constructor`, `ngAfterViewInit`, `ngOnInit`, `openExternalUrl`
- **Template data-testid markers:** `result-card`, `open-cti-graph`, `open-report`, `consolidated-section-see-more`
- **Template router links:** `[currentUrl, item.m_hash]`
- **Template events:** `click`, `click`, `click`, `click`

### `DashboardResultSocialComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-results/dashboard-result-social/dashboard-result-social.component.ts`
- **Selector:** `app-dashboard-result-social`
- **Template:** `./dashboard-result-social.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-result-social. Template has 4 data-testid markers and 6 event bindings.
- **Imports:** `DatePipe`, `SlicePipe`, `RouterLink`, `TooltipDirective`, `CommonModule`, `RemoveEmojisPipe`
- **Injected services:** `authService: AuthService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService`
- **Inputs:** `searchResults`, `isExpandAble`
- **Outputs:** -
- **Properties:** `selector`, `currentUrl`, `queryParams`, `isCollapsed`, `isConsolidatedView`, `searchResults`, `isExpandAble`
- **Methods:** `constructor`, `ngAfterViewInit`, `getContentLines`, `hasCodeType`, `getContentWithoutEmptyLines`, `if`, `ngOnInit`, `openExternalUrl`
- **Template data-testid markers:** `result-card`, `open-cti-graph`, `open-report`, `consolidated-section-see-more`
- **Template router links:** `[currentUrl, item.m_hash]`
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`

### `DashboardResultsGeneralComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/dashboard-results/dashboard-results-general-grid/dashboard-results-general.component.ts`
- **Selector:** `app-dashboard-results-general-grid`
- **Template:** `./dashboard-results-general.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-results-general-grid. Template has 5 data-testid markers and 5 event bindings.
- **Imports:** `RouterLink`, `DatePipe`, `TooltipDirective`, `CommonModule`, `NgClass`
- **Injected services:** `authService: AuthService`, `activatedRoute: ActivatedRoute`, `helperService: HelperService`, `router: Router`, `route: ActivatedRoute`, `scrollService: ScrollService`, `licenseService: LicenseService`
- **Inputs:** `query`, `type`, `searchResults`, `isExpandAble`
- **Outputs:** -
- **Properties:** `selector`, `currentUrl`, `queryParams`, `isCollapsed`, `isFreeStrategic`, `isConsolidatedView`, `query`, `type`, `searchResults`, `isExpandAble`
- **Methods:** `constructor`, `ngAfterViewInit`, `highlightWords`, `ngOnInit`, `isWithinDays`, `isMobileMode`, `openExternalUrl`
- **Template data-testid markers:** `result-card`, `open-cti-graph`, `open-cti-graph`, `open-report`, `consolidated-section-see-more`
- **Template router links:** `[currentUrl, item.m_hash]`
- **Template events:** `click`, `click`, `click`, `click`, `click`

### `FileScannerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/ioc-extractor/file-scanner.component.ts`
- **Selector:** `app-ioc-extractor`
- **Template:** `./file-scanner.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-ioc-extractor. Template has 6 data-testid markers and 8 event bindings.
- **Imports:** `CommonModule`, `NgClass`, `NgxPrintModule`, `NgOptimizedImage`, `TooltipDirective`, `FormsModule`
- **Injected services:** `api: ApiService`, `route: ActivatedRoute`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `type`, `title`, `description`, `selectedFile`, `fileName`, `fileSize`, `isLoading`, `isFetched`, `hasError`, `errorMessage`, `isFileSizeError`, `scanResult`, `resultSections`, `progress`, `currentStep`, `copiedValue`, `relativeTo`, `next`, `error`, `title`
- **Methods:** `constructor`, `onFileSelected`, `if`, `handleFileSelect`, `if`, `scanFile`, `if`, `handleScanResponse`, `if`, `if`, `if`, `applyServerResult`, `resetResultState`, `buildResultSections`, `if`, `flattenValue`, `if`, `exportReport`, `if`, `triggerFileInput`, `closeError`, `resetFileInput`, `if`, `handleError`, `if`, `formatFileSize`, `if`, `isLastSectionRow`, `getDisplayFileName`, `getDisplayFileType`, `getDisplayMetricValue`, `formatLabelKey`, `stringifyValue`, `if`, `getFirstString`
- **Template data-testid markers:** `scan-file-input`, `scan-success-badge`, `scan-another-file`, `scan-download-report`, `defacement-report-card`, `defacement-report-card-title`
- **Template router links:** -
- **Template events:** `change`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `ResultInsightsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/result-insights/result-insights.component.ts`
- **Selector:** `app-result-insights`
- **Template:** `./result-insights.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-result-insights. Template has 9 data-testid markers and 6 event bindings.
- **Imports:** `CommonModule`, `FormsModule`, `NgClass`
- **Injected services:** -
- **Inputs:** `consolidatedCallbackModel`, `results`, `rankedResults`, `isGrouped`, `result_count`
- **Outputs:** -
- **Properties:** `selector`, `searchQuery`, `filterOptions`, `selectedFilter`, `emails`, `names`, `uniqueUrls`, `consolidatedCallbackModel`, `results`, `rankedResults`, `isGrouped`, `result_count`, `source`, `source`, `default`, `total`
- **Methods:** `ngOnInit`, `for`, `toggleFilter`, `toggleSection`, `if`, `isSectionExpanded`, `coverageDotClass`, `if`, `if`, `if`, `statusDotClass`, `threatResults`, `switch`, `getTotalResultCount`, `getActiveModelCount`, `getUniqueLinks`, `getStatus`, `extractNamesAndEmails`, `if`, `getCoverageSummaryFromModels`, `if`, `getStatusCategory`, `if`, `if`, `getSingleUrlPerResultCount`, `if`, `if`, `getFirstHttpUrlFromFields`, `for`, `if`, `extractMultipleFieldsFromResults`, `for`, `if`, `for`, `for`
- **Template data-testid markers:** `insights-section-keyword`, `insights-toggle-keyword`, `insights-section-coverage`, `insights-toggle-coverage`, `insights-section-threat-actor`, `insights-toggle-threat-actor`, `insights-threat-search-input`, `insights-section-unique-urls`, `insights-toggle-unique-urls`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `change`, `click`, `click`

### `TextAnalysisComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/intel-panel/text-analysis/text-analysis.component.ts`
- **Selector:** `app-text-analysis`
- **Template:** `./text-analysis.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-text-analysis. Template has 9 data-testid markers and 5 event bindings.
- **Imports:** `FormsModule`, `NgClass`, `EmptyQueryComponent`
- **Injected services:** `http: HttpClient`, `route: ActivatedRoute`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `submittedText`, `loading`, `queryTriggered`, `expanded`, `result`, `errorMessage`, `trackByIndex`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `analyzeText`, `if`, `if`, `toggleExpanded`, `normalizeResult`, `buildTitle`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** `text-analysis-input`, `text-analysis-submit`, `text-analysis-loading`, `text-analysis-table`, `text-analysis-row`, `text-analysis-row-toggle`, `defacement-report-card`, `defacement-report-card-title`, `text-analysis-primary-detection`
- **Template router links:** -
- **Template events:** `submit`, `click`, `keydown.enter`, `keydown.space`, `click`

### `LoginContainerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/login/login-container/login-container.component.ts`
- **Selector:** `app-login-container`
- **Template:** `./login-container.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-login-container. Template has 7 data-testid markers and 7 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `HeaderComponent`
- **Injected services:** `authService: AuthService`, `router: Router`, `appService: AppService`, `route: ActivatedRoute`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `tempToken`, `pendingUsername`, `user`, `errorMessage`, `authenticated`, `copied`, `twofaRequired`, `otpCode`, `otpUri`, `otpDataUrl`, `otpSecret`, `isMobile`, `autoDemoLogin`, `brandingResolved`, `mode`, `next`, `error`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `if`, `if`, `if`, `getLoginLogoSrc`, `if`, `if`, `getDashboardPreviewSrc`, `if`, `copyToClipboard`, `onSubmit`, `if`, `if`, `submitOtp`, `if`, `goToSignUp`, `goToForgot`, `ngOnDestroy`, `if`, `demoLogin`, `resendMail`
- **Template data-testid markers:** `login-page`, `login-user`, `login-pass`, `reset-password-link`, `login-button`, `twofa-center`, `twofa-title`
- **Template router links:** -
- **Template events:** `click`, `ngSubmit`, `click`, `click`, `click`, `click`, `ngSubmit`

### `LoginComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/login/login.component.ts`
- **Selector:** `app-login-header`
- **Template:** `./login.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-login-header. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `LoginContainerComponent`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DnsSectionComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/network-intel/dns-section/dns-section.component.ts`
- **Selector:** `app-network-intel-dns-section`
- **Template:** `./dns-section.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-network-intel-dns-section. Template has 0 data-testid markers and 3 event bindings.
- **Imports:** `CommonModule`, `IpDetailComponent`
- **Injected services:** `router: Router`, `ui: ScanHelperMethodsService`
- **Inputs:** `errorMessageInput`, `ipRowsInput`, `isScanning`, `progress`, `currentStep`, `progressSegments`, `hasSearched`, `dnsResult`, `resultLabel`
- **Outputs:** `toggleRow`
- **Properties:** `selector`, `ipRowsInput`, `pageSize`, `currentPage`, `isScanning`, `progress`, `currentStep`, `progressSegments`, `errorMessage`, `hasSearched`, `dnsResult`, `ipRows`, `resultLabel`, `toggleRow`
- **Methods:** `constructor`, `effect`, `isProgressSegmentActive`, `trackByIp`, `ngOnChanges`, `if`, `if`, `goToPreviousPage`, `if`, `goToNextPage`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `IpDetailComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/network-intel/ip-detail/ip-detail.component.ts`
- **Selector:** `app-ip-detail`
- **Template:** `./ip-detail.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-ip-detail. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** `ui: ScanHelperMethodsService`, `sanitizer: DomSanitizer`
- **Inputs:** `detailInput`
- **Outputs:** -
- **Properties:** `selector`, `detailInput`
- **Methods:** `constructor`, `effect`, `if`, `formatVulnerability`, `if`, `if`, `renderHeaderEntries`, `formatDisplayValue`, `if`, `if`, `if`, `getCameraIframeUrl`, `hasRenderableValue`, `buildRenderableEntries`, `formatLabel`, `isDuplicateGeneralInfoField`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `GeoCoordinatesModalComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/network-intel/modal/geo-coordinates-modal/geo-coordinates-modal.component.ts`
- **Selector:** `app-geo-coordinates-modal`
- **Template:** `./geo-coordinates-modal.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-geo-coordinates-modal. Template has 20 data-testid markers and 19 event bindings.
- **Imports:** `CommonModule`, `FormsModule`
- **Injected services:** `appService: AppService`
- **Inputs:** `isOpen`, `isScanning`, `coordinates`, `radiusKm`, `maxIps`
- **Outputs:** `close`, `coordinatesChange`, `radiusKmChange`, `maxIpsChange`, `search`
- **Properties:** `projection`, `dragStartX`, `dragStartY`, `dragStartScrollLeft`, `dragStartScrollTop`, `hasDraggedMap`, `lastDragEndedAt`, `minZoomLevel`, `maxZoomLevel`, `minRadiusKm`, `maxRadiusKm`, `minMaxIps`, `maxMaxIps`, `coordinateInputMode`, `zoomLevel`, `mapCanvasWidth`, `mapCanvasHeight`, `isDraggingMap`, `isOpen`, `isScanning`, `coordinates`, `radiusKm`, `maxIps`, `close`, `coordinatesChange`
- **Methods:** `constructor`, `ngAfterViewInit`, `ngOnChanges`, `if`, `if`, `if`, `onClose`, `onSearch`, `onRadiusKmChange`, `onMaxIpsChange`, `setCoordinateInputMode`, `onMapSelect`, `if`, `if`, `onMapDragStart`, `if`, `zoomIn`, `zoomOut`, `onMapWheel`, `onResize`, `onDocumentMouseMove`, `if`, `if`, `onDocumentMouseUp`, `if`, `if`, `parseCoordinates`, `if`, `clampWholeNumber`, `onEscape`, `queueRenderMap`, `setTimeout`, `applyZoom`, `if`, `getViewportCenterAnchor`
- **Template data-testid markers:** `network-intel-geo-overlay`, `network-intel-geo-modal`, `network-intel-geo-close`, `network-intel-geo-mode-map`, `network-intel-geo-mode-manual`, `network-intel-geo-selected-point`, `network-intel-geo-map-shell`, `network-intel-geo-map`, `network-intel-geo-zoom-in`, `network-intel-geo-zoom-out`, `network-intel-geo-zoom-label`, `network-intel-geo-coordinates-input`, `network-intel-geo-radius-decrement`, `network-intel-geo-radius-input`, `network-intel-geo-radius-increment`, `network-intel-geo-max-ips-decrement`, `network-intel-geo-max-ips-input`, `network-intel-geo-max-ips-increment`, `network-intel-geo-cancel`, `network-intel-geo-start`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `mousedown`, `click`, `wheel`, `click`, `click`, `ngModelChange`, `click`, `ngModelChange`, `click`, `click`, `ngModelChange`, `click`, `click`, `click`

### `NetworkIntel`

- **Kind:** `component`
- **Source:** `client/src/app/pages/network-intel/network-intel.ts`
- **Selector:** `app-network-intel`
- **Template:** `./network-intel.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-network-intel. Template has 7 data-testid markers and 18 event bindings.
- **Imports:** `CommonModule`, `FormsModule`, `EmptyQueryComponent`, `GeoCoordinatesModalComponent`, `DnsSectionComponent`, `ShodanSectionComponent`, `VulnerabilitySectionComponent`
- **Injected services:** `scanHelper: ScanHelperMethodsService`, `route: ActivatedRoute`, `router: Router`, `reportExport: ReportExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `_intervals`, `progressSegments`, `activeTab`, `lastPrimaryTab`, `geoMode`, `dnsForm`, `shodanForm`, `vulnForm`, `geoForm`, `formError`, `dnsResult`, `ipRows`, `shodanResult`, `vulnerabilityResult`, `vulnerabilityTargets`, `vulnerabilityActiveTarget`, `geoIpListResult`, `geoIpRows`, `geoResult`, `geoLiveStats`, `currentStep`, `exportCurrentStep`, `lastResultCount`, `hasSearched`, `showGeoCoordinatesModal`
- **Methods:** `constructor`, `ngOnInit`, `if`, `if`, `if`, `if`, `if`, `queueMicrotask`, `validateDns`, `validateShodan`, `validateVulnerability`, `validateGeo`, `setTab`, `if`, `if`, `setGeoTab`, `if`, `openGeoCoordinatesModal`, `openGeoCoordinatesModalFromStatus`, `onGeoCoordinatesChange`, `openGeoRangesModal`, `getToolbarQuery`, `if`, `if`, `if`, `setToolbarQuery`, `if`, `if`, `if`, `getToolbarPlaceholder`, `if`, `if`, `if`, `getGeoRangePreview`, `getGeoRangeExtraCount`
- **Template data-testid markers:** `network-intel-tab-host-recon`, `network-intel-tab-ip-scan`, `network-intel-tab-vulnerability-scan`, `network-intel-tab-geo-fencing`, `network-intel-search-input`, `network-intel-geo-search-trigger`, `network-intel-download-report`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `submit`, `input`, `keyup.enter`, `click`, `click`, `click`, `toggleRow`, `toggleRow`, `selectTarget`, `close`, `coordinatesChange`, `radiusKmChange`, `maxIpsChange`, `search`

### `ShodanSectionComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/network-intel/shodan-section/shodan-section.component.ts`
- **Selector:** `app-network-intel-shodan-section`
- **Template:** `./shodan-section.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-network-intel-shodan-section. Template has 1 data-testid markers and 0 event bindings.
- **Imports:** `CommonModule`, `IpDetailComponent`
- **Injected services:** `router: Router`, `ui: ScanHelperMethodsService`
- **Inputs:** `errorMessageInput`, `shodanResultInput`, `isScanning`, `progress`, `currentStep`, `progressSegments`, `hasSearched`
- **Outputs:** -
- **Properties:** `selector`, `shodanResultInput`, `isScanning`, `progress`, `currentStep`, `progressSegments`, `errorMessage`, `hasSearched`, `shodanResult`
- **Methods:** `constructor`, `effect`, `isProgressSegmentActive`
- **Template data-testid markers:** `network-intel-ip-result`
- **Template router links:** -
- **Template events:** -

### `VulnerabilitySectionComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/network-intel/vulnerability-section/vulnerability-section.component.ts`
- **Selector:** `app-network-intel-vulnerability-section`
- **Template:** `./vulnerability-section.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-network-intel-vulnerability-section. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** `CommonModule`, `ScrollTopComponent`
- **Injected services:** `router: Router`, `ui: ScanHelperMethodsService`
- **Inputs:** `errorMessageInput`, `vulnerabilityResultInput`, `targets`, `activeTarget`, `searchDomain`, `isScanning`, `progress`, `currentStep`, `hasSearched`
- **Outputs:** `selectTarget`
- **Properties:** `selector`, `vulnerabilityResultInput`, `targets`, `activeTarget`, `searchDomain`, `selectTarget`, `isScanning`, `progress`, `currentStep`, `errorMessage`, `hasSearched`, `vulnerabilityResult`
- **Methods:** `constructor`, `effect`, `isExpanded`, `isResultForTarget`, `riskBadgeClass`, `if`, `if`, `if`, `if`, `objectEntries`, `if`, `formatValue`, `if`, `formatElapsed`
- **Template data-testid markers:** `network-intel-vulnerability-result`
- **Template router links:** -
- **Template events:** `click`

### `UserProfileActivityComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/profile/user-profile-activity/user-profile-activity.component.ts`
- **Selector:** `app-user-profile-activity`
- **Template:** `./user-profile-activity.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-user-profile-activity. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** `CommonModule`, `RouterModule`
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `isLoading`, `errorMessage`, `response`, `next`, `error`
- **Methods:** `constructor`, `if`, `openThread`, `if`, `trackByDocId`, `loadActivity`
- **Template data-testid markers:** `user-profile-open-thread`
- **Template router links:** -
- **Template events:** `click`

### `SecurityScanExportComponentComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/security-scan/security-scan-export-component/security-scan-export-component.component.ts`
- **Selector:** `app-security-scan-export-component`
- **Template:** `./security-scan-export-component.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-security-scan-export-component. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `CommonModule`, `NgClass`
- **Injected services:** `helperService: HelperService`
- **Inputs:** `meta`, `categories`
- **Outputs:** -
- **Properties:** `selector`, `meta`, `categories`
- **Methods:** `constructor`, `ngOnChanges`, `riskClass`, `trimProof`, `if`, `buildRows`, `for`, `for`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SecurityScanComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/security-scan/security-scan.component.ts`
- **Selector:** `app-security-scan`
- **Template:** `./security-scan.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-security-scan. Template has 6 data-testid markers and 4 event bindings.
- **Imports:** `CommonModule`, `NgClass`, `CodeBlockComponent`, `NgxPrintModule`, `NgOptimizedImage`, `TooltipDirective`, `SecurityScanExportComponentComponent`, `NgxPrintDirective`, `FormsModule`, `ReactiveFormsModule`, `EmptyQueryComponent`
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `scanner: ScannerService`, `graphReportExport: ReportExportService`, `scanHelperMethodsService: ScanHelperMethodsService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `requestedUrl`, `searchQuery`, `requestedDomain`, `isLoading`, `isFetched`, `hasError`, `errorMessage`, `skeletonCards`, `progress`, `currentStep`, `scanType`, `grade`, `trackByCategory`, `trackByItem`, `next`, `error`, `relativeTo`
- **Methods:** `constructor`, `ngOnInit`, `if`, `if`, `if`, `if`, `load`, `if`, `if`, `if`, `exportReport`, `if`, `resolveRequestedUrl`, `if`, `extractHost`, `if`, `retry`, `onSearchSubmit`, `if`
- **Template data-testid markers:** `scan-primary-input`, `scan-search-button`, `scan-download-report`, `scan-print-report`, `scan-security-posture`, `scan-findings-title`
- **Template router links:** -
- **Template events:** `submit`, `click`, `click`, `click`

### `SignupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/signup/signup.component.ts`
- **Selector:** `app-signup`
- **Template:** `./signup.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-signup. Template has 6 data-testid markers and 3 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `NgClass`
- **Injected services:** `router: Router`, `auth_service: AuthService`, `route: ActivatedRoute`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `user`, `errorMessage`, `passwordStrength`, `showPasswordMeter`, `passwordChecks`, `currentUnmetCheck`, `isMobile`, `usernamePattern`, `usernameSuggestion`, `brandingResolved`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `getSignupLogoSrc`, `if`, `if`, `getDashboardPreviewSrc`, `if`, `validateUsername`, `validateFields`, `onPasswordInput`, `onSubmit`, `goToLogin`
- **Template data-testid markers:** `signup-page-container`, `signup-username`, `signup-companymail`, `signup-password`, `signup-submit`, `signup-goto-login`
- **Template router links:** -
- **Template events:** `ngSubmit`, `input`, `click`

### `AddTenantComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/tenant/tenant-management/add-tenant/add-tenant.component.ts`
- **Selector:** `app-add-tenant`
- **Template:** `./add-tenant.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-add-tenant. Template has 6 data-testid markers and 7 event bindings.
- **Imports:** `FormsModule`, `NgClass`
- **Injected services:** `apiService: ApiService`, `appService: AppService`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** `closs`, `accountAdded`
- **Properties:** `selector`, `licenses`, `isAdmin`, `model`, `errorText`, `usernamePattern`, `usernameSuggestion`, `showPasswordMeter`, `passwordStrength`, `passwordChecks`, `currentUnmetCheck`, `confirmPassword`, `closs`, `accountAdded`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `onSubmit`, `if`, `if`, `if`, `if`, `if`, `validateUsername`, `onClose`, `if`, `toggleTenantLicense`, `if`, `if`, `if`, `if`, `if`, `if`, `onPasswordInput`
- **Template data-testid markers:** `tenant-add-user-modal`, `tenant-add-user-username`, `tenant-add-user-email`, `tenant-add-user-password`, `tenant-add-user-confirm-password`, `tenant-add-user-submit`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `input`, `click`, `click`, `click`

### `ManageProfileComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/tenant/tenant-management/view-profile/manage-profile.component.ts`
- **Selector:** `app-view-profile`
- **Template:** `./manage-profile.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-view-profile. Template has 4 data-testid markers and 13 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `AddTenantComponent`, `ConfirmationPopupComponent`, `TooltipDirective`
- **Injected services:** `apiService: ApiService`, `appService: AppService`, `nodeResolver: NodeResolver`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `users`, `licenseList`, `isLoading`, `selectedUserId`, `expandedUserIndex`, `showAddTenantPopup`, `userToDelete`, `isDeleteConfirmationOpen`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `toggleExpandedUser`, `updateUser`, `if`, `handleClickOutside`, `isLicenseDisabled`, `canAssignLicense`, `if`, `toggleUserLicense`, `if`, `if`, `if`, `if`, `deleteUser`, `confirmDeleteUser`, `if`, `getUserLicensesLabel`, `if`, `canEditUser`, `getStatusBadgeClass`, `if`, `getSubscriptionBadgeClass`, `if`, `addtenant`, `clossAddTenant`
- **Template data-testid markers:** `tenant-add-user-button`, `tenant-edit-user-button`, `tenant-delete-user-button`, `tenant-delete-user-button`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `closs`, `accountAdded`, `confirmed`

### `ViewTenantComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/tenant/tenant-management/view-tenant/view-tenant.component.ts`
- **Selector:** `app-view-tenant`
- **Template:** `./view-tenant.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-view-tenant. Template has 9 data-testid markers and 7 event bindings.
- **Imports:** `FormsModule`, `CommonModule`
- **Injected services:** `apiService: ApiService`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `tenants`, `licenseList`, `isLoading`, `selectedTenantId`, `TenantStatus`, `next`, `verified`, `licenses`, `error`, `next`, `error`
- **Methods:** `constructor`, `ngOnInit`, `getStatusLabel`, `switch`, `updateTenant`, `if`, `handleClickOutside`, `toggleTenantLicense`, `if`, `if`, `getTenantLicensesLabel`, `if`, `getTenantStatusBadgeClass`, `if`, `getSubscriptionBadgeClass`, `if`, `getVerifiedBadgeClass`, `if`
- **Template data-testid markers:** `tenant-page-header`, `tenant-edit-button`, `tenant-edit-panel`, `tenant-edit-form-panel`, `tenant-verified-toggle`, `tenant-user-quota-input`, `tenant-save-changes`, `tenant-edit-form-panel`, `tenant-user-quota-input`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `TenantComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/tenant/tenant.component.ts`
- **Selector:** `app-tenant`
- **Template:** `./tenant.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-tenant. Template has 4 data-testid markers and 13 event bindings.
- **Imports:** `FormsModule`, `CommonModule`, `TooltipDirective`, `ConfirmationPopupComponent`, `NgClass`, `HeaderComponent`
- **Injected services:** `router: Router`, `apiService: ApiService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `onboardingData`, `currentStep`, `showLeftFade`, `showRightFade`, `selectedCategoryId`, `isConfirmationOpen`, `iocSearchText`, `categories`, `name`, `next`
- **Methods:** `constructor`, `ngOnInit`, `initializeIOCs`, `onCategoryClick`, `addIoc`, `removeIoc`, `if`, `scrollLeft`, `scrollRight`, `goNext`, `if`, `goBack`, `if`, `hasIocsWithValues`, `getFilteredIocs`, `if`, `confirm`, `if`, `clearAllIocs`, `if`, `if`, `openConfirmationPopup`
- **Template data-testid markers:** `tenant-company-input`, `tenant-onboarding-next-step1`, `tenant-onboarding-next-step2`, `tenant-onboarding-confirm`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `keyup.enter`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `confirmed`

### `WelcomeComponent`

- **Kind:** `component`
- **Source:** `client/src/app/pages/welcome/welcome.component.ts`
- **Selector:** `app-welcome`
- **Template:** `./welcome.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-welcome. Template has 2 data-testid markers and 1 event bindings.
- **Imports:** `HeaderComponent`
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `apiService: ApiService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `isLightTheme`, `message`, `heading`, `next`, `error`
- **Methods:** `constructor`, `applyTheme`, `ngOnInit`, `if`, `if`, `goToLogin`
- **Template data-testid markers:** `welcome-tick`, `welcome-goto-login`
- **Template router links:** -
- **Template events:** `click`

### `ReportFeedbackCommentsComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/social-interactions/report-feedback-comments/report-feedback-comments.component.ts`
- **Selector:** `app-report-feedback-comments`
- **Template:** `./report-feedback-comments.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-report-feedback-comments. Template has 4 data-testid markers and 3 event bindings.
- **Imports:** `CommonModule`, `FormsModule`
- **Injected services:** -
- **Inputs:** `docId`, `feedback`, `isSaving`, `errorMessage`
- **Outputs:** `saveComment`, `userSelected`
- **Properties:** `selector`
- **Methods:** `ngOnChanges`, `if`, `submitComment`, `if`, `openUser`, `if`
- **Template data-testid markers:** `report-feedback-comment-input`, `report-feedback-comment-save`, `report-feedback-comment-user-avatar`, `report-feedback-comment-user-name`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `ReportFeedbackComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/social-interactions/report-feedback/report-feedback.component.ts`
- **Selector:** `app-report-feedback`
- **Template:** `./report-feedback.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-report-feedback. Template has 3 data-testid markers and 3 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** -
- **Inputs:** `docId`, `feedback`, `savingKey`
- **Outputs:** `feedbackAction`
- **Properties:** `selector`
- **Methods:** `increment`, `if`, `isSelected`, `if`
- **Template data-testid markers:** `report-feedback-recommended`, `report-feedback-trust`, `report-feedback-untrust`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `ReportInteractionHostComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/social-interactions/report-interaction-host/report-interaction-host.component.ts`
- **Selector:** `app-report-interaction-host`
- **Template:** `./report-interaction-host.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-report-interaction-host. Template has 0 data-testid markers and 3 event bindings.
- **Imports:** `CommonModule`, `ReportFeedbackComponent`, `ReportFeedbackCommentsComponent`, `ReportUserSidebarComponent`
- **Injected services:** `dashboardService: DashboardService`
- **Inputs:** `docId`
- **Outputs:** -
- **Properties:** `feedbackModel`, `feedbackSavingKey`, `isCommentSaving`, `commentErrorMessage`
- **Methods:** `constructor`, `ngOnChanges`, `if`, `submitFeedback`, `saveFeedbackComment`, `loadFeedback`, `setCommentSaving`, `setCommentErrorMessage`, `openUserSidebar`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `feedbackAction`, `saveComment`, `userSelected`

### `ReportUserSidebarComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/social-interactions/report-user-sidebar/report-user-sidebar.component.ts`
- **Selector:** `app-report-user-sidebar`
- **Template:** `./report-user-sidebar.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-report-user-sidebar. Template has 2 data-testid markers and 5 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** -
- **Inputs:** `userId`
- **Outputs:** -
- **Properties:** `selector`, `isMounted`, `isVisible`, `isLoading`, `errorMessage`, `userData`, `next`, `error`
- **Methods:** `open`, `if`, `closeSidebar`, `onImageError`, `openDetails`, `if`, `loadUser`, `onPanelTransitionEnd`, `if`
- **Template data-testid markers:** `report-user-sidebar-hidden-profile`, `report-user-sidebar-open-profile`
- **Template router links:** -
- **Template events:** `click`, `transitionend`, `click`, `error`, `click`

### `ReportChatComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/templates/report-chat/report-chat.component.ts`
- **Selector:** `app-report-chat`
- **Template:** `./report-chat.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-report-chat. Template has 0 data-testid markers and 2 event bindings.
- **Imports:** `ResultListComponent`, `ResultSectionComponent`, `SlicePipe`, `CommonModule`, `NgClass`, `JsonApiViewerComponent`, `TooltipDirective`, `ReportHeaderComponent`, `ChatWidgetComponent`, `ReportInteractionHostComponent`
- **Injected services:** `appService: AppService`, `route: ActivatedRoute`, `authService: AuthService`, `dashboardService: DashboardService`, `router: Router`, `scrollService: ScrollService`, `elementRef: ElementRef`, `scanHelperMethodsService: ScanHelperMethodsService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `resultItem`, `arrayKeys`, `listItems`, `activeTab`, `content`, `summary`, `isExpandedMetadata`, `selectedTab`, `selectedTab`, `selectedTab`, `selectedTab`
- **Methods:** `constructor`, `ngOnInit`, `ngAfterViewInit`, `scrollToTop`, `metaadataToggleContent`, `processResultItem`, `if`, `if`, `if`, `if`, `setActiveTab`, `if`, `if`, `getContentLines`, `getContentWithoutEmptyLines`, `if`, `hasCodeType`, `formatKeyLabel`, `isLikelyUrl`, `formatTitleUrl`, `getDisplayChannelTitle`, `normalizeDisplayUrl`, `hasValue`, `getMetadataRows`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`

### `ReportDefacementComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/templates/report-defacement/report-defacement.component.ts`
- **Selector:** `app-report-defacement`
- **Template:** `./report-defacement.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-report-defacement. Template has 0 data-testid markers and 2 event bindings.
- **Imports:** `CommonModule`, `DatePipe`, `JsonApiViewerComponent`, `ReportMappingComponent`, `ReportHeaderComponent`, `ResultSectionComponent`, `ResultListComponent`, `NgClass`, `TooltipDirective`, `ReportInteractionHostComponent`
- **Injected services:** `route: ActivatedRoute`, `appService: AppService`, `scrollService: ScrollService`, `elementRef: ElementRef`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `lang`, `isExpandedMetadata`, `activeTab`, `content`, `listItems`, `arrayKeys`
- **Methods:** `constructor`, `ngOnInit`, `if`, `ngAfterViewInit`, `scrollToTop`, `metaadataToggleContent`, `setActiveTab`, `if`, `formatKeyLabel`, `prepareMetadata`, `if`, `if`, `formatTitleUrl`, `normalizeDisplayUrl`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`

### `ReportComponent`

- **Kind:** `component`
- **Source:** `client/src/app/sections/report/templates/report_general/report.component.ts`
- **Selector:** `app-result-panel`
- **Template:** `./report.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-result-panel. Template has 0 data-testid markers and 6 event bindings.
- **Imports:** `ResultListComponent`, `CommonModule`, `NgClass`, `ResultSectionComponent`, `TooltipDirective`, `JsonApiViewerComponent`, `ReportMappingComponent`, `ReportHeaderComponent`, `ChatWidgetComponent`, `CodeBlockComponent`, `ReportInteractionHostComponent`
- **Injected services:** `api: ApiService`, `cdr: ChangeDetectorRef`, `dashboardService: DashboardService`, `route: ActivatedRoute`, `helperService: HelperService`, `appService: AppService`, `authService: AuthService`, `scrollService: ScrollService`, `elementRef: ElementRef`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `resultItem`, `arrayKeys`, `listItems`, `activeTab`, `content`, `lang`, `lang_detected`, `type`, `isImageLoaded`, `isImageError`, `imageSrc`, `isExpandedScreenshoot`, `isExpandedMetadata`, `username`, `role`, `responseType`
- **Methods:** `constructor`, `ngOnInit`, `if`, `if`, `if`, `ngAfterViewInit`, `scrollToTop`, `langUpdate`, `if`, `screenshootToggleContent`, `metaadataToggleContent`, `processResultItem`, `if`, `setActiveTab`, `if`, `getStatusText`, `isWithinDays`, `onImageLoad`, `onImageError`, `loadImage`, `formatKeyLabel`, `getDisplayTitle`, `normalizeDisplayUrl`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `languageUpdated`, `click`, `click`, `click`, `error`, `load`

### `SocialIconComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/components/social-icon/social-icon.component.ts`
- **Selector:** `app-social-icon`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-social-icon.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `changeDetection`, `platformName`, `iconDataUrl`
- **Methods:** `constructor`, `effect`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AlertNotificationComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/alert-notification/alert-notification.component.ts`
- **Selector:** `app-alert-notification`
- **Template:** `./alert-notification.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-alert-notification. Template has 4 data-testid markers and 8 event bindings.
- **Imports:** `CommonModule`, `NgClass`, `ExportChoiceModalComponent`
- **Injected services:** `appService: AppService`, `apiService: ApiService`, `messageNotificationService: MessageNotificationService`, `alertExportService: AlertExportService`
- **Inputs:** `isNotificationOpen`
- **Outputs:** `closeNotification`
- **Properties:** `selector`, `alertNotifications`, `batchSize`, `incrementalDelayMs`, `incrementalChunkSize`, `currentPage`, `totalCount`, `hasMore`, `countsByType`, `isLoadingMore`, `isLoadMoreTriggered`, `isFetchingDetail`, `alertToShowReport`, `isExportChoiceOpen`, `alertExportOptions`, `isNotificationOpen`, `closeNotification`, `next`, `error`, `next`, `next`, `error`, `error`, `next`, `next`
- **Methods:** `constructor`, `decrementUnseenSummary`, `if`, `ngOnChanges`, `if`, `if`, `canLoadMore`, `fetchNotifications`, `if`, `if`, `setTimeout`, `loadMoreNotifications`, `clearAppendTimer`, `if`, `appendNotificationsIncrementally`, `if`, `if`, `timeAgo`, `if`, `if`, `if`, `if`, `if`, `if`, `seeDetails`, `if`, `openExportChoice`, `closeExportChoice`, `exportSelectedAlert`, `if`, `close`, `clearAll`, `if`, `if`, `getLatestAlerts`
- **Template data-testid markers:** `tenant-notification-sidebar`, `tenant-notification-close`, `tenant-notification-see-details`, `tenant-notification-clear-all`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `closed`, `optionSelected`

### `CodeBlockComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/code-block/code-block.component.ts`
- **Selector:** `app-code-block`
- **Template:** `./code-block.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-code-block. Template has 0 data-testid markers and 1 event bindings.
- **Imports:** `NgClass`, `TooltipDirective`
- **Injected services:** -
- **Inputs:** `code`
- **Outputs:** -
- **Properties:** `selector`, `code`
- **Methods:** `toggle`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`

### `ConfirmationPopupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/confirmation-popup/confirmation-popup.component.ts`
- **Selector:** `app-confirmation-popup`
- **Template:** `./confirmation-popup.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-confirmation-popup. Template has 2 data-testid markers and 3 event bindings.
- **Imports:** `FocusDirective`
- **Injected services:** -
- **Inputs:** `message`
- **Outputs:** `confirmed`
- **Properties:** `selector`, `confirmed`
- **Methods:** `onBackdrop`, `if`, `onYes`, `onNo`
- **Template data-testid markers:** `confirmation-popup`, `confirmation-yes-button`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `EmptyQueryComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/empty-query/empty-query.component.ts`
- **Selector:** `app-empty-query`
- **Template:** `./empty-query.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-empty-query. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `EmptyResultComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/empty-result/empty-result.component.ts`
- **Selector:** `app-empty-result`
- **Template:** `./empty-result.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-empty-result. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `searchQuery`
- **Outputs:** -
- **Properties:** `selector`, `query`, `searchQuery`
- **Methods:** `ngOnInit`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ErrorHandlerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/error-handler/error-handler.component.ts`
- **Selector:** `app-error-handler`
- **Template:** `./error-handler.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-error-handler. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ExportChoiceModalComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/export-choice-modal/export-choice-modal.component.ts`
- **Selector:** `app-export-choice-modal`
- **Template:** `./export-choice-modal.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-export-choice-modal. Template has 0 data-testid markers and 3 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** -
- **Inputs:** `visible`, `title`, `subtitle`, `options`, `overlayTestId`, `modalTestId`, `closeTestId`
- **Outputs:** `closed`, `optionSelected`
- **Properties:** `selector`, `title`, `subtitle`, `options`, `overlayTestId`, `modalTestId`, `closeTestId`, `closed`, `optionSelected`
- **Methods:** `onOverlayClick`, `select`, `isLightTheme`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `DatePickerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/filters/date-picker/date-picker.component.ts`
- **Selector:** `app-date-picker`
- **Template:** `./date-picker.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-date-picker. Template has 4 data-testid markers and 5 event bindings.
- **Imports:** `FormsModule`, `CommonModule`
- **Injected services:** -
- **Inputs:** `key`, `filterModel`, `mSelectedFilters`
- **Outputs:** `selectedFiltersChange`, `dateSelected`
- **Properties:** `selector`, `isOpen`, `viewYear`, `viewMonth`, `cells`, `fromDate`, `toDate`, `key`, `filterModel`, `mSelectedFilters`, `selectedFiltersChange`, `dateSelected`, `date`
- **Methods:** `if`, `if`, `ngOnChanges`, `if`, `togglePicker`, `closePicker`, `prevMonth`, `if`, `nextMonth`, `if`, `onSelect`, `isStart`, `isEnd`, `isInRange`, `if`, `onEsc`, `buildCalendar`, `for`, `parseIso`, `if`, `if`, `toIso`, `sameDay`
- **Template data-testid markers:** `side-filter-date-toggle`, `side-filter-date-prev-month`, `side-filter-date-month-label`, `side-filter-date-next-month`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`

### `FiltersComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/filters/filters.component.ts`
- **Selector:** `app-filters`
- **Template:** `./filters.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-filters. Template has 3 data-testid markers and 7 event bindings.
- **Imports:** `FormsModule`, `NgOptimizedImage`, `TooltipDirective`, `DatePickerComponent`
- **Injected services:** `dashboard: DashboardService`, `scrollService: ScrollService`
- **Inputs:** `filterModelInput`, `isFilterOpen`
- **Outputs:** `filterChanged`, `filterReset`, `filterClose`
- **Properties:** `selector`, `filterModelInput`, `selectedFilters`, `isFilterOpen`, `filterChanged`, `filterReset`, `filterClose`, `selectedKey`
- **Methods:** `constructor`, `effect`, `effect`, `if`, `ngOnInit`, `if`, `updateFilter`, `if`, `onSelectionChange`, `if`, `applyFilters`, `closeFilter`, `resetFilters`, `getOptionLabel`, `if`
- **Template data-testid markers:** `side-filter-close`, `side-filter-reset`, `side-filter-apply`
- **Template router links:** -
- **Template events:** `click`, `dateSelected`, `selectedFiltersChange`, `ngModelChange`, `ngModelChange`, `click`, `click`

### `ResetPasswordComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/forgot-password/reset-password.component.ts`
- **Selector:** `app-forgot-password`
- **Template:** `./reset-password.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-forgot-password. Template has 4 data-testid markers and 2 event bindings.
- **Imports:** `FormsModule`, `HeaderComponent`, `CommonModule`
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `auth_service: AuthService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `password`, `errorMessage`, `responseError`, `hasToken`, `token`, `confirmPassword`, `passwordStrength`, `showPasswordMeter`, `passwordChecks`, `currentUnmetCheck`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `onPasswordInput`, `ngOnInit`, `if`, `onSubmit`, `if`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** `reset-companymail`, `reset-password`, `reset-confirm-password`, `reset-submit`
- **Template router links:** -
- **Template events:** `ngSubmit`, `input`

### `DashboardHeaderComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/header/dashboard-header/dashboard-header.component.ts`
- **Selector:** `app-dashboard-header`
- **Template:** `./dashboard-header.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-dashboard-header. Template has 1 data-testid markers and 4 event bindings.
- **Imports:** `FormsModule`, `ProfileComponent`, `NgClass`, `TitleCasePipe`, `NgOptimizedImage`, `SupportComponent`
- **Injected services:** `authService: AuthService`, `router: Router`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `supportPopup`
- **Methods:** `constructor`, `ngOnInit`, `updateBreadcrumb`, `goBack`, `if`, `if`, `if`, `navigateToCrumb`, `if`, `supportOpenPopup`, `supportClosePopup`
- **Template data-testid markers:** `dashboard-header-back`
- **Template router links:** -
- **Template events:** `click`, `click`, `openPopup`, `closePopup`

### `HeaderComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/header/login-header/header.component.ts`
- **Selector:** `app-header`
- **Template:** `./header.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-header. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `ProfileComponent`, `NgOptimizedImage`, `NgClass`
- **Injected services:** `appService: AppService`
- **Inputs:** `forceDark`
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** `constructor`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `IocSearchComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/ioc-search/ioc-search.component.ts`
- **Selector:** `app-ioc-search`
- **Template:** `./ioc-search.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-ioc-search. Template has 11 data-testid markers and 10 event bindings.
- **Imports:** `KeyValuePipe`, `FormsModule`, `TooltipDirective`, `NgClass`
- **Injected services:** `sidebarService: SidebarService`, `route: ActivatedRoute`
- **Inputs:** `basicTags`, `filterLabels`, `allTag`, `defaultBasicTag`, `defaultAdvancedTag`, `maxAdvancedFilters`, `valueValidators`, `tagValidators`, `useRouteQuery`, `advancedTitle`, `advancedSubtitle`
- **Outputs:** `searchTriggered`
- **Properties:** `selector`, `basicTags`, `filterLabels`, `allTag`, `defaultBasicTag`, `defaultAdvancedTag`, `maxAdvancedFilters`, `valueValidators`, `tagValidators`, `useRouteQuery`, `advancedTitle`, `advancedSubtitle`, `isAdvanced`, `basicSubmitted`, `basicTouched`, `selectedTag`, `basicQuery`, `advancedFilters`, `searchTriggered`, `finalQuery`, `finalQuery`, `regex`, `regex`, `regex`, `regex`
- **Methods:** `constructor`, `ngOnInit`, `if`, `toggleAdvanced`, `selectBasicTag`, `addFilter`, `removeFilter`, `if`, `triggerSearch`, `if`, `if`, `isBasicInvalid`, `if`, `if`, `if`, `isAdvancedInvalid`, `validateComplexQuery`, `if`, `isValidToken`, `hasInvalidOperators`, `extractTokens`, `normalizeOperators`, `validateValue`, `if`, `if`, `if`, `normalizeBasicQuery`, `for`, `if`, `if`, `getBasicErrorMessage`, `switch`, `extractValues`, `onBasicQueryChange`, `filterBasicInput`
- **Template data-testid markers:** `ioc-advanced-toggle`, `side-filter-open`, `ioc-basic-search-input`, `ioc-basic-error`, `ioc-adv-row`, `ioc-adv-operator-select`, `ioc-adv-tag-select`, `ioc-adv-value-input`, `ioc-adv-delete-filter`, `ioc-adv-add-filter`, `ioc-adv-execute`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `submit`, `ngModelChange`, `input`, `ngModelChange`, `click`, `click`, `click`

### `JsonApiViewerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/json-api-viewer/json-api-viewer.component.ts`
- **Selector:** `app-json-api-viewer`
- **Template:** `./json-api-viewer.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-json-api-viewer. Template has 0 data-testid markers and 2 event bindings.
- **Imports:** `CommonModule`, `NgClass`, `JsonViewerComponent`, `JsonViewerComponent`, `TooltipDirective`
- **Injected services:** -
- **Inputs:** `jsonData`
- **Outputs:** -
- **Properties:** `selector`, `isExpanded`, `copied`, `jsonData`
- **Methods:** `toggleContent`, `copyJson`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`

### `JsonViewerComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/json-api-viewer/json-viewer/json-viewer.component.ts`
- **Selector:** `app-json-viewer`
- **Template:** `./json-viewer.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-json-viewer. Template has 0 data-testid markers and 2 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** -
- **Inputs:** `jsonInput`, `parentPathInput`, `level`, `showRootBraces`
- **Outputs:** -
- **Properties:** `selector`, `parentPathInput`, `expandedMap`, `excludedPaths`, `level`, `parentPath`, `showRootBraces`
- **Methods:** `constructor`, `effect`, `initExpansionState`, `pathKey`, `isObject`, `isArray`, `isCollapsible`, `toggle`, `isExpanded`, `keys`, `if`, `openToken`, `closeToken`, `collapsedSummary`, `formatPrimitive`, `if`, `if`, `primitiveClass`, `if`, `if`, `if`, `primitiveSummary`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`

### `LoaderComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/loader/loader.component.ts`
- **Selector:** `app-loader`
- **Template:** `./loader.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-loader. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** `AsyncPipe`, `NgClass`
- **Injected services:** `loadingService: LoadingService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `LoadingFormComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/loading-form/loading-form.component.ts`
- **Selector:** `app-loading-form`
- **Template:** `./loading-form.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-loading-form. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** -
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `MessageNotificationComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/message-notification/message-notification.component.ts`
- **Selector:** `app-message-notification`
- **Template:** `./message-notification.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-message-notification. Template has 3 data-testid markers and 1 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** `notificationService: MessageNotificationService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `dismiss`
- **Template data-testid markers:** `message-notification-shell`, `message-notification`, `message-notification-text`
- **Template router links:** -
- **Template events:** `click`

### `MessagePopupComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/message-popup/message-popup.component.ts`
- **Selector:** `app-message-popup`
- **Template:** `./message-popup.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-message-popup. Template has 1 data-testid markers and 1 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `message`
- **Outputs:** `confirmed`
- **Properties:** `selector`, `confirmed`
- **Methods:** `onBackdropClick`, `dismiss`
- **Template data-testid markers:** `tenant-message-dismiss`
- **Template router links:** -
- **Template events:** `click`

### `NotificationComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/notification/notification.component.ts`
- **Selector:** `app-notification`
- **Template:** `./notification.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-notification. Template has 0 data-testid markers and 1 event bindings.
- **Imports:** `HeaderComponent`
- **Injected services:** `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `description`
- **Methods:** `constructor`, `if`, `goHome`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`

### `CrossSearchCardComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/onion-search-engine/cross-search-card.component.ts`
- **Selector:** `app-cross-search-card`
- **Template:** `./cross-search-card.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-cross-search-card. Template has 4 data-testid markers and 6 event bindings.
- **Imports:** `CommonModule`
- **Injected services:** `http: HttpClient`
- **Inputs:** `query`, `consolidated`
- **Outputs:** -
- **Properties:** `selector`, `isExpandable`, `isLoading`, `progress`, `currentStep`, `hasError`, `canScrollLeft`, `canScrollRight`, `engines`, `next`, `error`
- **Methods:** `constructor`, `toggleResultsBarCollapse`, `if`, `setTimeout`, `onSearch`, `if`, `if`, `if`, `if`, `setTimeout`, `scrollResults`, `if`, `setTimeout`, `onScrollRow`, `openEngineCard`, `if`, `fetchSearchResults`, `isPendingResponse`, `shouldContinuePolling`, `updateScrollState`, `if`
- **Template data-testid markers:** `onion-search-report`, `onion-search-report-title`, `onion-search-report-toggle`, `onion-search-report-card`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `scroll`, `click`, `click`

### `PaginationComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/pagination/pagination.component.ts`
- **Selector:** `app-pagination`
- **Template:** `./pagination.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-pagination. Template has 5 data-testid markers and 4 event bindings.
- **Imports:** `CommonModule`, `NgClass`, `NgOptimizedImage`
- **Injected services:** `appService: AppService`
- **Inputs:** `maxPagesInput`, `currentPageInput`, `align`
- **Outputs:** `pageChange`
- **Properties:** `selector`, `maxPagesInput`, `currentPageInput`, `maxPages`, `currentPage`, `align`, `pageChange`
- **Methods:** `constructor`, `effect`, `getPageRange`, `for`, `onPageChange`, `if`
- **Template data-testid markers:** `pagination-root`, `pagination-shell`, `pagination-first`, `pagination-prev`, `pagination-next`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`

### `ProSubscriptionComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/pro-subscription/pro-subscription.component.ts`
- **Selector:** `app-pro-subscription`
- **Template:** `./pro-subscription.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-pro-subscription. Template has 0 data-testid markers and 3 event bindings.
- **Imports:** `CommonModule`, `FormsModule`, `NgClass`
- **Injected services:** `api: ApiService`, `router: Router`
- **Inputs:** `permanent`
- **Outputs:** `close`
- **Properties:** `selector`, `userName`, `userPhone`, `userEmail`, `submitted`, `permanent`, `close`
- **Methods:** `constructor`, `closePopup`, `submitForm`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `ngSubmit`, `click`

### `ProfileComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/profile/profile.component.ts`
- **Selector:** `app-profile`
- **Template:** `./profile.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-profile. Template has 4 data-testid markers and 10 event bindings.
- **Imports:** `NgOptimizedImage`, `TooltipDirective`, `NgClass`, `AlertNotificationComponent`
- **Injected services:** `authService: AuthService`, `router: Router`, `dashboardService: DashboardService`, `appService: AppService`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** `openPopup`
- **Properties:** `selector`, `scrollHandler`, `username`, `role`, `isNotificationOpen`, `profile_image`, `licences`, `dropdownOpen`, `openPopup`
- **Methods:** `constructor`, `effect`, `ngAfterViewInit`, `if`, `ngOnDestroy`, `if`, `onDropdownOpen`, `isAdmin`, `isDemo`, `isMember`, `toggleDropdown`, `auditlog`, `manageIocs`, `openAccountSettings`, `changePassword`, `logout`, `closeDropdown`, `openNotifications`, `closeNotifications`, `getUnseenAlertCount`, `if`, `openSupportPopup`
- **Template data-testid markers:** `profile-notification-bell`, `profile-menu`, `profile-help-support`, `signout-btn`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `closeNotification`

### `ReportHeaderComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/report-header/report-header.component.ts`
- **Selector:** `app-report-header`
- **Template:** `./report-header.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-report-header. Template has 0 data-testid markers and 10 event bindings.
- **Imports:** `NgOptimizedImage`, `TooltipDirective`, `ExportChoiceModalComponent`, `AiSummaryComponent`
- **Injected services:** `helperService: HelperService`, `api: ApiService`, `appService: AppService`, `dashboardService: DashboardService`, `route: Router`, `licenseServise: LicenseService`, `reportExportService: ReportExportService`
- **Inputs:** `csv_object`, `url`, `lang`, `content`, `lang_detected`
- **Outputs:** `languageUpdated`
- **Properties:** `selector`, `isExportChoiceOpen`, `reportExportOptions`, `csv_object`, `url`, `lang`, `content`, `lang_detected`, `languageUpdated`, `ci`, `ci`, `url`, `params`
- **Methods:** `constructor`, `downloadCSV`, `if`, `if`, `openExportChoice`, `closeExportChoice`, `selectExport`, `if`, `printPage`, `shareResult`, `redirectToUrl`, `if`, `open_graph`, `aiSuggest`, `langUpdate`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `closed`, `optionSelected`

### `ReportMappingComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/report-mapping/report-mapping.component.ts`
- **Selector:** `app-report-mapping`
- **Template:** `./report-mapping.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-report-mapping. Template has 0 data-testid markers and 2 event bindings.
- **Imports:** `CommonModule`, `NgClass`, `TooltipDirective`
- **Injected services:** `api: ApiService`, `dashboardservice: DashboardService`, `authService: AuthService`, `subscriptionService: SubscriptionService`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `loading`, `result`, `filteredItems`, `isExpanded`, `next`
- **Methods:** `constructor`, `toggleContent`, `if`, `loadGraph`, `getUniqueSortedItems`, `for`, `if`, `viewReport`, `extractId`, `extractProperty`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`, `click`

### `ResultListComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/result-components/result-list/result-list.component.ts`
- **Selector:** `app-result-list`
- **Template:** `./result-list.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-result-list. Template has 0 data-testid markers and 1 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `listItemsInput`, `activeTab`
- **Outputs:** -
- **Properties:** `selector`, `filteredItems`, `copiedIndex`, `activeTab`
- **Methods:** `constructor`, `effect`, `copyText`, `setTimeout`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`

### `ResultSectionComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/result-components/result-section/result-section.component.ts`
- **Selector:** `app-result-section`
- **Template:** `./result-section.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-result-section. Template has 0 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** `listItems`
- **Outputs:** -
- **Properties:** `selector`, `listItems`
- **Methods:** `ngOnInit`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ResultComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/result/result.component.ts`
- **Selector:** `app-result`
- **Template:** `./result.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-result. Template has 16 data-testid markers and 20 event bindings.
- **Imports:** `CommonModule`, `EmptyResultComponent`, `FormsModule`, `NgOptimizedImage`, `LoadingFormComponent`, `FiltersComponent`, `EmptyQueryComponent`, `RouterLink`, `ScrollTopComponent`, `TooltipDirective`, `SearchFiltersComponent`, `SelectedFilterBarComponent`, `CrossSearchCardComponent`
- **Injected services:** `scrollService: ScrollService`, `router: Router`, `helperService: HelperService`, `app_service: AppService`, `dashboardService: DashboardService`, `sidebarService: SidebarService`, `route: ActivatedRoute`, `authService: AuthService`, `licenseService: LicenseService`, `homeSearchService: HomeSearchService`
- **Inputs:** `resultCountInput`, `searchQueryInput`, `consolidatedInput`, `filterModelInput`, `activeTabInput`, `result_count_enabled`, `isLoading`, `showNoResult`, `isList`, `isTool`, `showEmptyQuery`, `analyticsToggle`, `list_grid`, `shrinkmenu`, `disableScroll`, `type`, `discussion`, `domain`, `showTabs`, `showSorting`, `showSelectedFilters`
- **Outputs:** `reloadSearchFilters`, `resetFilter`, `onToggleSwitch`, `reloadFilters`, `reloadData`, `updateQuery`, `onToggleSort`
- **Properties:** `selector`, `resultCountInput`, `searchQueryInput`, `consolidatedInput`, `filterModelInput`, `activeTabInput`, `result_triggered`, `selectedSortBy`, `selectedSearchBy`, `local_query`, `showScans`, `sortMenuOpen`, `searchMenuOpen`, `scandomains`, `matchTypeLabel`, `result_count_enabled`, `isLoading`, `showNoResult`, `isList`, `isTool`, `showEmptyQuery`, `searchQuery`, `analyticsToggle`, `list_grid`, `shrinkmenu`
- **Methods:** `if`, `if`, `if`, `constructor`, `effect`, `if`, `if`, `ngOnChanges`, `onSetMatchType`, `onTabClick`, `if`, `if`, `onToggleAnalytics`, `ngOnInit`, `if`, `if`, `if`, `onFormSubmit`, `onToolToggle`, `sidebarFilterCount`, `entityFiltersCount`, `onAdvanceSettingToggle`, `onSortChange`, `toggleSortMenu`, `if`, `toggleSearchMenu`, `if`, `closeMenus`, `setFilterOverlay`, `reloadFilter`, `init_domains`, `toggleScan`, `onScanSelected`, `normalizeDisplayUrl`, `checkMember`
- **Template data-testid markers:** `consolidated-tab-iocs`, `consolidated-tab-deep-search`, `consolidated-tab-network-intelligence`, `dashboard-search-submit`, `dashboard-general-input`, `dashboard-advance-toggle`, `dashboard-tools-toggle`, `result-tools-sort`, `result-tools-sort-newest`, `result-tools-sort-oldest`, `result-tools-searchby`, `result-tools-searchby-semantic`, `result-tools-searchby-or`, `result-tools-searchby-and`, `result-tools-searchby-full`, `side-filter-open`
- **Template router links:** `/dashboard/breach/databases`
- **Template events:** `click`, `submit`, `focus`, `input`, `click`, `change`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `clearAll`, `click`, `filterClose`, `filterChanged`

### `ScanHelperMethods`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods.component.ts`
- **Selector:** `app-scan-helper`
- **Template:** `./scan-helper-methods.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-scan-helper. Template has 9 data-testid markers and 19 event bindings.
- **Imports:** `CommonModule`, `FormsModule`
- **Injected services:** `scanService: ScanHelperMethodsService`, `appService: AppService`
- **Inputs:** `isOpen`
- **Outputs:** `close`, `search`
- **Properties:** `selector`, `subs`, `activeTab`, `domain`, `isValidDomain`, `toast`, `isLoading`, `errorMessage`, `progress`, `statusMessage`, `subdomains`, `subdomainCount`, `checkLive`, `dnsRecords`, `waybackSnapshots`, `cancelRequested`, `showInvalid`, `isOpen`, `close`, `search`
- **Methods:** `constructor`, `effect`, `effect`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `effect`, `if`, `if`, `isCompletedStatus`, `ngOnDestroy`, `switchTab`, `onEnterKey`, `onClose`, `cancelScan`, `if`, `resetState`, `validateDomain`, `if`, `if`, `getSubdomainUrl`, `getAllWaybackUrls`, `copy`, `setTimeout`, `setTimeout`, `startScan`, `if`, `if`, `if`, `resolveRequestedUrl`, `if`
- **Template data-testid markers:** `domain-scanner-modal`, `domain-scanner-tab-subdomains`, `domain-scanner-tab-ip-lookup`, `domain-scanner-tab-wayback`, `domain-scanner-live-toggle`, `domain-scanner-input`, `domain-scanner-search-subdomains`, `domain-scanner-lookup-ip`, `domain-scanner-search-wayback`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`, `click`, `click`, `click`, `ngModelChange`, `keyup.enter`, `click`, `click`, `keyup.enter`, `click`, `click`, `click`, `click`, `click`, `click`, `click`, `click`

### `ScrollTopComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/scroll-top/scroll-top.component.ts`
- **Selector:** `app-scroll-top`
- **Template:** `./scroll-top.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-scroll-top. Template has 0 data-testid markers and 1 event bindings.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** `scrollToTop`, `for`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** `click`

### `SupportComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/support/support.component.ts`
- **Selector:** `app-support`
- **Template:** `./support.component.html`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector app-support. Template has 9 data-testid markers and 3 event bindings.
- **Imports:** `NgClass`, `FormsModule`
- **Injected services:** `apiService: ApiService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** -
- **Outputs:** `closePopup`
- **Properties:** `selector`, `isSubmitting`, `submitAttempted`, `errorMessage`, `supportModel`, `closePopup`, `next`, `error`
- **Methods:** `constructor`, `close`, `submit`, `if`, `if`, `resetForm`, `getErrorMessage`
- **Template data-testid markers:** `support-overlay`, `support-modal`, `support-modal-title`, `support-close`, `support-email-input`, `support-subject-input`, `support-message-input`, `support-cancel`, `support-send`
- **Template router links:** -
- **Template events:** `click`, `click`, `click`

### `TrailNotificationComponent`

- **Kind:** `component`
- **Source:** `client/src/app/shared/partials/trail-notification/trail-notification.component.ts`
- **Selector:** `app-trail-notification`
- **Template:** `./trail-notification.component.html`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector app-trail-notification. Template has 1 data-testid markers and 0 event bindings.
- **Imports:** -
- **Injected services:** `subscriptionService: SubscriptionService`
- **Inputs:** `trialNotificationCheck`
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** `constructor`
- **Template data-testid markers:** `trial-subscription-banner`
- **Template router links:** -
- **Template events:** -


## Directives

| Class | Selector | Source | Template | Injected Services |
| --- | --- | --- | --- | --- |
| `PlatformIconBgDirective` | `[socialMapperPlatformBg]` | `client/src/app/pages/graphs/social-graph/directives/platform-icon-bg.directive.ts` | `-` | - |
| `BaseListingComponent` | `-` | `client/src/app/shared/directive/base.listing.directive.ts` | `-` | - |
| `FocusDirective` | `[triggerAutoFocus]` | `client/src/app/shared/directive/focus.directive.ts` | `-` | `el: ElementRef` |
| `TooltipDirective` | `[appTooltip]` | `client/src/app/shared/directive/tooltip-directive.directive.ts` | `-` | `el: ElementRef`, `renderer: Renderer2`, `zone: NgZone` |
| `AutofocusDirective` | `[appAutofocus]` | `client/src/app/shared/directives/autofocus.directive.ts` | `-` | - |

### `PlatformIconBgDirective`

- **Kind:** `directive`
- **Source:** `client/src/app/pages/graphs/social-graph/directives/platform-icon-bg.directive.ts`
- **Selector:** `[socialMapperPlatformBg]`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector [socialMapperPlatformBg].
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`, `platformName`, `hue`, `hue`, `hue`, `hue`
- **Methods:** `constructor`, `effect`, `getColorBucketFromHex`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `BaseListingComponent`

- **Kind:** `directive`
- **Source:** `client/src/app/shared/directive/base.listing.directive.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** TypeScript module defining BaseListingComponent.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `route`, `router`, `dashboard`, `scrollService`, `destroyRef`, `selectedFilters`, `totalPages`, `searchQuery`, `isLoading`
- **Methods:** `reload`, `setCurrentPage`, `ngOnInit`, `if`, `initializeFilters`, `onPageChange`, `applyFilters`, `onSearchSubmit`, `resetFilters`, `reload`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `FocusDirective`

- **Kind:** `directive`
- **Source:** `client/src/app/shared/directive/focus.directive.ts`
- **Selector:** `[triggerAutoFocus]`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector [triggerAutoFocus].
- **Imports:** -
- **Injected services:** `el: ElementRef`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `ngAfterViewInit`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `TooltipDirective`

- **Kind:** `directive`
- **Source:** `client/src/app/shared/directive/tooltip-directive.directive.ts`
- **Selector:** `[appTooltip]`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular component/directive using selector [appTooltip].
- **Imports:** -
- **Injected services:** `el: ElementRef`, `renderer: Renderer2`, `zone: NgZone`
- **Inputs:** `tooltipText`
- **Outputs:** -
- **Properties:** `selector`, `showTimeout`, `rafHideScheduled`, `tooltipLeft`, `tooltipTop`, `tooltipText`, `top`, `left`, `top`, `left`, `top`, `left`, `left`, `top`, `top`
- **Methods:** `constructor`, `ngAfterViewInit`, `if`, `onWindowScroll`, `onMouseEnter`, `onMouseLeave`, `ngOnDestroy`, `if`, `if`, `scheduleHide`, `if`, `requestAnimationFrame`, `hideNow`, `if`, `if`, `createOrUpdateTooltip`, `if`, `while`, `requestAnimationFrame`, `if`, `if`, `if`, `if`, `destroyTooltip`, `if`, `setTooltipPositionAttributes`, `if`, `if`, `if`, `normalizePositionValue`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AutofocusDirective`

- **Kind:** `directive`
- **Source:** `client/src/app/shared/directives/autofocus.directive.ts`
- **Selector:** `[appAutofocus]`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** Angular component/directive using selector [appAutofocus].
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `selector`
- **Methods:** `constructor`, `ngOnInit`, `setTimeout`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -


## Pipes

| Class | Selector | Source | Template | Injected Services |
| --- | --- | --- | --- | --- |
| `HighlightHtmlPipe` | `-` | `client/src/app/shared/pipes/highlight-html.pipe.ts` | `-` | - |
| `LowerPipe` | `-` | `client/src/app/shared/pipes/lower.pipe.ts` | `-` | - |
| `NormalizeUnicodePipe` | `-` | `client/src/app/shared/pipes/normalize-unicode.pipe.ts` | `-` | - |
| `RemoveEmojisPipe` | `-` | `client/src/app/shared/pipes/remove-emojis-pipe.pipe.ts` | `-` | - |
| `SortGroupedResultsPipe` | `-` | `client/src/app/shared/pipes/sort-grouped-results.pipe.ts` | `-` | - |

### `HighlightHtmlPipe`

- **Kind:** `pipe`
- **Source:** `client/src/app/shared/pipes/highlight-html.pipe.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** TypeScript module defining HighlightHtmlPipe.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `transform`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `LowerPipe`

- **Kind:** `pipe`
- **Source:** `client/src/app/shared/pipes/lower.pipe.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** TypeScript module defining LowerPipe.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `transform`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `NormalizeUnicodePipe`

- **Kind:** `pipe`
- **Source:** `client/src/app/shared/pipes/normalize-unicode.pipe.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** TypeScript module defining NormalizeUnicodePipe.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `name`
- **Methods:** `for`, `for`, `if`, `if`, `for`, `transform`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `RemoveEmojisPipe`

- **Kind:** `pipe`
- **Source:** `client/src/app/shared/pipes/remove-emojis-pipe.pipe.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** TypeScript module defining RemoveEmojisPipe.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `transform`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SortGroupedResultsPipe`

- **Kind:** `pipe`
- **Source:** `client/src/app/shared/pipes/sort-grouped-results.pipe.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `true`
- **Summary:** TypeScript module defining SortGroupedResultsPipe.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `name`
- **Methods:** `transform`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -


## Services

| Class | Selector | Source | Template | Injected Services |
| --- | --- | --- | --- | --- |
| `FeederService` | `-` | `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/feeder.service.ts` | `-` | `apiService: ApiService` |
| `SocialScanService` | `-` | `client/src/app/pages/graphs/shared/services/social-scan.service.ts` | `-` | `api: ApiService` |
| `TabManagerService` | `-` | `client/src/app/pages/graphs/shared/services/tab-manager.service.ts` | `-` | `api: ApiService`, `graphReportExport: ReportExportService` |
| `FetchingStateService` | `-` | `client/src/app/pages/graphs/social-graph/services/fetching-state.service.ts` | `-` | - |
| `GraphManagerService` | `-` | `client/src/app/pages/graphs/social-graph/services/graph-manager.service.ts` | `-` | - |
| `GraphOrchestratorService` | `-` | `client/src/app/pages/graphs/social-graph/services/graph-orchestrator.service.ts` | `-` | - |
| `PlatformFetchService` | `-` | `client/src/app/pages/graphs/social-graph/services/platform-fetch.service.ts` | `-` | - |
| `RelationshipResolverService` | `-` | `client/src/app/pages/graphs/social-graph/services/relationship-resolver.service.ts` | `-` | - |
| `SocialEntityUiService` | `-` | `client/src/app/pages/graphs/social-graph/services/social-entity-ui.service.ts` | `-` | - |
| `SocialMapperStateService` | `-` | `client/src/app/pages/graphs/social-graph/services/social-mapper-state.service.ts` | `-` | - |
| `SocialScanJobService` | `-` | `client/src/app/pages/graphs/social-graph/services/social-scan-job.service.ts` | `-` | - |
| `NexusChatService` | `-` | `client/src/app/pages/intel-panel/ai-workspace/nexus-chat.service.ts` | `-` | - |
| `ScanHelperMethodsService` | `-` | `client/src/app/pages/network-intel/network-intel-service.service.ts` | `-` | - |
| `ScannerService` | `-` | `client/src/app/pages/security-scan/scanner-service.service.ts` | `-` | `api: ApiService` |
| `AlertService` | `-` | `client/src/app/services/alerts/alerts.service.ts` | `-` | `apiService: ApiService`, `appService: AppService` |
| `AuditlogService` | `-` | `client/src/app/services/auditlog/auditlog.service.ts` | `-` | `apiService: ApiService` |
| `AuthService` | `-` | `client/src/app/services/authetication/auth.service.ts` | `-` | `appService: AppService`, `appStorageService: AppStorageService`, `apiService: ApiService`, `router: Router`, `tokenRefreshService: TokenRefreshService` |
| `TokenRefreshService` | `-` | `client/src/app/services/authetication/token-refresh.service.ts` | `-` | - |
| `AppStorageService` | `-` | `client/src/app/services/core/app/app-storage.service.ts` | `-` | - |
| `AppService` | `-` | `client/src/app/services/core/app/app.service.ts` | `-` | `title: Title`, `apiService: ApiService`, `activatedRoute: ActivatedRoute`, `router: Router`, `appStorageService: AppStorageService`, `http: HttpClient` |
| `DashboardService` | `-` | `client/src/app/services/dashboard/dashboard.service.ts` | `-` | `router: Router`, `route: ActivatedRoute`, `helperService: HelperService`, `apiService: ApiService`, `app_service: AppService` |
| `SelectionStoreService` | `-` | `client/src/app/services/dashboard/selection.service.ts` | `-` | `router: Router`, `scroll_service: ScrollService` |
| `SidebarHomepageService` | `-` | `client/src/app/services/dashboard/sidebar.service.ts` | `-` | `scrollService: ScrollService`, `licenseService: LicenseService` |
| `SubscriptionService` | `-` | `client/src/app/services/dashboard/subscription.service.ts` | `-` | `appService: AppService` |
| `DirectoryService` | `-` | `client/src/app/services/directory/directory.service.ts` | `-` | `apiService: ApiService` |
| `DumpService` | `-` | `client/src/app/services/dump/dump.service.ts` | `-` | `apiService: ApiService` |
| `SuggestionService` | `-` | `client/src/app/services/entity_filter_suggestions/suggestions.service.ts` | `-` | `http: HttpClient` |
| `HomeSearchService` | `-` | `client/src/app/services/home_search/home.search.service.ts` | `-` | `dashboardService: DashboardService`, `appService: AppService` |
| `LicenseService` | `-` | `client/src/app/services/licenses/licenses.service.ts` | `-` | `dashboardService: DashboardService`, `appService: AppService`, `subscriptionService: SubscriptionService`, `router: Router`, `authService: AuthService` |
| `MessageNotificationService` | `-` | `client/src/app/services/message_notification/message-notification.service.ts` | `-` | - |
| `AuthGuard` | `-` | `client/src/app/shared/guards/auth-guard.guard.ts` | `-` | `authService: AuthService`, `router: Router`, `appService: AppService` |
| `NotificationGuard` | `-` | `client/src/app/shared/guards/notification.guard.ts` | `-` | `authService: AuthService`, `router: Router` |
| `OnboardingGuard` | `-` | `client/src/app/shared/guards/onboarding-guar.ts` | `-` | `appService: AppService`, `router: Router` |
| `subscriptionGuard` | `-` | `client/src/app/shared/guards/subscription.guard.ts` | `-` | `subscriptionService: SubscriptionService`, `appService: AppService`, `dashboardService: DashboardService` |
| `TenantGuard` | `-` | `client/src/app/shared/guards/tenant-guard.guard.ts` | `-` | `router: Router`, `appService: AppService` |
| `ScanHelperMethodsService` | `-` | `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods-service.service.ts` | `-` | - |
| `ConfigResolver` | `-` | `client/src/app/shared/resolvers/config.resolver.ts` | `-` | `appService: AppService`, `apiService: ApiService` |
| `ReportConsolidatedResolver` | `-` | `client/src/app/shared/resolvers/consolidated.resolver.ts` | `-` | `apiService: ApiService`, `router: Router` |
| `DashboardResolver` | `-` | `client/src/app/shared/resolvers/dashboard.resolver.ts` | `-` | `authService: AuthService`, `insightCacheService: InsightCacheService` |
| `InsightResolver` | `-` | `client/src/app/shared/resolvers/insight.resolver.ts` | `-` | `apiService: ApiService` |
| `IocResolver` | `-` | `client/src/app/shared/resolvers/ioc.resolver.ts` | `-` | `apiService: ApiService`, `appService: AppService` |
| `ReportResolver` | `-` | `client/src/app/shared/resolvers/report.resolver.ts` | `-` | `apiService: ApiService`, `router: Router` |
| `NodeResolver` | `-` | `client/src/app/shared/resolvers/session-data-resolver.service.ts` | `-` | `apiService: ApiService`, `appService: AppService` |
| `ApiService` | `-` | `client/src/app/shared/services/api.service.ts` | `-` | `http: HttpClient` |
| `ConsolidatedApiService` | `-` | `client/src/app/shared/services/consolidated.api.service.ts` | `-` | `http: HttpClient`, `apiService: ApiService` |
| `DemoTourService` | `-` | `client/src/app/shared/services/demo.tour.service.ts` | `-` | `appService: AppService`, `apiService: ApiService`, `router: Router` |
| `ErrorStoreService` | `-` | `client/src/app/shared/services/error-store.service.ts` | `-` | `router: Router` |
| `AlertExportService` | `-` | `client/src/app/shared/services/export/alert-export.service.ts` | `-` | `documentExport: DocumentExportService` |
| `DocumentExportService` | `-` | `client/src/app/shared/services/export/document-export.service.ts` | `-` | - |
| `ExportSharedService` | `-` | `client/src/app/shared/services/export/export-shared.service.ts` | `-` | - |
| `GraphExportService` | `-` | `client/src/app/shared/services/export/graph-export.service.ts` | `-` | - |
| `ReportExportService` | `-` | `client/src/app/shared/services/export/report-export.service.ts` | `-` | `graphExport: GraphExportService`, `documentExport: DocumentExportService` |
| `HelperService` | `-` | `client/src/app/shared/services/helper.service.ts` | `-` | `sanitizer: DomSanitizer`, `appService: AppService`, `messageNotificationService: MessageNotificationService` |
| `IconService` | `-` | `client/src/app/shared/services/icon.service.ts` | `-` | - |
| `InsightCacheService` | `-` | `client/src/app/shared/services/insight-cache.service.ts` | `-` | `apiService: ApiService` |
| `LoadingService` | `-` | `client/src/app/shared/services/loading.service.ts` | `-` | - |
| `ProxyController` | `-` | `client/src/app/shared/services/proxy-controller.ts` | `-` | - |
| `ResultRowHelperService` | `-` | `client/src/app/shared/services/result-row-helper.service.ts` | `-` | - |
| `ScrollService` | `-` | `client/src/app/shared/services/scroll.service.ts` | `-` | `licenseService: LicenseService`, `dashboardService: DashboardService` |
| `SidebarService` | `-` | `client/src/app/shared/services/sidebar.service.ts` | `-` | - |

### `FeederService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/dashboard/dashboard-sidebar/sidebar-user/sidebar-user-feeder/feeder.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `getCatalog`, `getScripts`, `if`, `upload`, `deleteScript`, `deleteValue`, `toggleScript`, `setAllForRule`, `clearAllForRule`, `getOwnerUsers`, `transferOwner`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SocialScanService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/shared/services/social-scan.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `api: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `platform`, `platform`, `request`, `mapResult`, `initialDelayMs`, `error`, `submitStep`, `mapResult`, `submitStep`, `mapResult`, `request`, `isReady`, `mapResult`, `request`, `isReady`, `mapResult`, `request`, `isReady`, `mapResult`, `request`, `isReady`, `mapResult`, `request`, `isReady`, `mapResult`
- **Methods:** `constructor`, `extractMetadata`, `if`, `if`, `if`, `catch`, `if`, `emitPendingProgress`, `if`, `capitalizePlatform`, `inferPlatformName`, `buildPlatformResult`, `mapScanItems`, `runScanFlow`, `return`, `performScan`, `performImageScan`, `fetchProfileInfo`, `fetchPlatformImages`, `fetchSocialPosts`, `fetchFollowers`, `fetchFollowing`, `fetchProfileBreachData`, `takeWhile`, `map`, `catchError`, `fetchStealerLogsByIdentity`, `catchError`, `fetchProfileMetadataTokens`, `if`, `shouldContinueDynamicPolling`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `TabManagerService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/shared/services/tab-manager.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `api: ApiService`, `graphReportExport: ReportExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `hasLoadedState`, `hasPendingSave`, `isSaveInFlight`, `shouldResaveAfterCurrent`, `lastSavedSignature`, `tabs`, `activeTabId`, `editingTabId`, `activeTab`, `active_tab_id`, `next`, `error`, `next`, `error`, `value`, `value`
- **Methods:** `constructor`, `createNewState`, `addTab`, `selectTab`, `closeTab`, `if`, `startEditing`, `stopEditing`, `renameTab`, `if`, `exportActiveTab`, `if`, `exportActiveTabReport`, `if`, `importTab`, `if`, `scheduleSave`, `if`, `if`, `buildSerializableState`, `flushScheduledSave`, `if`, `if`, `if`, `if`, `if`, `if`, `persistAddedTab`, `if`, `loadState`, `if`, `hasAuthToken`, `serializeTabState`, `for`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `FetchingStateService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/fetching-state.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `profile`, `posts`, `platformImages`, `followers`, `following`, `userImages`
- **Methods:** `for`, `isUserBusy`, `getPlatformUniqueKey`, `setFetching`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `GraphManagerService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/graph-manager.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `getGraphLabelColor`, `createEntityNode`, `createPlatformNode`, `createUserNode`, `createRelationshipNode`, `createGroupNodeSvg`, `createEntityNodeSvg`, `createRelationshipNodeSvg`, `createUserNodeSvg`, `getEntityVisualConfig`, `if`, `if`, `getEntityIconPath`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `GraphOrchestratorService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/graph-orchestrator.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `graphManager`, `iconService`, `fetchingState`, `relationshipResolver`, `otherNodeId`, `otherNodeId`, `nodes`, `edges`, `nodes`, `edges`, `nodes`, `edges`, `newNodes`, `nodes`, `nodes`, `edges`, `nodes`, `nodes`, `followsAtoB`, `mentionsAtoB`, `followsBtoA`, `mentionsBtoA`, `sourceUserNodeId`, `targetUserNodeId`
- **Methods:** `getGraphLabelColor`, `wait`, `setTimeout`, `getExpandedGroupNode`, `if`, `if`, `if`, `if`, `if`, `_updateGraphWithGroupedNodes`, `addNodesAndEdges`, `if`, `setTimeout`, `removeUserFromGraph`, `if`, `addEntityToGraph`, `if`, `deleteCustomEntity`, `removeAllPlatformNodes`, `removeSingleNode`, `addEdge`, `deleteEdges`, `for`, `for`, `if`, `if`, `if`, `for`, `if`, `if`, `if`, `for`, `updateUserConnections`, `for`, `for`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `PlatformFetchService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/platform-fetch.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `next`, `complete`
- **Methods:** `getPlatformIdentityKey`, `isSamePlatformIdentity`, `updateUIPopups`, `if`, `fetchData`, `if`, `if`, `if`, `if`, `extractConnections`, `for`, `for`, `if`, `cancelFetch`, `cancelAllFetchesForUser`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `RelationshipResolverService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/relationship-resolver.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `normalized`, `normalized`, `normalized`, `normalized`
- **Methods:** `normalizeHandle`, `if`, `if`, `compactHandle`, `getHandleVariants`, `if`, `if`, `getUserHandleSet`, `for`, `containsAnyHandle`, `if`, `for`, `addRelationshipConnectionsForDirection`, `for`, `tryAddRelationshipConnection`, `if`, `buildRelationshipConnections`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SocialEntityUiService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/social-entity-ui.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `changed`
- **Methods:** `getIconForEntityType`, `switch`, `normalizeUsernames`, `for`, `if`, `if`, `normalizePlatformName`, `supportsPostConnections`, `supportsFollowersFollowing`, `parseTokens`, `toTitleCase`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SocialMapperStateService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/social-mapper-state.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `tabManager`, `fetchingState`, `activeTabState`, `jobs`, `scanResults`, `networkData`, `isMetadataPopupVisible`, `selectedPlatformData`, `summaryPopupData`, `notification`, `nodeToFocus`, `contextMenuData`, `deleteConfirmationData`, `deleteUsername`, `deleteEntityId`, `infoModalData`, `manageProfilesModalData`, `isFollowerScanPopupVisible`, `followerScanPopupData`, `relationshipPopupData`, `type`, `type`, `type`, `type`, `type`
- **Methods:** `openManageProfilesModal`, `if`, `if`, `closeManageProfilesModal`, `openDeleteConfirmation`, `openDeleteEntityConfirmation`, `closeDeleteConfirmation`, `openInfoModal`, `closeInfoModal`, `openPlatformNodePopup`, `if`, `closeMetadataPopup`, `closeSummaryPopup`, `openFollowerScanPopup`, `if`, `findPlatformDataByNodeId`, `if`, `if`, `if`, `closeFollowerScanPopup`, `openRelationshipPopup`, `closeRelationshipPopup`, `focusOnUser`, `focusOnNode`, `setTimeout`, `closeContextMenu`, `onNodeRightClicked`, `if`, `if`, `showNotification`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SocialScanJobService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/graphs/social-graph/services/social-scan-job.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `jobs`, `next`, `error`, `complete`
- **Methods:** `hasRunningJob`, `getQueuedJob`, `getPlatformIdentityKey`, `mergePlatformsWithExisting`, `if`, `startNextQueuedScan`, `if`, `getScanObserver`, `if`, `if`, `if`, `runScan`, `initiateScan`, `if`, `initiateImageScan`, `cancelScan`, `if`, `resumeIncompleteScans`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `NexusChatService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/intel-panel/ai-workspace/nexus-chat.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `pollNexusChat`, `pollNexusReportChat`, `pollNexusSummary`, `getNexusChatReply`, `getNexusSummary`, `isNexusPending`, `getNexusStep`, `getNexusStatus`, `asRecord`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ScanHelperMethodsService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/network-intel/network-intel-service.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `isRunning`
- **Methods:** `resetState`, `getResponseError`, `if`, `if`, `if`, `scanResolveIp`, `scanShodanIp`, `scanUrlVulnerability`, `scanGeoCamera`, `scanGeoCameraByRanges`, `isValidDomain`, `isValidIp`, `isValidCoordinates`, `if`, `hasRenderableValue`, `if`, `if`, `if`, `isEmbeddedInConsolidated`, `getProgressValue`, `getLoadingStepLabel`, `if`, `shouldShowLoadingSkeleton`, `getTrimmedInputOrNull`, `getInputKind`, `validateDnsInput`, `if`, `validateShodanInput`, `if`, `if`, `if`, `validateVulnerabilityInput`, `if`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ScannerService`

- **Kind:** `service`
- **Source:** `client/src/app/pages/security-scan/scanner-service.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `api: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `first_load`
- **Methods:** `constructor`, `scanDomain`, `cancel`, `isPending`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AlertService`

- **Kind:** `service`
- **Source:** `client/src/app/services/alerts/alerts.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `isCheckingStatus`, `hasAutoCheckedOnce`, `isAlertScanLoading`, `next`, `next`, `error`, `error`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `scanIOCs`, `if`, `if`, `cancelScanIOCs`, `getLatestAlerts`, `if`, `getScanStatus`, `if`, `autoCheckScanStatus`, `if`, `if`, `getPendingScanFlag`, `setPendingScanFlag`, `if`, `ngOnDestroy`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AuditlogService`

- **Kind:** `service`
- **Source:** `client/src/app/services/auditlog/auditlog.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `auditDataSubject`, `currentPageSubject`, `lastParams`
- **Methods:** `constructor`, `reloadAuditData`, `setCurrentPage`, `if`, `reload`, `deleteAuditLog`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AuthService`

- **Kind:** `service`
- **Source:** `client/src/app/services/authetication/auth.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `appService: AppService`, `appStorageService: AppStorageService`, `apiService: ApiService`, `router: Router`, `tokenRefreshService: TokenRefreshService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `authState`, `route`, `next`, `error`, `next`, `error`
- **Methods:** `constructor`, `login`, `if`, `if`, `if`, `verifyTwofa`, `if`, `logout`, `demoLogin`, `signup`, `signup_verification`, `forgotPassword`, `updatePassword`, `getIsMobileDemo`, `isAuthenticated`, `getSessionStatus`, `denyAccess`, `setToken`, `getStoredToken`, `loadAuthState`, `startTokenRefresh`, `refreshToken`, `if`, `if`, `applyLoginResponse`, `if`, `if`, `toBool`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `TokenRefreshService`

- **Kind:** `service`
- **Source:** `client/src/app/services/authetication/token-refresh.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `destroyRef`, `refreshTokenSubscription`
- **Methods:** `constructor`, `startTokenRefresh`, `if`, `catchError`, `stopTokenRefresh`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AppStorageService`

- **Kind:** `service`
- **Source:** `client/src/app/services/core/app/app-storage.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `if`, `if`, `if`, `if`, `getLocalSettings`, `getStaticConfig`, `setupWatcher`, `effect`, `if`, `clearStorage`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AppService`

- **Kind:** `service`
- **Source:** `client/src/app/services/core/app/app.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `title: Title`, `apiService: ApiService`, `activatedRoute: ActivatedRoute`, `router: Router`, `appStorageService: AppStorageService`, `http: HttpClient`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `entitiesCache`, `sessionLoadPromise`, `demoTourLoadPromise`, `configData`, `page`, `entities`, `worldJson`, `demoTourConfig`, `userSessionData`, `tenantData`, `userImageUrl`
- **Methods:** `createEmptyUserSessionData`, `constructor`, `loadSession`, `if`, `if`, `if`, `loadConfig`, `if`, `if`, `loadStaticConfig`, `getConfig`, `updateFavicon`, `preloadImage`, `updatePage`, `initializeEntities`, `for`, `loadEntities`, `initializeLicenseRules`, `for`, `loadLicenseRules`, `loadWorldJson`, `loadDemoTourConfig`, `if`, `clearAll`, `isMobileMode`, `setOnboardingStatus`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DashboardService`

- **Kind:** `service`
- **Source:** `client/src/app/services/dashboard/dashboard.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `router: Router`, `route: ActivatedRoute`, `helperService: HelperService`, `apiService: ApiService`, `app_service: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `m_current_route`, `rankedResult`, `consolidatedParamModel`, `generalCallbackModel`, `chatCallbackModel`, `defacementCallbackModel`, `exploitCallbackModel`, `leakCallbackModel`, `stealerlogCallbackModel`, `consolidatedCallbackModel`, `socialCallbackModel`, `showSubscription`, `selectedFilters`, `passwordSchemeFilter`, `baseParams`, `success`, `data`, `baseParams`, `baseParams`, `payload`, `payload`, `next`, `error`, `next`
- **Methods:** `constructor`, `if`, `if`, `fetchConsolidatedRankededResults`, `fetchConsolidatedGroupedResults`, `loadDocumentFeedback`, `if`, `submitFeedbackAction`, `if`, `saveDocumentFeedbackComment`, `initializeSideFilters`, `resetParams`, `clearResultCaches`, `for`, `cancelOngoingRequest`, `beginRequestWithMergedParams`, `applyEntityFilter`, `if`, `patchReportFeedbackModel`, `syncQueryParamsToUrl`, `clearCallback`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SelectionStoreService`

- **Kind:** `service`
- **Source:** `client/src/app/services/dashboard/selection.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `router: Router`, `scroll_service: ScrollService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `selectedOptionSubject`, `first_trigger`, `option`
- **Methods:** `constructor`, `setInitialSelectionFromUrl`, `if`, `if`, `if`, `setSelectedSection`, `setSelectedOption`, `getSelectedSection`, `resetSelection`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SidebarHomepageService`

- **Kind:** `service`
- **Source:** `client/src/app/services/dashboard/sidebar.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `scrollService: ScrollService`, `licenseService: LicenseService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `constructor`, `getRiskLevel`, `switch`, `selectOption`, `requestSubscription`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SubscriptionService`

- **Kind:** `service`
- **Source:** `client/src/app/services/dashboard/subscription.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `constructor`, `accountExpirable`, `checkSubscription`, `isDemo`, `checkAdmin`, `getTrialDaysLeft`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DirectoryService`

- **Kind:** `service`
- **Source:** `client/src/app/services/directory/directory.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `directoryDataSubject`, `currentPageSubject`
- **Methods:** `constructor`, `reloadDirectoryData`, `getCurrentPage`, `setCurrentPage`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DumpService`

- **Kind:** `service`
- **Source:** `client/src/app/services/dump/dump.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `dumpDataSubject`, `currentPageSubject`, `filterOpenSubject`, `filterModel`
- **Methods:** `constructor`, `setDumpData`, `reloadDumpData`, `getCurrentPage`, `setCurrentPage`, `if`, `toggleFilter`, `reload`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SuggestionService`

- **Kind:** `service`
- **Source:** `client/src/app/services/entity_filter_suggestions/suggestions.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `http: HttpClient`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `loadSuggestions`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `HomeSearchService`

- **Kind:** `service`
- **Source:** `client/src/app/services/home_search/home.search.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `dashboardService: DashboardService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `showFiltersOverlay`
- **Methods:** `constructor`, `setMatchType`, `closeOverlay`, `openOverlay`, `toggleAdvanceSettings`, `toggleAdvancedTools`, `handleSearchInput`, `if`, `handleDocumentClick`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `LicenseService`

- **Kind:** `service`
- **Source:** `client/src/app/services/licenses/licenses.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `dashboardService: DashboardService`, `appService: AppService`, `subscriptionService: SubscriptionService`, `router: Router`, `authService: AuthService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `moduleName`, `moduleName`
- **Methods:** `constructor`, `getUserRole`, `getLicenses`, `isAdmin`, `isAnalyst`, `isDemo`, `isMember`, `loadLicenses`, `getCombinedRule`, `for`, `if`, `if`, `for`, `demoSubscription`, `canAccess`, `if`, `if`, `canUseModule`, `canUseCtiGraph`, `canUseMapping`, `canUseScanning`, `isMaintainer`, `getLicenseLabel`, `switch`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `MessageNotificationService`

- **Kind:** `service`
- **Source:** `client/src/app/services/message_notification/message-notification.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `messageSignal`, `typeSignal`, `message`, `type`
- **Methods:** `show`, `setTimeout`, `clear`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AuthGuard`

- **Kind:** `service`
- **Source:** `client/src/app/shared/guards/auth-guard.guard.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `authService: AuthService`, `router: Router`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `canActivate`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `NotificationGuard`

- **Kind:** `service`
- **Source:** `client/src/app/shared/guards/notification.guard.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `authService: AuthService`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `canActivate`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `OnboardingGuard`

- **Kind:** `service`
- **Source:** `client/src/app/shared/guards/onboarding-guar.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `appService: AppService`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `canActivate`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `subscriptionGuard`

- **Kind:** `service`
- **Source:** `client/src/app/shared/guards/subscription.guard.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `subscriptionService: SubscriptionService`, `appService: AppService`, `dashboardService: DashboardService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `constructor`, `canActivate`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `TenantGuard`

- **Kind:** `service`
- **Source:** `client/src/app/shared/guards/tenant-guard.guard.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `router: Router`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `canActivate`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ScanHelperMethodsService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/partials/scan-helper-methods/scan-helper-methods-service.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `api`, `progress`, `onDone`, `onError`, `next`, `error`, `complete`
- **Methods:** `cancelCurrentScan`, `if`, `isPendingOrBusy`, `updateProgress`, `if`, `createCancelSubject`, `completeCancelSubject`, `beforeTaskStart`, `afterTaskStop`, `scanSubdomains`, `scanDns`, `scanWayback`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ConfigResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/config.resolver.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `appService: AppService`, `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `resolve`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ReportConsolidatedResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/consolidated.resolver.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`
- **Methods:** `constructor`, `resolve`, `switch`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DashboardResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/dashboard.resolver.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `authService: AuthService`, `insightCacheService: InsightCacheService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `constructor`, `resolve`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `InsightResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/insight.resolver.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `resolve`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `IocResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/ioc.resolver.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `resolve`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ReportResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/report.resolver.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`, `apiUrl`
- **Methods:** `constructor`, `resolve`, `switch`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `NodeResolver`

- **Kind:** `service`
- **Source:** `client/src/app/shared/resolvers/session-data-resolver.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`, `appService: AppService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `resolve`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ApiService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/api.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `http: HttpClient`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `baseUrl`
- **Methods:** `constructor`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ConsolidatedApiService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/consolidated.api.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `http: HttpClient`, `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `endpoint`, `payload`, `endpoint`, `payload`, `endpoint`, `payload`, `default`, `payload`, `data`, `data`, `data`, `data`, `data`, `data`, `data`, `data`
- **Methods:** `constructor`, `getLiveApiDetails`, `switch`, `fetchLiveApiResults`, `shouldContinueLivePolling`, `runLiveApiSearch`, `scan`, `if`, `if`, `scanDomain`, `scanForRepo`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DemoTourService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/demo.tour.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `appService: AppService`, `apiService: ApiService`, `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `steps`, `capturedValues`, `currentStepIndex`
- **Methods:** `constructor`, `if`, `startTour`, `next`, `if`, `prev`, `if`, `end`, `updateUser`, `getCurrentStep`, `getStep`, `getTotalSteps`, `setCapturedValue`, `getCapturedValue`, `getCapturedValues`, `getTourStepsForCurrentLicense`, `for`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ErrorStoreService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/error-store.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `router: Router`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `errorSubject`, `route`
- **Methods:** `constructor`, `setError`, `clearError`, `setupRouterListener`, `while`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `AlertExportService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/export/alert-export.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `documentExport: DocumentExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `graphKind`
- **Methods:** `constructor`, `exportPdf`, `buildPayload`, `if`, `getText`, `if`, `getDateText`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `DocumentExportService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/export/document-export.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `startY`, `startY`, `markerY`, `startY`, `didDrawPage`
- **Methods:** `exportDocumentPdf`, `exportDocumentPdfStream`, `if`, `if`, `drawCover`, `if`, `makeHeaderFooterHooks`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ExportSharedService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/export/export-shared.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `toRecord`, `if`, `if`, `if`, `cleanText`, `toTitle`, `normalizeUrl`, `if`, `compactMiddle`, `if`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `GraphExportService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/export/graph-export.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `loadedAutoTable`, `startY`, `startY`, `platformPageNo`, `startY`, `reportsPageNo`, `markerY`, `startY`, `startY`, `startY`, `imgH`, `imgW`, `imgW`, `imgH`, `out`, `drawH`, `drawW`
- **Methods:** `exportByType`, `if`, `if`, `getPdfLibs`, `if`, `requireAutoTable`, `if`, `exportGraphPdf`, `exportGraphJson`, `if`, `if`, `if`, `for`, `if`, `drawGraphCover`, `drawGraphToc`, `if`, `if`, `if`, `if`, `drawGraphSnapshot`, `if`, `drawGraphAnalysisHeader`, `drawConnectionMatrixHeader`, `drawGraphChrome`, `drawGraphFooter`, `buildPlainTableTheme`, `if`, `if`, `if`, `if`, `makeHeaderRowDidParse`, `return`, `if`, `makeFirstColumnDidParse`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ReportExportService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/export/report-export.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `graphExport: GraphExportService`, `documentExport: DocumentExportService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `constructor`, `exportByType`, `if`, `buildUnifiedGraphPayload`, `if`, `if`, `buildMetadataValues`, `for`, `if`, `buildScreenshotValues`, `buildRelatedReportsValues`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `HelperService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/helper.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `sanitizer: DomSanitizer`, `appService: AppService`, `messageNotificationService: MessageNotificationService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `title`, `end`, `lastIndex`, `i`, `renderedHtml`, `renderedHtml`
- **Methods:** `constructor`, `detectLanguageName`, `if`, `riskClass`, `if`, `if`, `if`, `extractDomain`, `extractLinks`, `if`, `downloadAsCSV`, `downloadstixJson`, `for`, `if`, `printPage`, `shareResult`, `if`, `if`, `highlightWords`, `if`, `if`, `while`, `while`, `if`, `convertToCSV`, `if`, `if`, `if`, `if`, `getActivityThreadTarget`, `if`, `switch`, `if`, `normalizeShareUrl`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `IconService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/icon.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `iconCache`, `hash`
- **Methods:** `getSimpleIconPath`, `if`, `buildIconSvg`, `buildFallbackSvg`, `getWhiteIconDataUrl`, `getPlatformBrandColor`, `if`, `generateColorFromText`, `for`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `InsightCacheService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/insight-cache.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `apiService: ApiService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `warmed`, `error`
- **Methods:** `constructor`, `getInsight`, `if`, `warmInsight`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `LoadingService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/loading.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `show`, `hide`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ProxyController`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/proxy-controller.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `if`, `if`, `initialize`, `if`, `open`, `if`, `if`, `getAnchorFromEvent`, `for`, `resolveTargetUrl`, `if`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ResultRowHelperService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/result-row-helper.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** -
- **Methods:** `isCopied`, `normalizeToArray`, `if`, `prettyLabel`, `if`, `if`, `valueOrDash`, `if`, `arrayOrDash`, `if`, `truncate`, `if`, `if`, `copyToClipboard`, `if`, `copyText`, `if`, `if`, `if`, `setCopiedState`, `if`, `copyWithExecCommand`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `ScrollService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/scroll.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** `licenseService: LicenseService`, `dashboardService: DashboardService`
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`, `savedWindowPosition`, `savedContainerPosition`, `savedDocumentPosition`, `savedBodyPosition`, `savedDashboardBodyPosition`
- **Methods:** `constructor`, `clearSavedPosition`, `resetOnReload`, `if`, `openCTI`, `if`, `scrollReportToTop`, `if`, `if`, `if`, `if`, `requestAnimationFrame`, `setTimeout`, `setTimeout`, `saveCurrentPosition`, `scrollToSavedPosition`, `if`, `if`, `if`, `if`, `if`, `requestAnimationFrame`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

### `SidebarService`

- **Kind:** `service`
- **Source:** `client/src/app/shared/services/sidebar.service.ts`
- **Selector:** `-`
- **Template:** `-`
- **Styles:** -
- **Standalone:** `unspecified`
- **Summary:** Angular injectable service, resolver, or guard.
- **Imports:** -
- **Injected services:** -
- **Inputs:** -
- **Outputs:** -
- **Properties:** `providedIn`
- **Methods:** `openSidebar`, `closeSidebar`
- **Template data-testid markers:** -
- **Template router links:** -
- **Template events:** -

