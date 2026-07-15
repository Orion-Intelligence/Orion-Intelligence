const REPORT_ROUTE_SECTIONS = new Set([
  'breach',
  'strategic',
  'defacement',
  'exploit',
  'apt-intel',
  'threat-intel',
  'social',
  'discussion',
  'feed',
  'consolidated'
]);

const SOCIAL_REPORT_CATEGORIES = new Set([
  'all',
  'twitter',
  'reddit',
  'forum',
  'pastebin',
  'mastodon',
  'facebook',
  'instagram',
  'linkedin',
  'tiktok',
  'youtube'
]);

export class ReportRouteUtil {
  static getReportDetailEndpointForRoute(section: string, category: string, reportId?: string | null): string {
    const type = ReportRouteUtil.getReportSearchTypeForRoute(section, category);
    return ReportRouteUtil.buildReportDetailEndpoint(type, reportId);
  }

  static getConsolidatedReportDetailEndpoint(index: string | null | undefined, reportId?: string | null): string {
    const type = ReportRouteUtil.normalizeConsolidatedReportSearchType(index);
    if (!type) {
      return '';
    }
    const endpointType = !reportId && type === 'social' ? 'chat' : type;
    return ReportRouteUtil.buildReportDetailEndpoint(endpointType, reportId);
  }

  static getReportDetailEndpointFromUrl(url: URL | string): string {
    const currentUrl = typeof url === 'string' ? new URL(url, window.location.origin) : url;
    const segments = currentUrl.pathname.split('/').filter(Boolean);
    const reportId = segments[segments.length - 1] || '';
    const type = ReportRouteUtil.getReportSearchTypeFromUrl(currentUrl, segments);
    return ReportRouteUtil.buildReportDetailEndpoint(type, reportId);
  }

  static getReportSearchTypeFromUrl(currentUrl: URL, segments = currentUrl.pathname.split('/').filter(Boolean)): string {
    const section = ReportRouteUtil.getReportRouteSection(segments);
    const queryType = ReportRouteUtil.normalizeConsolidatedReportSearchType(currentUrl.searchParams.get('ci'));
    if (section === 'consolidated' && queryType) {
      return queryType;
    }

    const category = segments[segments.length - 2] || '';
    const parentCategory = category === 'all' ? segments[segments.length - 3] || '' : category;
    return ReportRouteUtil.getReportSearchTypeForRoute(section, parentCategory || category);
  }

  static getReportRouteSection(segments: string[]): string {
    return segments.find(segment => REPORT_ROUTE_SECTIONS.has(segment)) || '';
  }

  static getReportSearchTypeForRoute(section: string, category: string): string {
    const normalizedSection = section.toLowerCase();
    const normalizedCategory = category.toLowerCase();

    if (normalizedSection === 'breach' || normalizedSection === 'strategic' || normalizedSection === 'defacement' || normalizedSection === 'exploit') {
      return normalizedSection;
    }
    if (normalizedSection === 'feed') {
      return 'news';
    }
    if (normalizedSection === 'apt-intel' || normalizedSection === 'threat-intel') {
      return normalizedCategory === 'compromised-actors'
        ? 'defacement'
        : ReportRouteUtil.normalizeAptReportSearchType(normalizedCategory) || 'apt';
    }
    if (normalizedSection === 'social') {
      return normalizedCategory === 'social' || SOCIAL_REPORT_CATEGORIES.has(normalizedCategory) ? 'social' : 'chat';
    }
    if (normalizedSection === 'discussion' || normalizedSection === 'consolidated') {
      return ReportRouteUtil.normalizeConsolidatedReportSearchType(normalizedCategory) || 'chat';
    }
    if (normalizedCategory === 'all' && normalizedSection) {
      return ReportRouteUtil.normalizeConsolidatedReportSearchType(normalizedSection) || normalizedSection;
    }

    return ReportRouteUtil.normalizeConsolidatedReportSearchType(normalizedCategory) || normalizedCategory;
  }

  static normalizeConsolidatedReportSearchType(value: string | null | undefined): string {
    const type = (value || '').replace('_model', '').toLowerCase();
    switch (type) {
      case 'leak':
      case 'tracking':
      case 'news':
        return 'breach';
      case 'general':
      case 'generic':
        return 'strategic';
      case 'credential':
        return 'chat';
      case 'malware-bazaar':
        return 'malware';
      case 'breach':
      case 'strategic':
      case 'defacement':
      case 'exploit':
      case 'apt':
      case 'malware':
      case 'social':
      case 'chat':
        return type;
      default:
        return '';
    }
  }

  private static normalizeAptReportSearchType(category: string): string {
    if (category === 'apt') {
      return 'apt';
    }
    if (category === 'malware' || category === 'malware-bazaar') {
      return 'malware';
    }
    return '';
  }

  private static buildReportDetailEndpoint(type: string, reportId?: string | null): string {
    if (!type) {
      return '';
    }
    return reportId ? `search/${type}/${reportId}` : `search/${type}`;
  }
}
