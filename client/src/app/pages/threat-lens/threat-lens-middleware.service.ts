import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ConsolidatedCallbackModel } from '../../shared/model/results/consolidated/consolidated.callback.model';
import { ConsolidatedParamModel } from '../../shared/model/results/consolidated/consolidated.param.model';
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

const COUNTRY_FIELDS = ['m_country', 'm_country_name', 'm_location', 'country', 'location'];

const THREAT_LENS_CATEGORY_CONFIG = [
  { key: 'leak_model', label: 'Leak', color: [244, 114, 182] as [number, number, number] },
  { key: 'tracking_model', label: 'Tracking', color: [250, 204, 21] as [number, number, number] },
  { key: 'news_model', label: 'News', color: [34, 211, 238] as [number, number, number] },
  { key: 'exploit_model', label: 'Exploit', color: [251, 146, 60] as [number, number, number] },
  { key: 'defacement_model', label: 'Defacement', color: [248, 113, 113] as [number, number, number] },
  { key: 'chat_model', label: 'Chat', color: [167, 139, 250] as [number, number, number] },
  { key: 'social_model', label: 'Social', color: [74, 222, 128] as [number, number, number] },
  { key: 'generic_model', label: 'Generic', color: [148, 163, 184] as [number, number, number] },
] as const;

export type ThreatLensCategoryModelKey = typeof THREAT_LENS_CATEGORY_CONFIG[number]['key'];
export type ThreatLensRequestPayload = ConsolidatedParamModel;

export interface ThreatCountryCount {
  country: string;
  count: number;
}

export interface ThreatLensCategoryMapData {
  categoryKey: ThreatLensCategoryModelKey;
  categoryLabel: string;
  color: [number, number, number];
  countryCounts: ThreatCountryCount[];
  totalResults: number;
  documentCountryGroups: string[][];
}

export interface ThreatLensMapData {
  countryCounts: ThreatCountryCount[];
  totalResults: number;
  maxCount: number;
  categoryData: ThreatLensCategoryMapData[];
}

@Injectable({ providedIn: 'root' })
export class ThreatLensMiddlewareService {
  constructor(private api: ApiService) {}

  fetchThreatLensData(payload?: Partial<ThreatLensRequestPayload>): Observable<ConsolidatedCallbackModel> {
    return this.api.post<ConsolidatedCallbackModel>('threat/lens', { ...new ConsolidatedParamModel(), ...payload });
  }

  getThreatLensMapData(payload?: Partial<ThreatLensRequestPayload>): Observable<ThreatLensMapData> {
    return this.fetchThreatLensData(payload).pipe(map((response) => this.buildMapDataFromResponse(response)));
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

  private buildMapDataFromResponse(response: ConsolidatedCallbackModel): ThreatLensMapData {
    const normalizedResponse = new ConsolidatedCallbackModel(response);
    const overallCountryCounts = new Map<string, number>();
    const overallCountryNames = new Map<string, string>();
    const categoryData: ThreatLensCategoryMapData[] = [];
    let totalResults = 0;

    for (const category of THREAT_LENS_CATEGORY_CONFIG) {
      const documents = this.dedupeDocuments(this.extractResultItems(normalizedResponse[category.key]));
      totalResults += documents.length;

      const categoryCountryCounts = new Map<string, number>();
      const categoryCountryNames = new Map<string, string>();
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
          categoryCountryCounts.set(key, (categoryCountryCounts.get(key) || 0) + 1);
          overallCountryCounts.set(key, (overallCountryCounts.get(key) || 0) + 1);

          if (!categoryCountryNames.has(key)) {
            categoryCountryNames.set(key, normalized);
          }

          if (!overallCountryNames.has(key)) {
            overallCountryNames.set(key, normalized);
          }
        }

        if (countriesForDoc.length) {
          documentCountryGroups.push(countriesForDoc);
        }
      }

      const rankedCategoryCounts = this.rankCountryCounts(categoryCountryCounts, categoryCountryNames);
      if (!documents.length && !rankedCategoryCounts.length) {
        continue;
      }

      categoryData.push({
        categoryKey: category.key,
        categoryLabel: category.label,
        color: category.color,
        countryCounts: rankedCategoryCounts,
        totalResults: documents.length,
        documentCountryGroups,
      });
    }

    const countryCounts = this.rankCountryCounts(overallCountryCounts, overallCountryNames);
    return {
      countryCounts,
      totalResults,
      maxCount: countryCounts.length ? countryCounts[0].count : 0,
      categoryData,
    };
  }

  private rankCountryCounts(countryCounts: Map<string, number>, countryNames: Map<string, string>): ThreatCountryCount[] {
    return Array.from(countryCounts.entries())
      .map(([key, count]) => ({
        country: countryNames.get(key) || key,
        count,
      }))
      .sort((a, b) => b.count - a.count);
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

  private extractResultItems(model: { Result?: any[] } | undefined): any[] {
    return Array.isArray(model?.Result) ? model.Result : [];
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
