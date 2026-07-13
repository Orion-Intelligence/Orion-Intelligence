import { AiWorkspaceMessage } from "../chat/ai-workspace-message.model";

export interface AiChatSession {
    id: string;
    title: string;
    updatedAt: string;
    messages: AiWorkspaceMessage[];
    isPinned: boolean;
    pinnedAt: string | null;
    messageCount?: number;
}

export interface NexusChatSession {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    message_count: number;
    is_pinned: boolean;
    pinned_at: string | null;
}

export interface NexusChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    created_at: string;
}

export interface NexusChatDetail extends NexusChatSession {
    messages: NexusChatMessage[];
}

export interface NexusSendMessageResponse {
    chat: NexusChatSession;
    user_message: NexusChatMessage;
    assistant_message: NexusChatMessage;
}
