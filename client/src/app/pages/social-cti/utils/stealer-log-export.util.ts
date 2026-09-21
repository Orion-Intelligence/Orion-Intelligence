import type { social_stealer_log } from '../models/social.models';
import { ExportBrandingService } from '../../../shared/services/export/export-branding.service';

export const STEALER_LOG_EXPORT_COLUMNS = ['recordIndex', 'searchQuery', 'email', 'username', 'domain', 'url', 'source', 'date'] as const;

export function buildStealerLogExportRow(exportBranding: ExportBrandingService, item: social_stealer_log, index: number, searchQuery: string): Record<string, string> {
  return {
    recordIndex: String(index + 1),
    searchQuery,
    email: String(item?.email ?? item?.m_email ?? '-'),
    username: String(item?.username ?? item?.m_username ?? '-'),
    domain: String(item?.domain ?? item?.m_domain ?? item?.source_domain ?? item?.m_source_domain ?? '-'),
    url: String(item?.url ?? item?.m_url ?? '-'),
    source: String(exportBranding.replaceSystemBrand(String(item?.channel ?? item?.filename ?? item?.file ?? item?.m_source ?? item?.m_scrap_file ?? '-'))),
    date: String(item?.date ?? item?.m_date ?? '-')
  };
}
