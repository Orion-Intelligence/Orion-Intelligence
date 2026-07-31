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

export type NexusWorkspaceStatus =
    | 'idle'
    | 'processing'
    | 'approved'
    | 'infected'
    | 'failed'
    | 'not_found'
    | 'timeout'
    | 'error';

export interface NexusWorkspaceImportResponse {
    job_id?: string;
    status: NexusWorkspaceStatus;
    message: string;
    repo_url?: string;
    started_at?: string;
    updated_at?: string;
    scan_output?: string;
    exit_code?: number;
    error?: string;
    result?: NexusWorkspaceImportResponse;
}

export interface NexusWorkspaceFileNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    size?: number;
    children?: NexusWorkspaceFileNode[];
    children_loaded?: boolean;
    expanded?: boolean;
    loading?: boolean;
}

export interface NexusWorkspaceTreeResponse {
    status: string;
    message?: string;
    tree: NexusWorkspaceFileNode | null;
}

export interface NexusWorkspaceFileReadResponse {
    status: 'approved' | 'failed' | 'not_found';
    message: string;
    path: string;
    content: string;
    start_line: number;
    end_line: number;
    line_count: number;
    next_start_line?: number | null;
    has_more: boolean;
    file_size?: number;
}
