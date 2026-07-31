export interface ExportChoiceOption {
  value: string;
  title: string;
  description?: string;
  testId?: string;
}

export const buildStandardExportOptions = (testIdPrefix: string, pdfValue = 'report', pdfDescription = 'Generate PDF export for this report.'): ExportChoiceOption[] => [
  {
    value: pdfValue,
    title: '1. Export Report (PDF)',
    description: pdfDescription,
    testId: `${testIdPrefix}-report`
  },
  {
    value: 'json',
    title: '2. Download JSON',
    description: 'Download machine-readable report data.',
    testId: `${testIdPrefix}-json`
  },
  {
    value: 'csv',
    title: '3. Export CSV',
    description: 'Download this report as a CSV file.',
    testId: `${testIdPrefix}-csv`
  }
];

export const GRAPH_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('graph-report-export', 'graph_pdf', 'Visual graph-focused PDF with composition and key connections.');

export const REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('graph-report-export', 'report', 'Generate document PDF export for this report.');

export const CREDENTIAL_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('graph-report-export', 'report', 'Generate consistent graph-model report PDF export.');

export const ALERT_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('notification-alert-export-option', 'report', 'Generate PDF export for selected alert.');

export const AUDITLOG_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('auditlog-export-option');

export const PROFILE_STEALERLOG_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('social-stealerlog-export');

export const STEALERLOG_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('social-dashboard-stealer-export');

export const NETWORK_INTEL_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('network-intel-export', 'report', 'Generate consistent network intelligence PDF export.');

export const SECURITY_SCAN_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('security-scan-export', 'report', 'Generate consistent scan report PDF export.');

export const CASE_SHARE_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('case-share-export-option', 'report', 'Download the shared case report as a PDF file.');

export const DASHBOARD_API_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('dashboard-api-export', 'report', 'Generate consistent report PDF export.');

export const FILE_SCAN_EXPORT_OPTIONS: ExportChoiceOption[] = buildStandardExportOptions('file-scan-export', 'report', 'Generate consistent scan report PDF export.');

export const RESULT_REPORT_EXPORT_OPTIONS = REPORT_EXPORT_OPTIONS;
