import { CASE_STATUS_WORKFLOW } from './case.config';
import { CaseStatus } from './case.model';

export interface CaseStatusBoardItem {
  value: CaseStatus;
  label: string;
  enabled: boolean;
  skippable: boolean;
}

export interface CaseStatusBoardConfig {
  statuses: CaseStatusBoardItem[];
}

export const DEFAULT_CASE_STATUS_BOARD_CONFIG: CaseStatusBoardConfig = {
  statuses: CASE_STATUS_WORKFLOW.map((status, index) => ({
    value: status.value,
    label: status.label,
    enabled: true,
    skippable: false,
    custom: false,
    order: index
  }))
};

export function getEnabledStatusWorkflow(config?: CaseStatusBoardConfig | null): { value: CaseStatus; label: string; skippable: boolean }[] {
  const source = config?.statuses?.length
    ? config.statuses
    : DEFAULT_CASE_STATUS_BOARD_CONFIG.statuses;

  return source
    .filter(status => status.enabled)
    .map(status => ({
      value: status.value,
      label: status.label || status.value,
      skippable: status.skippable,
    }));
}
