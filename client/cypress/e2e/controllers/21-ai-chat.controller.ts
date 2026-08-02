export const selector = (testId: string): string => `[data-testid="${testId}"]`;

export const firstByPrefix = (prefix: string): string => `[data-testid^="${prefix}"]`;

export const AI_CHAT_MESSAGE = 'Cypress dummy AI message';
export const AI_CHAT_RESPONSE = 'how may i help you';
export const AI_CHAT_RENAMED_TITLE = 'Cypress AI Renamed Chat';

export const AI_CHAT_VIEW_CASES = [
  {
    buttonTestId: 'ai-window-view-directory',
    visibleTestIds: ['ai-directory-tab-files'],
  },
  {
    buttonTestId: 'ai-window-view-split',
    visibleTestIds: ['chat-widget-input', 'ai-directory-tab-files'],
  },
  {
    buttonTestId: 'ai-window-view-chat',
    visibleTestIds: ['chat-widget-input'],
  },
] as const;
