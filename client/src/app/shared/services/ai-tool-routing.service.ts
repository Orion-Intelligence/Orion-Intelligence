import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

type AiToolRouteConfig = {
  type: string;
  message: string;
};

@Injectable({ providedIn: 'root' })
export class AiToolRoutingService {
  private readonly defaultMessage = 'Ask me what to check and I will use the active Orion route.';
  private readonly routeMappings: Array<{ pattern: RegExp } & AiToolRouteConfig> = [
    { pattern: /\/dashboard\/strategic\b/, type: '/api/search/strategic', message: 'Ask me to search strategic intelligence reports. You can refine the query, filters, network, country, or date range.' },
    { pattern: /\/dashboard\/breach\b/, type: '/api/search/breach', message: 'Ask me to search breach intelligence. You can refine the target, leak category, filters, country, network, or date range.' },
    { pattern: /\/dashboard\/social\b/, type: '/api/search/social', message: 'Ask me to search social intelligence. You can refine usernames, platforms, forums, Telegram, filters, or date range.' },
    { pattern: /\/dashboard\/exploit\b/, type: '/api/search/exploit', message: 'Ask me to search exploit intelligence. You can refine CVE, product, severity, platform, tags, or date range.' },
    { pattern: /\/dashboard\/(?:apt-intel|threat-intel)\b/, type: '/api/search/apt-intel', message: 'Ask me to search APT and malware intelligence. You can refine actor, malware family, country, tags, or date range.' },
    { pattern: /\/dashboard\/defacement\b/, type: '/api/search/defacement', message: 'Ask me to search defacement intelligence. You can refine domains, hacked pages, phishing, malware URLs, country, or date range.' },
    { pattern: /\/dashboard\/consolidated\b/, type: '/api/search/consolidated', message: 'Ask me to search across consolidated intelligence. You can refine the query, category, filters, network, country, or date range.' },
    { pattern: /\/dashboard\/stealerlogs\b/, type: '/api/search/stealer/ioc', message: 'Ask me to search stealer IoCs. You can provide an IP, domain, URL, hash, username, or filter details.' },
    { pattern: /\/dashboard\/api\/email-breach\b/, type: '/api/dynamic/user', message: 'Send an email address or username to check for exposed account records.' },
    { pattern: /\/dashboard\/api\/social-scanner\b/, type: '/api/dynamic/social', message: 'Send a social handle or account identifier to check public social presence and exposure records.' },
    { pattern: /\/dashboard\/api\/wanted-list\b/, type: '/api/dynamic/wanted', message: 'Send a person name or alias to search wanted and watchlist records.' },
    { pattern: /\/dashboard\/api\/national-identity\b/, type: '/api/dynamic/national-identity', message: 'Send a CNIC, phone number, or family number to run the Pakistan identity lookup.' },
    { pattern: /\/dashboard\/api\/playstore-scanner\b/, type: '/api/dynamic/cracked', message: 'Send a Google Play URL or Android package name to check redistributed or modified app records.' },
    { pattern: /\/dashboard\/api\/software-scanner\b/, type: '/api/dynamic/software', message: 'Send a software, game, tool, or package name to check unofficial software records.' },
    { pattern: /\/dashboard\/api\/text-analysis\b/, type: '/api/nexus/analyze-text', message: 'Paste text to analyze spam, phishing, URLs, and safety verdicts.' },
    { pattern: /\/dashboard\/api\/crypto-scanner\b/, type: '/api/crypto/scan', message: 'Send a wallet address or transaction hash to check blockchain risk context.' },
  ];
  private readonly apiTypeMappings: Record<string, AiToolRouteConfig> = {
    user: { type: '/api/dynamic/user', message: 'Send an email address or username to check for exposed account records.' },
    social: { type: '/api/dynamic/social', message: 'Send a social handle or account identifier to check public social presence and exposure records.' },
    wanted: { type: '/api/dynamic/wanted', message: 'Send a person name or alias to search wanted and watchlist records.' },
    'national-identity': { type: '/api/dynamic/national-identity', message: 'Send a CNIC, phone number, or family number to run the Pakistan identity lookup.' },
    cracked: { type: '/api/dynamic/cracked', message: 'Send a Google Play URL or Android package name to check redistributed or modified app records.' },
    software: { type: '/api/dynamic/software', message: 'Send a software, game, tool, or package name to check unofficial software records.' },
    crypto: { type: '/api/crypto/scan', message: 'Send a wallet address or transaction hash to check blockchain risk context.' },
    'text-analysis': { type: '/api/nexus/analyze-text', message: 'Paste text to analyze spam, phishing, URLs, and safety verdicts.' },
    'stealer-ioc': { type: '/api/search/stealer/ioc', message: 'Send an IP, domain, URL, hash, username, or IoC filter to search stealer intelligence.' },
  };

  constructor(private router: Router) {}

  getType(route = this.router.url): string {
    return this.getRouteConfig(route).type;
  }

  getMessage(route = this.router.url): string {
    return this.getRouteConfig(route).message;
  }

  getTypeForApiType(apiType = ''): string {
    return this.getApiTypeConfig(apiType).type;
  }

  getMessageForApiType(apiType = ''): string {
    return this.getApiTypeConfig(apiType).message;
  }

  getTypeForEndpoint(endpoint = ''): string {
    return this.getEndpointConfig(endpoint).type;
  }

  getMessageForEndpoint(endpoint = ''): string {
    return this.getEndpointConfig(endpoint).message;
  }

  private getRouteConfig(route = this.router.url): AiToolRouteConfig {
    const cleanRoute = String(route || '');
    if (cleanRoute.startsWith('/api/')) {
      return this.getEndpointConfig(cleanRoute);
    }
    return this.routeMappings.find(({ pattern }) => pattern.test(cleanRoute)) || { type: 'default', message: this.defaultMessage };
  }

  private getApiTypeConfig(apiType = ''): AiToolRouteConfig {
    return this.apiTypeMappings[String(apiType || '').trim()] || { type: 'default', message: this.defaultMessage };
  }

  private getEndpointConfig(endpoint = ''): AiToolRouteConfig {
    const cleanEndpoint = this.normalizeApiEndpoint(endpoint);
    if (!cleanEndpoint) {
      return this.getRouteConfig();
    }
    return this.routeMappings.find(route => route.type === cleanEndpoint)
      || Object.values(this.apiTypeMappings).find(config => config.type === cleanEndpoint)
      || { type: cleanEndpoint, message: this.defaultMessage };
  }

  private normalizeApiEndpoint(endpoint: string): string {
    const cleanEndpoint = String(endpoint || '').trim();
    if (!cleanEndpoint) {
      return '';
    }
    return cleanEndpoint.startsWith('/api/') ? cleanEndpoint : `/api/${cleanEndpoint.replace(/^\/+/, '')}`;
  }
}
