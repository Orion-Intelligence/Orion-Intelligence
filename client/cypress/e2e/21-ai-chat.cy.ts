import { createNewAiChat, deleteFirstChat, openAiWorkspace, pinFirstChat, renameFirstChat, sendDummyAiMessage, unpinFirstChat } from "./controllers/21-ai-chat.controller";


describe('AI Chat - Basic Flow', () => {
    beforeEach(() => {
        cy.loginAsAdmin();
    });

    after(() => {
        cy.logout();
    });

    it('opens AI chat and performs chat actions', () => {
        openAiWorkspace();

        sendDummyAiMessage('Cypress dummy AI message');

        renameFirstChat('Cypress AI Renamed Chat');

        pinFirstChat();

        unpinFirstChat();

        createNewAiChat();

        deleteFirstChat();
    });
});