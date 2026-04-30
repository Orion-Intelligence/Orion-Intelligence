export function supportsFileUploadForRuleType(ruleType: string): boolean {
  return ruleType === 'unique' || ruleType === 'shared';
}

export function supportsValueUploadForRuleType(ruleType: string): boolean {
  return ruleType === 'shared' || ruleType === 'generic';
}
