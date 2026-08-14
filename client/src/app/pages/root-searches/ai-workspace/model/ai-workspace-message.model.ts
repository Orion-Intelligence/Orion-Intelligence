export interface AiWorkspaceTrigger {
  text?: string;
  url?: string;
  download?: boolean;
}

export interface AiWorkspaceMessage {
  id: string;
  sender: 'user' | 'bot' | 'error';
  text: string;
  time: Date;
  retryPayload?: string;
  triggers?: AiWorkspaceTrigger[];
}
