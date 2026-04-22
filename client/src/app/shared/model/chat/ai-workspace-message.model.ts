export interface AiWorkspaceMessage {
  id: string;
  sender: 'user' | 'bot' | 'error';
  text: string;
  time: Date;
  retryPayload?: string;
}
