import type { social_stealer_log } from '../models/social.models';
import { GraphReportRecordBlock, GraphReportTableRow } from '../../../shared/model/report/report-export.model';
import { getOwnProperty, setOwnProperty } from '../../../shared/utils/type-guards.util';

function toExportValue(value: unknown, maxLength = 120): string {
  if (Array.isArray(value)) {
    return toExportValue(value.join(', '), maxLength);
  }
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (!text) {
    return '-';
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function toExportLabel(key: string): string {
  const cleaned = String(key || '')
    .replace(/^m[_\s-]+/i, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned ? cleaned.replace(/\b\w/g, character => character.toUpperCase()) : 'Field';
}

function isSimpleExportValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(item => item === null || item === undefined || ['string', 'number', 'boolean'].includes(typeof item));
  }
  return ['string', 'number', 'boolean'].includes(typeof value);
}

function shouldSkipExportField(key: string, value: unknown): boolean {
  if (key === 'delimiter' || key === 'dismissed' || key === 'dismiss_id') {
    return true;
  }
  return key === 'm_sub_host' && toExportValue(value) === '/';
}

function firstAvailableExportValue(...values: unknown[]): string {
  for (const value of values) {
    const text = toExportValue(value, 240);
    if (text !== '-') {
      return text;
    }
  }
  return '-';
}

function addExportField(fields: Record<string, string>, label: string, value: unknown, maxLength = 240): void {
  const text = toExportValue(value, maxLength);
  if (!text || text === '-') {
    return;
  }
  let key = label;
  let suffix = 2;
  while (getOwnProperty(fields, key)) {
    key = `${label} ${suffix}`;
    suffix += 1;
  }
  setOwnProperty(fields, key, text);
}

function appendAdditionalExportFields(fields: Record<string, string>, record: Record<string, unknown>, excludedKeys: Set<string>): void {
  Object.keys(record ?? {})
    .filter(key => !excludedKeys.has(key))
    .filter(key => !shouldSkipExportField(key, getOwnProperty(record, key)))
    .filter(key => isSimpleExportValue(getOwnProperty(record, key)))
    .sort((first, second) => toExportLabel(first).localeCompare(toExportLabel(second)))
    .forEach(key => {
      addExportField(fields, toExportLabel(key), getOwnProperty(record, key), 320);
    });
}

function buildRecordBlockTitle(index: number, ...parts: string[]): string {
  const detail = parts.filter(part => part && part !== '-').slice(0, 2).join(' | ');
  const recordNumber = String(index + 1).padStart(3, '0');
  return detail ? `Record ${recordNumber} | ${detail}` : `Record ${recordNumber}`;
}

function normalizeFileType(value: string): string {
  return value.toLowerCase() === 'c' ? 'combo' : value;
}

export function buildStealerRecordBlocksTable(records: social_stealer_log[]): GraphReportTableRow {
  const recordBlocks = records.map((item, index): GraphReportRecordBlock => {
    const identity = firstAvailableExportValue(item?.email, item?.username, item?.user);
    const domain = firstAvailableExportValue(item?.domain, item?.source_domain, item?.ip);
    const values: Record<string, string> = {};
    addExportField(values, 'Email', item?.email, 180);
    addExportField(values, 'Username', item?.username, 180);
    addExportField(values, 'Password', item?.password, 220);
    addExportField(values, 'Domain', item?.domain, 240);
    addExportField(values, 'Source Domain', item?.source_domain, 240);
    addExportField(values, 'IP Address', item?.ip, 180);
    addExportField(values, 'Channel', firstAvailableExportValue(item?.channel, item?.m_channel, item?.source_channel, item?.m_source_channel), 240);
    addExportField(values, 'Date / Year', firstAvailableExportValue(item?.date, item?.timestamp, item?.m_date, item?.m_update_date), 160);
    addExportField(values, 'File Type', normalizeFileType(firstAvailableExportValue(item?.file_type, item?.fileType, item?.type)), 140);
    addExportField(values, 'Hash', firstAvailableExportValue(item?.m_hash, item?.hash), 220);
    addExportField(values, 'Raw Trace', item?.raw, 900);
    addExportField(values, 'File Name', firstAvailableExportValue(item?.filename, item?.file, item?.m_file), 220);
    appendAdditionalExportFields(values, item as Record<string, unknown>, new Set([
      '_id', 'email', 'username', 'user', 'password', 'domain', 'source_domain', 'ip',
      'channel', 'm_channel', 'source_channel', 'm_source_channel', 'date', 'timestamp',
      'm_date', 'm_update_date', 'file_type', 'fileType', 'type', 'filename', 'file',
      'm_file', 'm_hash', 'hash', 'raw', 'index', 'm_index', 'mapping'
    ]));
    return {
      title: buildRecordBlockTitle(index, identity, domain),
      values
    };
  });
  return {
    title: `Stealer Records (${recordBlocks.length})`,
    values: { records: String(recordBlocks.length) },
    recordBlocks
  };
}
