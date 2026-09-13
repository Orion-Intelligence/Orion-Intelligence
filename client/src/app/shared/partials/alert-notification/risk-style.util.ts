import { getOwnProperty } from '../../utils/type-guards.util';

const RISK_ICON: Record<string, string> = {
  critical: 'bi-exclamation-octagon-fill',
  high: 'bi-exclamation-triangle-fill',
  medium: 'bi-exclamation-circle-fill',
  low: 'bi-info-circle-fill'
};

const RISK_ICON_COLOR: Record<string, string> = {
  critical: '[&_i]:text-[#ef4444] [body.light-theme_&]:[&_i]:text-red-700',
  high: '[&_i]:text-[#f97316] [body.light-theme_&]:[&_i]:text-orange-700',
  medium: '[&_i]:text-[#f59e0b] [body.light-theme_&]:[&_i]:text-amber-700',
  low: '[&_i]:text-[#60a5fa] [body.light-theme_&]:[&_i]:text-sky-700'
};

const RISK_LABEL: Record<string, string> = {
  critical: 'border border-[var(--color-border)] bg-[rgb(255_76_76/10%)] text-[#ff4c4c] [body.light-theme_&]:border-[#f3b6bb] [body.light-theme_&]:bg-[#feecec] [body.light-theme_&]:text-[#dc2626]',
  high: 'border border-[var(--color-border)] bg-[rgb(255_179_71/10%)] text-[#ffb347] [body.light-theme_&]:border-[#efcd98] [body.light-theme_&]:bg-[#fff5e8] [body.light-theme_&]:text-[#c66a08]',
  medium: 'border border-[var(--color-border)] bg-[rgb(255_217_102/10%)] text-[#ffd966] [body.light-theme_&]:border-[#e8d694] [body.light-theme_&]:bg-[#fffbe6] [body.light-theme_&]:text-[#a16207]',
  low: 'border border-[var(--color-border)] bg-[rgb(108_207_126/10%)] text-[#6ccf7e] [body.light-theme_&]:border-[#b7dec0] [body.light-theme_&]:bg-[#e8f8ec] [body.light-theme_&]:text-[#166534]'
};

export function riskIcon(risk: string): string {
  return getOwnProperty(RISK_ICON, (risk || '').toLowerCase()) ?? 'bi-info-circle-fill';
}

export function riskIconColorClass(risk: string): string {
  return getOwnProperty(RISK_ICON_COLOR, (risk || '').toLowerCase()) ?? '[body.light-theme_&]:[&_i]:text-sky-700';
}

export function riskLabelClass(risk: string): string {
  return getOwnProperty(RISK_LABEL, (risk || '').toLowerCase()) ?? '';
}
