export const selector = (testId: string) => `[data-testid="${testId}"]`;

const firstByPrefix = (prefix: string) => `[data-testid^="${prefix}"]`;

export function openAiWorkspace() {
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

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
        .should('be.visible');
}

export function sendDummyAiMessage(message = 'Cypress dummy AI message') {
    cy.intercept('POST', '**/chats/*/messages', (req) => {
        const sessionId = req.url.match(/\/chats\/([^/]+)\/messages/)?.[1] || 'cypress-ai-chat';
        const now = new Date().toISOString();
        req.reply({
            statusCode: 200,
            body: {
                chat: {
                    session_id: sessionId,
                    title: 'New Chat',
                    updated_at: now,
                    message_count: 2,
                },
                user_message: {
                    id: 'cypress-user-message',
                    sender: 'user',
                    text: message,
                    created_at: now,
                },
                assistant_message: {
                    id: 'cypress-assistant-message',
                    sender: 'bot',
                    text: 'Cypress AI response',
                    created_at: now,
                },
            },
        });
    }).as('sendAiMessage');

    cy.get(selector('chat-widget-input'))
        .should('be.visible')
        .clear()
        .type(message);

    cy.get(selector('chat-widget-send'))
        .should('not.be.disabled')
        .click({ force: true });

    cy.contains(selector('ai-message-user'), message, { timeout: 60000 })
        .should('be.visible');

    cy.wait('@sendAiMessage', { timeout: 120000 }).then(({ response }) => {
        expect(response, 'send AI message response').to.exist;
        expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);
    });

    cy.get(selector('ai-message-bot'), { timeout: 120000 }).should('exist');
}

export function openFirstChatMenu() {
    cy.get(firstByPrefix('ai-chat-options-'), { timeout: 60000 })
        .first()
        .scrollIntoView()
        .should('exist')
        .click({ force: true });

    cy.get(firstByPrefix('ai-chat-menu-'), { timeout: 60000 })
        .first()
        .should('exist');
}

export function renameFirstChat(title: string) {
    cy.intercept('PUT', '**/chats/*').as('renameAiChat');

    openFirstChatMenu();

    cy.get(firstByPrefix('ai-chat-rename-'))
        .first()
        .click({ force: true });

    cy.get(selector('ai-chat-rename-input'), { timeout: 60000 })
        .should('be.visible')
        .clear()
        .type(title);

    cy.get(selector('ai-chat-rename-confirm'))
        .should('not.be.disabled')
        .click({ force: true });

    cy.wait('@renameAiChat', { timeout: 60000 }).then(({ response }) => {
        expect(response, 'rename chat response').to.exist;
        expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);

        const body = response?.body || {};
        expect(body.title, JSON.stringify(body)).to.equal(title);
    });
}

export function createNewAiChat() {
    cy.intercept('POST', '**/chats').as('createAiChat');

    cy.get(selector('ai-new-chat-button'), { timeout: 60000 })
        .filter(':visible')
        .first()
        .should('be.visible')
        .click({ force: true });

    cy.wait('@createAiChat', { timeout: 60000 }).then(({ response }) => {
        expect(response, 'create chat response').to.exist;
        expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 201]);
    });

    cy.get(selector('chat-widget-input'), { timeout: 60000 })
        .should('be.visible');
}

export function deleteFirstChat() {
    cy.intercept('DELETE', '**/chats/*').as('deleteAiChat');

    openFirstChatMenu();

    cy.get(firstByPrefix('ai-chat-delete-'))
        .first()
        .click({ force: true });

    cy.get(selector('confirmation-yes-button'), { timeout: 60000 })
        .should('be.visible')
        .click({ force: true });

    cy.wait('@deleteAiChat', { timeout: 60000 }).then(({ response }) => {
        expect(response, 'delete chat response').to.exist;
        expect(response?.statusCode, JSON.stringify(response?.body || {})).to.be.oneOf([200, 204]);
    });
}
