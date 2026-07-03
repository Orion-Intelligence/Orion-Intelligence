import { AiWorkspaceMessage } from "../chat/ai-workspace-message.model";

export interface AiChatSession {
    id: string;
    title: string;
    updatedAt: string;
    messages: AiWorkspaceMessage[];
}