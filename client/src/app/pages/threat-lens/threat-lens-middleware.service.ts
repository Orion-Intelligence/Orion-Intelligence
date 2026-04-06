import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';

const COUNTRY_ALIAS: Record<string, string> = {
  usa: 'United States',
  us: 'United States',
  'u.s.a': 'United States',
  'u.s': 'United States',
  uk: 'United Kingdom',
  uae: 'United Arab Emirates',
  ksa: 'Saudi Arabia',
  russia: 'Russia',
  southkorea: 'South Korea',
  northkorea: 'North Korea',
};

const DEFAULT_PAYLOAD: ThreatLensRequestPayload = {
  q: '',
  page: 1,
  category: 'news',
  fullsearch: false,
  safe: false,
  must: false,
  network: 'all',
  matchtype: 'or',
  content: 'all',
  platform: '',
  url: '',
  user: '',
  ioc: '',
  daterange: '',
};

const COUNTRY_FIELDS = ['m_country', 'm_country_name', 'm_location', 'country', 'location'];

export interface ThreatLensRequestPayload {
  q: string;
  page: number;
  category: string;
  fullsearch: boolean;
  safe: boolean;
  must: boolean;
  network: string;
  matchtype: string;
  content: string;
  platform: string;
  url: string;
  user: string;
  ioc: string;
  daterange: string;
}

export interface ThreatCountryCount {
  country: string;
  count: number;
}

export interface ThreatLensCountryStats {
  countryCounts: ThreatCountryCount[];
  totalNews: number;
  maxCount: number;
}

export interface ThreatLensMapData extends ThreatLensCountryStats {
  documentCountryGroups: string[][];
}

type ThreatLensApiResponse = {
  Result?: any[];
  result?: any[];
  news_model?: { Result?: any[] };
};

@Injectable({ providedIn: 'root' })
export class ThreatLensMiddlewareService {
  private readonly pagesToAggregate = 4;

  constructor(private api: ApiService) {}

  fetchThreatLensNews(payload?: Partial<ThreatLensRequestPayload>): Observable<ThreatLensApiResponse> {
    return this.api.post<ThreatLensApiResponse>('threat/lens', { ...DEFAULT_PAYLOAD, ...payload });
  }

  getThreatLensMapData(payload?: Partial<ThreatLensRequestPayload>): Observable<ThreatLensMapData> {
    const basePage = Math.max(1, Number(payload?.page || 1));
    const requests = Array.from({ length: this.pagesToAggregate }, (_, index) => this.fetchThreatLensNews({
      ...payload,
      page: basePage + index,
    }));

    return forkJoin(requests).pipe(map((responses) => this.buildMapDataFromResponses(responses)));
  }

  toCountryKey(value: string): string {
    return value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  normalizeCountryLabel(rawValue: string): string {
    const value = String(rawValue || '').trim();
    if (!value) {
      return '';
    }

    const compact = value.replace(/[.]/g, '').replace(/\s+/g, ' ').trim();
    const aliasKey = compact.toLowerCase().replace(/\s+/g, '');

    if (COUNTRY_ALIAS[aliasKey]) {
      return COUNTRY_ALIAS[aliasKey];
    }

    return this.resolveRegionCode(compact) || compact;
  }

  private buildMapDataFromResponses(responses: ThreatLensApiResponse[]): ThreatLensMapData {
    const documents = this.dedupeDocuments(responses.flatMap((response) => this.extractResultItems(response)));

    const countryCounts = new Map<string, number>();
    const countryNames = new Map<string, string>();
    const documentCountryGroups: string[][] = [];

    for (const document of documents) {
      const seenKeys = new Set<string>();
      const countriesForDoc: string[] = [];

      for (const country of this.extractCountries(document)) {
        const normalized = this.normalizeCountryLabel(country);
        const key = this.toCountryKey(normalized);

        if (!key || seenKeys.has(key)) {
          continue;
        }

        seenKeys.add(key);
        countriesForDoc.push(normalized);
        countryCounts.set(key, (countryCounts.get(key) || 0) + 1);

        if (!countryNames.has(key)) {
          countryNames.set(key, normalized);
        }
      }

      if (countriesForDoc.length) {
        documentCountryGroups.push(countriesForDoc);
      }
    }

    const rankedCountryCounts: ThreatCountryCount[] = Array.from(countryCounts.entries())
      .map(([key, count]) => ({
        country: countryNames.get(key) || key,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      countryCounts: rankedCountryCounts,
      totalNews: documents.length,
      maxCount: rankedCountryCounts.length ? rankedCountryCounts[0].count : 0,
      documentCountryGroups,
    };
  }

  private dedupeDocuments(documents: any[]): any[] {
    const result: any[] = [];
    const seen = new Set<string>();

    for (const document of documents) {
      const identity = this.getDocumentIdentity(document);
      if (seen.has(identity)) {
        continue;
      }

      seen.add(identity);
      result.push(document);
    }

    return result;
  }

  private getDocumentIdentity(document: any): string {
    const parts = [
      document?.m_hash,
      document?.doc_id,
      document?.id,
      document?.m_url,
      document?.m_title,
      document?.m_creation_date,
    ];

    const identity = parts
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join('|');

    return identity || JSON.stringify(document || {});
  }

  private extractResultItems(response: ThreatLensApiResponse): any[] {
    if (Array.isArray(response?.Result)) {
      return response.Result;
    }

    if (Array.isArray(response?.result)) {
      return response.result;
    }

    if (Array.isArray(response?.news_model?.Result)) {
      return response.news_model.Result;
    }

    return [];
  }

  private extractCountries(document: any): string[] {
    const countries: string[] = [];

    for (const fieldName of COUNTRY_FIELDS) {
      const value = document?.[fieldName];
      if (Array.isArray(value)) {
        for (const item of value) {
          countries.push(...this.splitCountryString(item));
        }
        continue;
      }

      countries.push(...this.splitCountryString(value));
    }

    return countries.filter(Boolean);
  }

  private splitCountryString(value: unknown): string[] {
    if (typeof value !== 'string') {
      return [];
    }

    return value
      .split(/[,;|]/g)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  private resolveRegionCode(value: string): string {
    const code = value.trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(code) || typeof Intl === 'undefined' || typeof Intl.DisplayNames !== 'function') {
      return '';
    }

    const regionName = new Intl.DisplayNames(['en'], { type: 'region' }).of(code);
    if (regionName && regionName.toUpperCase() !== code) {
      return regionName;
    }

    return '';
  }
}
