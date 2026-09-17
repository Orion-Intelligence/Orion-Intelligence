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

export const AI_PLAIN_STREAM_BODY = `${JSON.stringify({ output: { response: AI_CHAT_RESPONSE }, done: true, error: false })}\n`;
export const AI_ERROR_MESSAGE = 'Nexus failed for cypress';
export const AI_ERROR_STREAM_BODY = `${JSON.stringify({ error: true, response: AI_ERROR_MESSAGE, done: true })}\n`;
export const AI_RETRY_PROMPT = 'Cypress retry after failure prompt';
export const AI_TRIGGER_PROMPT = 'Cypress trigger download prompt';
export const AI_TRIGGER_TEXT = 'Download report';
export const AI_TRIGGER_RESPONSE = 'Your Nexus download is ready';
export const AI_TRIGGER_DOWNLOAD_URL = '/api/nexus/downloads/cypress-report.txt';
export const AI_TRIGGER_DOWNLOAD_BODY = 'cypress nexus download payload';
export const AI_TRIGGER_STREAM_BODY = `${JSON.stringify({ output: { response: AI_TRIGGER_RESPONSE, triggers: [{ url: AI_TRIGGER_DOWNLOAD_URL, text: AI_TRIGGER_TEXT }] }, done: true, error: false })}\n`;

export const AI_DIRECTORY_STUB_REPO_URL = 'https://github.com/octocat/directory-stub';
export const AI_DIRECTORY_APPROVED_MESSAGE = 'Repository imported and scanned successfully.';
export const AI_DIRECTORY_INFECTED_MESSAGE = 'Repository blocked because a threat was detected.';
export const AI_DIRECTORY_FAILED_MESSAGE = 'Repository import failed while cloning.';
export const AI_DIRECTORY_PROCESSING_MESSAGE = 'Repository is being processed.';
export const AI_DIRECTORY_READY_MESSAGE = 'Repository is ready.';
export const AI_DIRECTORY_FILE_CHUNK_LINES = 60;
export const AI_DIRECTORY_ROOT_FILE = 'README.md';
export const AI_DIRECTORY_CHILD_DIR = 'src';
export const AI_DIRECTORY_CHILD_FILE = 'index.ts';

function ndjsonReply(body: string) {
  return {
    statusCode: 200,
    headers: { 'content-type': 'application/x-ndjson' },
    body,
  };
}

export function stubNexusStream(alias: string, body: string) {
  void cy.intercept('POST', '**/api/nexus/chat', (req) => {
    req.reply(ndjsonReply(body));
  }).as(alias);
}

function directoryTreeForPath(path: string) {
  if (path === AI_DIRECTORY_CHILD_DIR) {
    return {
      name: AI_DIRECTORY_CHILD_DIR,
      path: AI_DIRECTORY_CHILD_DIR,
      type: 'directory',
      children: [
        { name: AI_DIRECTORY_CHILD_FILE, path: `${AI_DIRECTORY_CHILD_DIR}/${AI_DIRECTORY_CHILD_FILE}`, type: 'file', size: 2048 },
      ],
    };
  }
  return {
    name: 'directory-stub',
    path: '',
    type: 'directory',
    children: [
      { name: AI_DIRECTORY_CHILD_DIR, path: AI_DIRECTORY_CHILD_DIR, type: 'directory' },
      { name: AI_DIRECTORY_ROOT_FILE, path: AI_DIRECTORY_ROOT_FILE, type: 'file', size: 1024 },
    ],
  };
}

function directoryFileChunk(startLine: number, filePath: string) {
  const hasMore = startLine <= 1;
  const lines = Array.from({ length: AI_DIRECTORY_FILE_CHUNK_LINES }, (_value, index) => `line ${startLine + index} repository content`);
  return {
    status: 'approved',
    message: 'ok',
    path: filePath,
    content: `${lines.join('\n')}\n`,
    start_line: startLine,
    end_line: startLine + AI_DIRECTORY_FILE_CHUNK_LINES - 1,
    line_count: AI_DIRECTORY_FILE_CHUNK_LINES,
    next_start_line: hasMore ? startLine + AI_DIRECTORY_FILE_CHUNK_LINES : null,
    has_more: hasMore,
  };
}

export function stubDirectoryTreeAndFile() {
  void cy.intercept('GET', '**/workspace/tree*', (req) => {
    const path = new URL(req.url).searchParams.get('path') ?? '';
    req.reply({ statusCode: 200, body: { status: 'ok', tree: directoryTreeForPath(path) } });
  }).as('aiDirTree');
  void cy.intercept('GET', '**/workspace/file*', (req) => {
    const params = new URL(req.url).searchParams;
    const startLine = Number(params.get('start_line') ?? '1');
    const filePath = params.get('path') ?? AI_DIRECTORY_ROOT_FILE;
    req.reply({ statusCode: 200, body: directoryFileChunk(startLine, filePath) });
  }).as('aiDirFile');
}

export function stubDirectoryStatus(status: string, message: string, extra: Record<string, unknown> = {}) {
  void cy.intercept('GET', '**/workspace/status', {
    statusCode: 200,
    body: { status, message, ...extra },
  }).as('aiDirStatus');
}

export function stubDirectoryStatusSequence(firstStatus: string, firstMessage: string, secondStatus: string, secondMessage: string, secondExtra: Record<string, unknown> = {}) {
  let calls = 0;
  void cy.intercept('GET', '**/workspace/status', (req) => {
    calls += 1;
    const body = calls >= 2
      ? { status: secondStatus, message: secondMessage, ...secondExtra }
      : { status: firstStatus, message: firstMessage };
    req.reply({ statusCode: 200, body });
  }).as('aiDirStatus');
}

export function stubDirectoryImport(status: string, message: string, extra: Record<string, unknown> = {}) {
  void cy.intercept('POST', '**/workspace/github/import', {
    statusCode: 200,
    body: { status, message, ...extra },
  }).as('aiDirImport');
}

export function submitStubbedDirectoryImport(repoUrl = AI_DIRECTORY_STUB_REPO_URL) {
  clickIfPresent(selector('ai-import-directory-button'));
  void cy.get(selector('ai-directory-repo-url'), { timeout: 60000 })
    .should('be.visible')
    .clear()
    .type(repoUrl);
  void cy.get(selector('ai-directory-import-submit'))
    .should('not.be.disabled')
    .click({ force: true });
}
