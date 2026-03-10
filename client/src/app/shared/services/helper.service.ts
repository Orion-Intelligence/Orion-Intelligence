import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { franc } from 'franc-min';
import { LANGUAGE_MAP } from '../constants/shared-enums';
import { ConsolidatedParamModel } from '../model/results/consolidated/consolidated.param.model';
import { AppService } from '../../services/core/app/app.service';
import { MessageNotificationService } from '../../services/message_notification/message-notification.service';
type RiskClass = 'risk-high' | 'risk-medium' | 'risk-low' | 'risk-info';
@Injectable({
  providedIn: 'root'
})
export class HelperService {
  constructor(private sanitizer: DomSanitizer, private appService: AppService, private messageNotificationService: MessageNotificationService) {
  }

  detectLanguageName(text: string): string {
    const iso639_3 = franc(text);
    if (iso639_3 === 'und') {
      return "en";
    }
    const match = LANGUAGE_MAP[iso639_3];
    return match ? match.iso1 : "fr";
  }

  riskClass(risk: string | null | undefined): RiskClass {
    const r = String(risk || '').toLowerCase();
    if (r === 'high' || r === 'critical') {
      return 'risk-high';
    }
    if (r === 'medium') {
      return 'risk-medium';
    }
    if (r === 'low') {
      return 'risk-low';
    }
    return 'risk-info';
  }

  extractDomain(url: string): string {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0];
  }

  extractLinks(input: string): string[] {
    if (!input) {
      return [];
    }
    const matches = input.match(/\b(?:https?:\/\/)?[a-z0-9.-]+\.[a-z]{2,}(?:\/\S*)?/gi) || [];
    return matches.map(v => {
      const url = /^https?:\/\//i.test(v) ? v : 'https://' + v.replace(/^\/+/, '');
      try {
        return `https://${new URL(url).hostname.replace(/^www\./i, '')}`;
      }
      catch {
        return null;
      }
    }).filter((v): v is string => !!v);
  }

  downloadAsCSV(data: any) {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'search_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadstixJson(data: any) {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stix_report.json';
    a.click();
    window.URL.revokeObjectURL(url);
  }

  removeEmptyOrNullValues<T extends Record<string, any>>(params: T): Partial<T> {
    const defaultParams = new ConsolidatedParamModel();
    const cleanedParams: Partial<T> = {};
    for (const key in params) {
      if (!Object.prototype.hasOwnProperty.call(params, key)) {
        continue;
      }
      const value = params[key];
      const defaultValue = (defaultParams as any)[key];
      const isNullOrUndefined = value === null || value === undefined;
      const isEmptyString = typeof (value as unknown) === 'string' && (value as string).trim() === '';
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isSameAsDefault = JSON.stringify(value) === JSON.stringify(defaultValue);
      if (!isNullOrUndefined && !isEmptyString && !isEmptyArray && !isSameAsDefault || key == "q" || key == "page") {
        cleanedParams[key] = value;
      }
    }
    return cleanedParams;
  }

  printPage() {
    window.print();
  }

  shareResult(url: string) {
    const shareUrl = this.normalizeShareUrl(url);
    if (navigator.share && shareUrl) {
      navigator.share({
        title: this.appService.getConfig().appSettings.app_name,
        text: 'Sharing a relevant CTI resource for review.',
        url: shareUrl
      }).catch(() => {
        this.copyShareUrl(shareUrl);
      });
      return;
    }
    if (shareUrl) {
      this.copyShareUrl(shareUrl);
    }
  }

  highlightWords(text: string): SafeHtml {
    if (!text) {
      return '';
    }
    let highlighted: string;
    if (text.includes('<em>') && text.includes('</em>')) {
      const regex = /<em>(.*?)<\/em>/g;
      const matches = [...text.matchAll(regex)];
      let result = '';
      let lastIndex = 0;
      let i = 0;
      while (i < matches.length) {
        let merged = matches[i][1];
        const start = matches[i].index!;
        let end = start + matches[i][0].length;
        let j = i + 1;
        while (j < matches.length) {
          const prevEnd = end;
          const nextStart = matches[j].index!;
          const betweenText = text.slice(prevEnd, nextStart);
          const wordGap = betweenText
            .replace(/<[^>]+>/g, '')
            .trim()
            .split(/\s+/)
            .filter(Boolean).length;
          if (wordGap <= 2) {
            const cleanBetween = betweenText.replace(/<[^>]+>/g, '').trim();
            merged += ` ${cleanBetween} ${matches[j][1]}`;
            end = matches[j].index! + matches[j][0].length;
            j++;
          }
          else {
            break;
          }
        }
        result += text.slice(lastIndex, start);
        result += `<em>${merged}</em>`;
        lastIndex = end;
        i = j;
      }
      result += text.slice(lastIndex);
      highlighted = result
        .replace(/<em>/g,
          '<span class="bg-[var(--color-tags)] text-[var(--color-text1)] rounded-sm px-1">')
        .replace(/<\/em>/g, '</span>');
    }
    else {
      highlighted = text.length > 500 ? text.substring(0, 500) : text;
    }
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  private convertToCSV(data: any): string {
    const keys = Object.keys(data);
    const values = keys.map(key => `"${data[key]}"`).join(',');
    return `${keys.join(',')}\n${values}`;
  }

  sortByKey<T>(list: T[], key: string, order: 'asc' | 'desc' = 'asc'): T[] {
    return list.slice().sort((a, b) => {
      const aVal = (a as any)[key]?.trim?.() ?? '';
      const bVal = (b as any)[key]?.trim?.() ?? '';
      const isDateKey = /date|timestamp/i.test(key);
      if (isDateKey) {
        const timeA = new Date(aVal).getTime();
        const timeB = new Date(bVal).getTime();
        const isValidA = !isNaN(timeA);
        const isValidB = !isNaN(timeB);
        if (!isValidA && !isValidB) {
          return 0;
        }
        if (!isValidA) {
          return order === 'asc' ? 1 : -1;
        }
        if (!isValidB) {
          return order === 'asc' ? -1 : 1;
        }
        return order === 'asc' ? timeA - timeB : timeB - timeA;
      }
      const strA = aVal.toString();
      const strB = bVal.toString();
      const comparison = strA.localeCompare(strB, undefined, { sensitivity: 'base' });
      return order === 'asc' ? comparison : -comparison;
    });
  }

  private normalizeShareUrl(url: string): string {
    const raw = String(url || '').trim() || window.location.href;
    if (!raw) {
      return '';
    }
    const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      return new URL(normalized).toString();
    }
    catch {
      return window.location.href || '';
    }
  }

  private copyShareUrl(shareUrl: string): void {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        this.messageNotificationService.show('Share link copied to clipboard.', 'success');
      }).catch(() => {
        this.messageNotificationService.show(shareUrl, 'success', 5000);
      });
      return;
    }
    this.messageNotificationService.show(shareUrl, 'success', 5000);
  }
}
