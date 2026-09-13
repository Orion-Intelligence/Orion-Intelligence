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

export const AI_WORKSPACE_ROUTE = '/dashboard/ai';
export const AI_DEEP_PROMPT = 'Cypress deep flow prompt';
export const AI_HISTORY_PROMPT = 'Cypress history recall prompt';
export const AI_EDITED_PROMPT = 'Cypress edited deep prompt';
export const AI_STOP_PROMPT = 'Cypress stop generation prompt';
export const AI_REPO_URL = 'https://github.com/octocat/Hello-World';
export const AI_OVERFLOW_TEXT = 'overflow '.repeat(340);

export const AI_MARKDOWN_MESSAGE = [
  '# Intelligence Brief',
  '## Threat Summary',
  '',
  'Paragraph with **bold**, __also bold__, *italic*, _also italic_, ~~struck~~ and `inline code`.',
  'A reference link [Example](https://example.com) is included.',
  '',
  '> First blockquote line',
  '> continues on the next line',
  '',
  '- First unordered item',
  '- Second unordered item',
  '',
  '1. First ordered step',
  '2. Second ordered step',
  '',
  '---',
  '',
  '```',
  'const risk = 42;',
  'return risk;',
  '```',
  '',
  '| threat_actor | origin_country | tags | first_seen |',
  '| --- | --- | --- | --- |',
  '| APT29 | Russia | ["phishing", "espionage"] | 2021 |',
  '| Lazarus | North Korea | finance | 2019 |',
  '',
  'Escaped \\*asterisks\\* and a \\`backtick\\` stay literal.',
].join('\n');

export const AI_MARKDOWN_STREAM_BODY = `${JSON.stringify({ output: { response: AI_MARKDOWN_MESSAGE }, done: true, error: false })}\n`;

export function openAiWorkspace(view: 'chat' | 'directory' | 'split' = 'chat') {
  void cy.intercept('GET', '**/chats').as('aiWorkspaceChats');
  void cy.visit(`${AI_WORKSPACE_ROUTE}?view=${view}`);
  void cy.get(selector('ai-workspace-root'), { timeout: 60000 }).should('be.visible');
  void cy.wait('@aiWorkspaceChats', { timeout: 60000 });
}

export function ensureActiveChat() {
  void cy.get(selector('chat-widget-input'), { timeout: 60000 }).should('be.visible');
  cy.get('body').then(($body) => {
    const newChat = $body.find(`${selector('ai-new-chat-button')}:visible`).first();
    if (newChat.length && !newChat.prop('disabled')) {
      void cy.wrap(newChat).click({ force: true });
    }
  });
  void cy.get(`${firstByPrefix('ai-chat-session-')}[data-selected="true"]`, { timeout: 60000 })
    .should('exist');
}

export function sendAiPrompt(text: string) {
  void cy.intercept('POST', '**/api/nexus/chat').as('aiDeepSend');
  void cy.get(selector('chat-widget-input'), { timeout: 60000 })
    .should('be.visible')
    .and('not.be.disabled')
    .clear()
    .type(text);
  void cy.get(selector('chat-widget-send'))
    .should('not.be.disabled')
    .click({ force: true });
  void cy.contains(selector('ai-message-user'), text, { timeout: 60000 }).should('be.visible');
}

export function clickIfPresent(cssSelector: string) {
  cy.get('body').then(($body) => {
    const target = $body.find(`${cssSelector}:visible`).first();
    if (target.length) {
      void cy.wrap(target).click({ force: true });
    }
  });
}
