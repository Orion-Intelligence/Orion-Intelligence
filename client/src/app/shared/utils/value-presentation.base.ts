export abstract class ValuePresentationBase {
  getObjectEntries(item: any): { key: string; value: any }[] {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return [];
    }
    return Object.entries(item).map(([key, value]) => ({ key, value }));
  }

  displayFieldLabel(key: string): string {
    return key
      .replace(/^m_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  isObjectValue(value: any): boolean {
    return !!value && typeof value === 'object' && !Array.isArray(value);
  }

  isUrlValue(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }
    return /^https?:\/\//i.test(value.trim());
  }

  stringifyPrimitive(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'not available';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    return String(value);
  }
}
