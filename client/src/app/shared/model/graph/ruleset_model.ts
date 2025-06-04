export interface RuleSet {
  edgePointers: boolean;
  edgeHighlight: boolean;
  edgeColor: boolean;
  expandTrigger: boolean;
}

const RULESET_STORAGE_KEY = 'graph_ruleset';

export function getDefaultRuleSet(): RuleSet {
  return {
    edgePointers: false,
    edgeHighlight: false,
    edgeColor: false,
    expandTrigger: false
  };
}

export function loadRuleSetFromStorage(): RuleSet {
  const raw = localStorage.getItem(RULESET_STORAGE_KEY);
  if (!raw) return getDefaultRuleSet();

  try {
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultRuleSet(),
      ...parsed
    };
  } catch {
    return getDefaultRuleSet();
  }
}

export function saveRuleSetToStorage(ruleSet: RuleSet): void {
  localStorage.setItem(RULESET_STORAGE_KEY, JSON.stringify(ruleSet));
}
