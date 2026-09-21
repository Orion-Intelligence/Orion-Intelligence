const BACKUP_TIMESTAMP_PATTERN = /(\d{4})_(\d{2})_(\d{2})_(\d{2})_(\d{2})_(\d{2})/;

export const STALE_BACKUP_HOURS = 24;

export function parseBackupTimestamp(name: string): Date | null {
  const match = BACKUP_TIMESTAMP_PATTERN.exec(name);
  if (!match) {
    return null;
  }
  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatRelativeAge(date: Date, now: Date = new Date()): string {
  const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
  if (seconds < 60) {
    return 'just now';
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function isStaleBackup(date: Date, now: Date = new Date(), hours: number = STALE_BACKUP_HOURS): boolean {
  return now.getTime() - date.getTime() > hours * 60 * 60 * 1000;
}
