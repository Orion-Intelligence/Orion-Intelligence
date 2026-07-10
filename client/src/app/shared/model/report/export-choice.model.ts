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

export const RESULT_REPORT_EXPORT_OPTIONS = REPORT_EXPORT_OPTIONS;
