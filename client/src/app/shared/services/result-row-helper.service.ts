import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ResultRowHelperService {
  normalizeToArray(value: any): string[] {
    if (value == null) {
      return [];
    }
    if (Array.isArray(value)) {
      return value.map(v => String(v)).filter(Boolean);
    }
    return [String(value)].filter(Boolean);
  }

  prettyLabel(key: string): string {
    const cleaned = String(key).replace(/^m_/, '').replace(/[_\-]+/g, ' ').replace(/[^a-zA-Z0-9 ]/g, ' ').trim();
    if (!cleaned) {
      return String(key);
    }
    if (cleaned.length < 4) {
      return cleaned.toUpperCase();
    }
    return cleaned.toLowerCase().replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1));
  }

  valueOrDash(value: any): string {
    if (value == null || value === '') {
      return '-';
    }
    return String(value);
  }

  arrayOrDash(value: any, joinBy: string = ', '): string {
    const values = this.normalizeToArray(value);
    if (values.length === 0) {
      return '-';
    }
    return values.join(joinBy);
  }

  truncate(value: any, max: number = 30): string {
    const text = value == null ? '' : String(value);
    if (!text) {
      return '-';
    }
    if (text.length > max) {
      return `${text.slice(0, max)}...`;
    }
    return text;
  }

  async copyToClipboard(value: string): Promise<boolean> {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    }
    catch {
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = value;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      ta.style.top = '0';
      ta.setAttribute('readonly', '');
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    }
    catch {
      return false;
    }
  }
}
