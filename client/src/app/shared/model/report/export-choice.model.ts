export interface ExportChoiceOption {
  value: string;
  title: string;
  description?: string;
  testId?: string;
}

export const GRAPH_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'json',
    title: '1. JSON (Raw Graph Data)',
    description: 'Machine-readable nodes, edges, summary, and metadata.',
    testId: 'graph-report-export-json'
  },
  {
    value: 'graph_pdf',
    title: '2. PDF Graph Report',
    description: 'Visual graph-focused PDF with composition and key connections.',
    testId: 'graph-report-export-graph-pdf'
  }
];

export const REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'json',
    title: '1. Download JSON',
    description: 'Download STIX JSON export for this report.',
    testId: 'graph-report-export-json'
  },
  {
    value: 'report',
    title: '2. Export Report (PDF)',
    description: 'Generate document PDF export for this report.',
    testId: 'graph-report-export-report'
  }
];

export const CREDENTIAL_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'csv',
    title: '1. Export CSV',
    description: 'Download this report as a CSV file.',
    testId: 'graph-report-export-csv'
  },
  {
    value: 'report',
    title: '2. Export Report (PDF)',
    description: 'Generate consistent graph-model report PDF export.',
    testId: 'graph-report-export-report'
  }
];

export const ALERT_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'report', 
    title: '1. Export Report (PDF)', 
    description: 'Generate PDF export for selected alert.', 
    testId: 'notification-alert-export-option-report'
  }
];

export const AUDITLOG_REPORT_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'report', 
    title: '1. Export CSV', 
    description: 'Download this report as a CSV file.', 
    testId: 'auditlog-export-option-csv'
  }
];

export const PROFILE_STEALERLOG_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'csv',
    title: '1. Export CSV',
    description: 'Download stealer log records as a CSV file.',
    testId: 'social-stealerlog-export-csv'
  }
];

export const STEALERLOG_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'csv',
    title: '1. Export CSV',
    description: 'Download stealer log records as a CSV file.',
    testId: 'social-dashboard-stealer-export-csv'
  }
];

export const NETWORK_INTEL_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'report',
    title: '1. Export Report (PDF)',
    description: 'Generate consistent network intelligence PDF export.',
    testId: 'network-intel-export-report'
  }
];

export const SECURITY_SCAN_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'report',
    title: '1. Export Report (PDF)',
    description: 'Generate consistent scan report PDF export.',
    testId: 'security-scan-export-report'
  },
  {
    value: 'print',
    title: '2. Print',
    description: 'Print the current scan report view.',
    testId: 'security-scan-export-print'
  }
];

export const CASE_SHARE_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'report',
    title: '1. Export Report (PDF)',
    description: 'Download the shared case report as a PDF file.',
    testId: 'case-share-export-option-report'
  }
];

export const DASHBOARD_API_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'report',
    title: '1. Export Report (PDF)',
    description: 'Generate consistent report PDF export.',
    testId: 'dashboard-api-export-report'
  }
];

export const FILE_SCAN_EXPORT_OPTIONS: ExportChoiceOption[] = [
  {
    value: 'json',
    title: '1. JSON',
    description: 'Download machine-readable scan report data.',
    testId: 'file-scan-export-json'
  }
];

export const RESULT_REPORT_EXPORT_OPTIONS = REPORT_EXPORT_OPTIONS;
