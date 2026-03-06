export interface GraphReportNode {
  id: string;
  label: string;
  type: string;
}

export interface GraphReportEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface GraphReportTableRow {
  title: string;
  values: Record<string, string>;
}

export interface GraphReportPayload {
  graphKind: 'cti' | 'social';
  title: string;
  sessionName: string;
  generatedAtIso: string;
  nodes: GraphReportNode[];
  edges: GraphReportEdge[];
  summary: Record<string, string | number>;
  tables?: GraphReportTableRow[];
  graphImageDataUrl?: string;
}

export type GraphReportExportType = 'json' | 'graph_pdf' | 'doc_pdf';

export interface UnifiedReportPayloadInput {
  currentRouteUrl: string;
  csvObject: string | object | null | undefined;
  url: string | null | undefined;
  content: string | null | undefined;
  lang: string;
  langDetected: string;
}

export type GraphReportMeta = {
  generatedAt: string;
  kindLabel: string;
};
