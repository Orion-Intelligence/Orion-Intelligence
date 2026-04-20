import { CustomEntity, PlatformResult } from '../../../../shared/model/social/social-scan.models';

export interface ParsedPlatformNodeId {
  keyUsername: string;
  platformName: string;
  platformUsername: string;
}

export interface EntityRecordEntry {
  key: string;
  label: string;
  values: string[];
}

export function parsePlatformNodeId(nodeId: string): ParsedPlatformNodeId | null {
  if (!nodeId.startsWith('platform-')) {
    return null;
  }
  const raw = nodeId.substring('platform-'.length);
  const firstSep = raw.indexOf('|');
  if (firstSep < 0) {
    return null;
  }
  const secondSep = raw.indexOf('|', firstSep + 1);
  if (secondSep < 0) {
    return null;
  }
  const keyUsername = raw.slice(0, firstSep);
  const platformName = raw.slice(firstSep + 1, secondSep);
  const platformUsername = raw.slice(secondSep + 1);
  if (!keyUsername || !platformName || !platformUsername) {
    return null;
  }
  return { keyUsername, platformName, platformUsername };
}

export function getScanResultsByUsername(scanResults: Map<string, PlatformResult[]>, username: string): PlatformResult[] | undefined {
  const direct = scanResults.get(username);
  if (direct) {
    return direct;
  }
  const normalized = username.toLowerCase();
  for (const [key, value] of scanResults.entries()) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }
  return undefined;
}

export function getEntityReportRecords(entity: CustomEntity): Record<string, unknown>[] {
  const report = entity.reportData;
  if (!report || typeof report !== 'object') {
    return [];
  }
  const nestedResult = (report as any)?.result;
  if (Array.isArray(nestedResult)) {
    return nestedResult as Record<string, unknown>[];
  }
  if (Array.isArray(nestedResult?.result)) {
    return nestedResult.result as Record<string, unknown>[];
  }
  if (nestedResult?.result && typeof nestedResult.result === 'object') {
    return [nestedResult.result];
  }
  if (nestedResult && typeof nestedResult === 'object') {
    return [nestedResult];
  }
  return [report];
}

export function getEntityRecordEntries(record: Record<string, unknown>): EntityRecordEntry[] {
  return Object.entries(record)
    .filter(([, value]) => value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0))
    .map(([key, value]) => ({
      key,
      label: toFieldLabel(key),
      values: toDisplayValues(value)
    }));
}

function toFieldLabel(key: string): string {
  const normalized = key.replace(/^m_/, '').replace(/_/g, ' ').trim();
  if (!normalized) {
    return key;
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function toDisplayValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    const values = value
      .filter(item => item !== null && item !== undefined && toDisplayValue(item).trim() !== '')
      .map(item => toDisplayValue(item));
    return values.length > 0 ? values : ['-'];
  }
  return [toDisplayValue(value)];
}

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  }
  catch {
    return String(value);
  }
}
