import { AiWorkspaceMessage } from "../chat/ai-workspace-message.model";

export interface AiChatSession {
    sessionId: string;
    title: string;
    updatedAt: string;
    messageCount: number;
    messages: AiWorkspaceMessage[];
    isPinned: boolean;
    pinnedAt: string | null;
}

export interface NexusChatSession {
    session_id: string;
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
