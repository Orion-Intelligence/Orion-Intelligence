import {
  AI_CHAT_MESSAGE,
  AI_CHAT_RENAMED_TITLE,
  AI_CHAT_RESPONSE,
  AI_CHAT_VIEW_CASES,
  AI_DEEP_PROMPT,
  AI_DIRECTORY_APPROVED_MESSAGE,
  AI_DIRECTORY_CHILD_DIR,
  AI_DIRECTORY_CHILD_FILE,
  AI_DIRECTORY_FAILED_MESSAGE,
  AI_DIRECTORY_INFECTED_MESSAGE,
  AI_DIRECTORY_PROCESSING_MESSAGE,
  AI_DIRECTORY_READY_MESSAGE,
  AI_DIRECTORY_ROOT_FILE,
  AI_EDITED_PROMPT,
  AI_ERROR_MESSAGE,
  AI_ERROR_STREAM_BODY,
  AI_HISTORY_PROMPT,
  AI_MARKDOWN_STREAM_BODY,
  AI_OVERFLOW_TEXT,
  AI_PLAIN_STREAM_BODY,
  AI_REPO_URL,
  AI_RETRY_PROMPT,
  AI_STOP_PROMPT,
  AI_TRIGGER_DOWNLOAD_BODY,
  AI_TRIGGER_DOWNLOAD_URL,
  AI_TRIGGER_PROMPT,
  AI_TRIGGER_RESPONSE,
  AI_TRIGGER_STREAM_BODY,
  AI_TRIGGER_TEXT,
  clickIfPresent,
  ensureActiveChat,
  firstByPrefix,
  openAiWorkspace,
  selector,
  sendAiPrompt,
  stubDirectoryImport,
  stubDirectoryStatus,
  stubDirectoryStatusSequence,
  stubDirectoryTreeAndFile,
  stubNexusStream,
  submitStubbedDirectoryImport,
} from './controllers/21-ai-chat.controller';

describe('AI Chat - Basic Flow', () => {
  beforeEach(() => {
    cy.loginAsAdmin();
  });

  after(() => {
    cy.logout();
  });

  it('opens AI chat and performs chat actions', () => {
    cy.intercept('GET', '**/chats').as('listAiChats');

    cy.visit('/dashboard/profile/homepage');

    cy.get(selector('homepage-search-input'), { timeout: 60000 })
      .should('be.visible');

    cy.get(selector('ioc-basic-tag-AI'), { timeout: 60000 })
      .filter(':visible')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .invoke('removeAttr', 'target')
      .click({ force: true });

    cy.get(selector('ai-workspace-root'), { timeout: 60000 })
      .should('be.visible');

    cy.wait('@listAiChats', { timeout: 60000 }).its('response.statusCode').should('eq', 200);

    AI_CHAT_VIEW_CASES.forEach(({ buttonTestId, visibleTestIds }) => {
      cy.get(selector(buttonTestId))
        .should('be.visible')
        .click({ force: true })
        .should('have.attr', 'aria-pressed', 'true');

      visibleTestIds.forEach((testId) => {
        cy.get(selector(testId), { timeout: 60000 }).should('be.visible');
      });
    });

    cy.intercept('POST', '**/chats').as('ensureAiChat');

    cy.get(selector('ai-new-chat-button'), { timeout: 60000 })
      .filter(':visible')
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@ensureAiChat', { timeout: 60000 }).then(({ response }) => {
      expect(response, 'initial chat response').to.not.equal(undefined);
      expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);
    });

    cy.intercept('POST', '**/api/nexus/chat').as('sendAiMessage');

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type(AI_CHAT_MESSAGE);

    cy.get(selector('chat-widget-send'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.contains(selector('ai-message-user'), AI_CHAT_MESSAGE, { timeout: 60000 })
      .should('be.visible');

    cy.wait('@sendAiMessage', { timeout: 120000 }).then(({ response }) => {
      expect(response, 'send AI message response').to.not.equal(undefined);
      expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);
    });

    cy.contains(selector('ai-message-bot'), AI_CHAT_RESPONSE, { timeout: 120000 })
      .should('be.visible');

    cy.intercept('PUT', '**/chats/*').as('renameAiChat');

    cy.get(firstByPrefix('ai-chat-options-'), { timeout: 60000 })
      .first()
      .scrollIntoView()
      .should('exist')
      .click({ force: true });

    cy.get(firstByPrefix('ai-chat-menu-'), { timeout: 60000 })
      .first()
      .should('exist');

    cy.get(firstByPrefix('ai-chat-rename-'))
      .first()
      .click({ force: true });

    cy.get(selector('ai-chat-rename-modal'), { timeout: 60000 })
      .should('be.visible');

    cy.get(selector('ai-chat-rename-input'))
      .should('be.visible')
      .clear()
      .type(AI_CHAT_RENAMED_TITLE);

    cy.get(selector('ai-chat-rename-confirm'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait('@renameAiChat', { timeout: 60000 }).then(({ response }) => {
      expect(response, 'rename chat response').to.not.equal(undefined);
      expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);

      const body = response?.body || {};
      expect(body.title, JSON.stringify(body)).to.equal(AI_CHAT_RENAMED_TITLE);
    });

    cy.contains(firstByPrefix('ai-chat-session-'), AI_CHAT_RENAMED_TITLE, { timeout: 60000 })
      .should('be.visible');

    cy.get(selector('ai-chat-search-toggle'))
      .should('be.visible')
      .click({ force: true });

    cy.get(selector('ai-chat-search-input'))
      .should('be.visible')
      .type(AI_CHAT_RENAMED_TITLE);

    cy.contains(firstByPrefix('ai-chat-session-'), AI_CHAT_RENAMED_TITLE)
      .should('be.visible');

    cy.get(selector('ai-chat-sidebar-collapse'))
      .should('be.visible')
      .and('have.attr', 'aria-label', 'Collapse sidebar')
      .click();

    cy.get('app-ai-chat-sidebar [data-sidebar-expanded]').should('not.exist');
    cy.get('app-ai-chat-sidebar [data-sidebar-collapsed]').should('be.visible');
    cy.get(selector('ai-chat-sidebar-expand'))
      .should('be.visible')
      .and('have.attr', 'aria-label', 'Expand sidebar');

    cy.get(`${firstByPrefix('ai-chat-session-')}[data-selected="true"]`)
      .should('be.visible');

    cy.get(selector('ai-chat-sidebar-expand')).click();

    cy.get('app-ai-chat-sidebar [data-sidebar-expanded]').should('be.visible');
    cy.get('app-ai-chat-sidebar [data-sidebar-collapsed]').should('not.exist');
    cy.get(selector('ai-chat-search-toggle'))
      .should('be.visible');

    cy.get(selector('ai-chat-search-input'))
      .should('not.exist');

    cy.get(selector('ai-chat-search-toggle')).click();

    cy.get(selector('ai-chat-search-input'))
      .should('be.visible')
      .type(AI_CHAT_RENAMED_TITLE);

    cy.get(selector('ai-chat-search-clear'))
      .should('be.visible')
      .click({ force: true });

    cy.get(selector('ai-chat-search-input')).type('{esc}');

    cy.intercept('POST', '**/chats').as('createAiChat');

    cy.get(selector('ai-new-chat-button'), { timeout: 60000 })
      .filter(':visible')
      .first()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@createAiChat', { timeout: 60000 }).then(({ response }) => {
      expect(response, 'create chat response').to.not.equal(undefined);
      expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);

      const sessionId = response?.body?.session_id;
      expect(sessionId, JSON.stringify(response?.body || {})).to.be.a('string').and.to.have.lengthOf.greaterThan(0);
      cy.get(selector(`ai-chat-session-${sessionId}`), { timeout: 60000 })
        .should('have.attr', 'data-selected', 'true');
    });

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
      .should('be.visible');

    cy.intercept('DELETE', '**/chats/*').as('deleteAiChat');

    cy.get(firstByPrefix('ai-chat-options-'), { timeout: 60000 })
      .first()
      .scrollIntoView()
      .should('exist')
      .click({ force: true });

    cy.get(firstByPrefix('ai-chat-menu-'), { timeout: 60000 })
      .first()
      .should('exist');

    cy.get(firstByPrefix('ai-chat-delete-'))
      .first()
      .click({ force: true });

    cy.get(selector('confirmation-yes-button'), { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });

    cy.wait('@deleteAiChat', { timeout: 60000 }).then(({ response }) => {
      expect(response, 'delete chat response').to.not.equal(undefined);
      expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 204]);
    });
  });

  it('exercises quick prompts, composer history, copy and edit', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    cy.get(selector('chat-widget-messages'), { timeout: 60000 })
      .find('button:visible')
      .then(($prompts) => {
        if ($prompts.length) {
          cy.wrap($prompts.first()).click({ force: true });
          cy.get(selector('chat-widget-input')).invoke('val').should('have.length.greaterThan', 0);
        }
      });

    cy.get(selector('chat-widget-input')).clear();

    sendAiPrompt(AI_HISTORY_PROMPT);
    cy.wait('@aiDeepSend', { timeout: 120000 }).then(({ response }) => {
      expect(response, 'history prompt response').to.not.equal(undefined);
      expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);
    });
    cy.get(selector('ai-message-bot'), { timeout: 120000 }).should('be.visible');

    cy.get(selector('chat-widget-input'))
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .focus()
      .type('{upArrow}')
      .should('have.value', AI_HISTORY_PROMPT);

    cy.get(selector('chat-widget-input'))
      .type('{downArrow}')
      .should('have.value', '');

    cy.get(selector('ai-message-user')).last().within(() => {
      cy.get('button').first().click({ force: true });
    });

    cy.get(selector('ai-message-user')).last().within(() => {
      cy.get('button').last().click({ force: true });
    });

    cy.get('textarea[id^="ai-message-edit-"]', { timeout: 60000 })
      .should('be.visible')
      .type('{esc}');

    cy.get('textarea[id^="ai-message-edit-"]').should('not.exist');

    cy.intercept('POST', '**/api/nexus/chat').as('aiEditResend');

    cy.get(selector('ai-message-user')).last().within(() => {
      cy.get('button').last().click({ force: true });
    });

    cy.get('textarea[id^="ai-message-edit-"]', { timeout: 60000 })
      .should('be.visible')
      .clear()
      .type(AI_EDITED_PROMPT)
      .type('{ctrl}{enter}');

    cy.contains(selector('ai-message-user'), AI_EDITED_PROMPT, { timeout: 60000 }).should('be.visible');
    cy.wait('@aiEditResend', { timeout: 120000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
  });

  it('exercises bot message actions, share dialog and token overflow guard', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    sendAiPrompt(AI_DEEP_PROMPT);
    cy.wait('@aiDeepSend', { timeout: 120000 }).its('response.statusCode').should('be.oneOf', [200, 201]);
    cy.contains(selector('ai-message-bot'), AI_CHAT_RESPONSE, { timeout: 120000 }).should('be.visible');

    cy.get('app-bot-message-actions', { timeout: 60000 })
      .first()
      .within(() => {
        cy.get('button').first().click({ force: true });
      });

    cy.get('app-bot-message-actions')
      .first()
      .within(() => {
        cy.get('button').last().click({ force: true });
      });

    cy.get('#share-response-dialog-title', { timeout: 60000 }).should('be.visible');
    cy.get('[role="dialog"]').should('be.visible');

    clickIfPresent('.ui-popup-close');

    cy.get(selector('chat-widget-input'))
      .should('be.visible')
      .clear()
      .invoke('val', AI_OVERFLOW_TEXT)
      .trigger('input');

    cy.get('[role="alert"]', { timeout: 60000 }).should('be.visible');
    cy.get(selector('chat-widget-send')).should('be.disabled');

    cy.get(selector('chat-widget-input')).clear();
  });

  it('exercises directory import, tabs and log search', () => {
    openAiWorkspace('split');
    ensureActiveChat();

    clickIfPresent(selector('ai-import-directory-button'));

    cy.get(selector('ai-directory-repo-url'), { timeout: 60000 })
      .should('be.visible')
      .clear()
      .type(AI_REPO_URL);

    cy.get(selector('ai-directory-import-submit'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.get(selector('ai-directory-tab-logs'), { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });

    cy.get('#ai-directory-logs-panel', { timeout: 60000 }).should('be.visible');

    cy.get(selector('ai-directory-log-search'), { timeout: 60000 })
      .should('be.visible')
      .clear()
      .type('repository');

    clickIfPresent('#ai-directory-logs-panel button[aria-label="Clear log search"]');

    cy.get(selector('ai-directory-tab-files'))
      .should('be.visible')
      .click({ force: true });

    cy.get(selector('ai-directory-tab-files')).should('have.attr', 'aria-selected', 'true');
  });

  it('exercises split-view divider keyboard and pointer resize', () => {
    openAiWorkspace('split');

    const divider = () => cy.get('[role="separator"][aria-orientation="vertical"]', { timeout: 60000 });

    divider().should('be.visible').focus();

    divider().trigger('keydown', { key: 'Home' });
    divider().invoke('attr', 'aria-valuenow').then((minValue) => {
      divider().trigger('keydown', { key: 'End' });
      divider().invoke('attr', 'aria-valuenow').then((maxValue) => {
        expect(Number(maxValue)).to.be.gte(Number(minValue));
      });
    });

    divider().trigger('keydown', { key: 'ArrowLeft' });
    divider().trigger('keydown', { key: 'ArrowRight' });

    divider()
      .trigger('pointerdown', { pointerId: 1, clientX: 640, clientY: 320, force: true })
      .trigger('pointermove', { pointerId: 1, clientX: 520, clientY: 320, force: true })
      .trigger('pointerup', { pointerId: 1, force: true });

    divider().should('have.attr', 'aria-valuenow');
  });

  it('exercises stop generation and clear all chats', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    cy.intercept('POST', '**/api/nexus/chat').as('aiStopSend');
    cy.get(selector('chat-widget-input'), { timeout: 60000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type(AI_STOP_PROMPT);
    cy.get(selector('chat-widget-send'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.get('body').then(($body) => {
      const stop = $body.find(`${selector('chat-widget-send')}[aria-label="Stop generation"]`);
      if (stop.length) {
        cy.wrap(stop.first()).click({ force: true });
      }
    });

    cy.intercept('DELETE', '**/chats*').as('aiClearAll');

    cy.get('body').then(($body) => {
      const clearButton = $body.find(`${selector('ai-clear-all-chats-button')}:visible`).first();
      if (clearButton.length && !clearButton.prop('disabled')) {
        cy.wrap(clearButton).click({ force: true });
        cy.get(selector('confirmation-yes-button'), { timeout: 60000 })
          .should('be.visible')
          .click({ force: true });
      }
    });

    cy.get(selector('chat-widget-input'), { timeout: 60000 }).should('be.visible');
  });

  it('renders rich markdown in the assistant response through the markdown pipe', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    cy.intercept('POST', '**/api/nexus/chat', (req) => {
      req.reply({
        statusCode: 200,
        headers: { 'content-type': 'application/x-ndjson' },
        body: AI_MARKDOWN_STREAM_BODY,
      });
    }).as('aiMarkdownSend');

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type('Return a rich markdown intelligence brief');

    cy.get(selector('chat-widget-send'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait('@aiMarkdownSend', { timeout: 120000 });

    cy.get(selector('ai-message-bot'), { timeout: 120000 })
      .last()
      .within(() => {
        cy.get('h1').should('exist');
        cy.get('h2').should('exist');
        cy.get('strong').should('have.length.at.least', 1);
        cy.get('em').should('have.length.at.least', 1);
        cy.get('del').should('exist');
        cy.get('code').should('have.length.at.least', 1);
        cy.get('pre code').should('exist');
        cy.get('ul li').should('have.length.at.least', 1);
        cy.get('ol li').should('have.length.at.least', 1);
        cy.get('blockquote').should('exist');
        cy.get('hr').should('exist');
        cy.get('a[href="https://example.com"]').should('exist');
        cy.get('table').should('exist');
        cy.get('th').should('have.length.at.least', 1);
        cy.get('td').should('have.length.at.least', 1);
      });
  });

  it('surfaces a Nexus error message and resends it through retry', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    stubNexusStream('aiRetryError', AI_ERROR_STREAM_BODY);

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type(AI_RETRY_PROMPT);
    cy.get(selector('chat-widget-send'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait('@aiRetryError', { timeout: 120000 });
    cy.contains(selector('ai-message-error'), AI_ERROR_MESSAGE, { timeout: 120000 }).should('be.visible');

    stubNexusStream('aiRetrySuccess', AI_PLAIN_STREAM_BODY);

    cy.get(selector('ai-message-error'), { timeout: 60000 })
      .last()
      .within(() => {
        cy.contains('button', 'Retry').click({ force: true });
      });

    cy.wait('@aiRetrySuccess', { timeout: 120000 });
    cy.contains(selector('ai-message-bot'), AI_CHAT_RESPONSE, { timeout: 120000 }).should('be.visible');
  });

  it('renders a download trigger on a bot message and fetches it', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    stubNexusStream('aiTriggerSend', AI_TRIGGER_STREAM_BODY);
    cy.intercept('GET', '**/nexus/downloads/cypress-report.txt', {
      statusCode: 200,
      headers: { 'content-type': 'text/plain', 'content-disposition': 'attachment; filename="cypress-report.txt"' },
      body: AI_TRIGGER_DOWNLOAD_BODY,
    }).as('aiTriggerDownload');

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
      .should('be.visible')
      .and('not.be.disabled')
      .clear()
      .type(AI_TRIGGER_PROMPT);
    cy.get(selector('chat-widget-send'))
      .should('not.be.disabled')
      .click({ force: true });

    cy.wait('@aiTriggerSend', { timeout: 120000 });
    cy.contains(selector('ai-message-bot'), AI_TRIGGER_RESPONSE, { timeout: 120000 }).should('be.visible');

    cy.contains(`${selector('ai-message-bot')} button`, AI_TRIGGER_TEXT, { timeout: 60000 })
      .last()
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    cy.wait('@aiTriggerDownload', { timeout: 60000 }).then(({ request }) => {
      expect(request.url).to.include(AI_TRIGGER_DOWNLOAD_URL);
    });
  });

  it('imports a repository, browses the tree, previews a file and searches logs', () => {
    stubDirectoryStatus('idle', '');
    stubDirectoryImport('approved', AI_DIRECTORY_APPROVED_MESSAGE, { scan_output: 'scan clean' });
    stubDirectoryTreeAndFile();

    openAiWorkspace('split');
    ensureActiveChat();

    submitStubbedDirectoryImport();
    cy.wait('@aiDirImport', { timeout: 60000 }).its('response.statusCode').should('eq', 200);
    cy.wait('@aiDirTree', { timeout: 60000 });

    cy.contains('#ai-directory-files-panel button', AI_DIRECTORY_ROOT_FILE, { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });
    cy.wait('@aiDirFile', { timeout: 60000 });
    cy.get('#ai-directory-files-panel pre', { timeout: 60000 }).should('be.visible');

    cy.get('#ai-directory-files-panel pre')
      .parent()
      .scrollTo('bottom', { ensureScrollable: false });
    cy.wait('@aiDirFile', { timeout: 60000 });

    cy.contains('#ai-directory-files-panel button', AI_DIRECTORY_CHILD_DIR, { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });
    cy.wait('@aiDirTree', { timeout: 60000 });
    cy.contains('#ai-directory-files-panel button', AI_DIRECTORY_CHILD_FILE, { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });
    cy.wait('@aiDirFile', { timeout: 60000 });

    cy.get(selector('ai-directory-tab-logs'), { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });
    cy.get('#ai-directory-logs-panel', { timeout: 60000 }).should('be.visible');
    cy.get(selector('ai-directory-log-search'), { timeout: 60000 })
      .should('be.visible')
      .clear()
      .type('repository');
    cy.get('#ai-directory-logs-panel').should('contain.text', 'imported');
    clickIfPresent('#ai-directory-logs-panel button[aria-label="Clear log search"]');
  });

  it('reflects a processing repository that finishes through status polling', () => {
    stubDirectoryStatusSequence('processing', AI_DIRECTORY_PROCESSING_MESSAGE, 'approved', AI_DIRECTORY_READY_MESSAGE, { scan_output: 'poll clean' });
    stubDirectoryTreeAndFile();

    openAiWorkspace('split');
    ensureActiveChat();

    cy.wait('@aiDirStatus', { timeout: 60000 });
    cy.wait('@aiDirTree', { timeout: 60000 });
    cy.contains('#ai-directory-files-panel button', AI_DIRECTORY_ROOT_FILE, { timeout: 60000 }).should('be.visible');
  });

  it('shows a blocked status when the repository import is infected', () => {
    stubDirectoryStatus('infected', AI_DIRECTORY_INFECTED_MESSAGE, { scan_output: 'malware detected' });
    stubDirectoryImport('infected', AI_DIRECTORY_INFECTED_MESSAGE, { scan_output: 'malware detected' });

    openAiWorkspace('split');
    ensureActiveChat();

    submitStubbedDirectoryImport();
    cy.wait('@aiDirImport', { timeout: 60000 });

    cy.get(selector('ai-directory-tab-logs'), { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });
    cy.get('#ai-directory-logs-panel', { timeout: 60000 }).should('contain.text', 'BLOCKED');
  });

  it('shows a failed status when the repository import fails', () => {
    stubDirectoryStatus('failed', AI_DIRECTORY_FAILED_MESSAGE, { error: 'clone error' });
    stubDirectoryImport('failed', AI_DIRECTORY_FAILED_MESSAGE, { error: 'clone error' });

    openAiWorkspace('split');
    ensureActiveChat();

    submitStubbedDirectoryImport();
    cy.wait('@aiDirImport', { timeout: 60000 });

    cy.get(selector('ai-directory-tab-logs'), { timeout: 60000 })
      .should('be.visible')
      .click({ force: true });
    cy.get('#ai-directory-logs-panel', { timeout: 60000 }).should('contain.text', 'FAILED');
  });

  it('clears all chats and starts a fresh session', () => {
    openAiWorkspace('chat');
    ensureActiveChat();

    cy.intercept('DELETE', '**/chats', { statusCode: 200, body: { success: true } }).as('aiClearAllChats');
    cy.intercept('POST', '**/chats', {
      statusCode: 201,
      body: {
        session_id: 'cypress-clear-all-session',
        title: 'New Chat',
        updated_at: new Date().toISOString(),
        message_count: 0,
      },
    }).as('aiClearAllCreate');

    cy.get('body').then(($body) => {
      const clearButton = $body.find(`${selector('ai-clear-all-chats-button')}:visible`).first();
      if (!clearButton.length || clearButton.prop('disabled')) {
        return;
      }
      cy.wrap(clearButton).click({ force: true });
      cy.get(selector('confirmation-yes-button'), { timeout: 60000 })
        .should('be.visible')
        .click({ force: true });
      cy.wait('@aiClearAllChats', { timeout: 60000 });
      cy.wait('@aiClearAllCreate', { timeout: 60000 });
      cy.get(`${firstByPrefix('ai-chat-session-')}[data-selected="true"]`, { timeout: 60000 }).should('exist');
    });

    cy.get(selector('chat-widget-input'), { timeout: 60000 }).should('be.visible');
  });
});
