import type { social_stealer_log } from '../models/social.models';
import { ExportBrandingService } from '../../../shared/services/export/export-branding.service';

export const STEALER_LOG_EXPORT_COLUMNS = ['tenant_name', 'recordType', 'recordIndex', 'searchQuery', 'email', 'username', 'domain', 'source', 'hash', 'title', 'url', 'rank', 'date', 'team', 'summary'] as const;

export function buildStealerLogExportRow(exportBranding: ExportBrandingService, item: social_stealer_log, index: number, searchQuery: string): Record<string, string> {
  return {
    tenant_name: exportBranding.getTenantName(),
    recordType: 'stealer',
    recordIndex: String(index + 1),
    searchQuery,
    email: String(item?.email ?? item?.m_email ?? '-'),
    username: String(item?.username ?? item?.m_username ?? '-'),
    domain: String(item?.domain ?? item?.m_domain ?? '-'),
    source: String(exportBranding.replaceSystemBrand(String(item?.channel ?? item?.filename ?? item?.file ?? item?.m_source ?? item?.m_scrap_file ?? '-'))),
    hash: String(item?.m_hash ?? '-'),
    title: '-',
    url: String(item?.url ?? item?.m_url ?? '-'),
    rank: '-',
    date: String(item?.date ?? item?.m_date ?? '-'),
    team: '-',
    summary: '-'
  };
}
