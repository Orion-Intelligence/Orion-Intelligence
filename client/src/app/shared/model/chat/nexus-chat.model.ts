import { AiWorkspaceTrigger } from './ai-workspace-message.model';

export interface NexusChatPayload {
  session_id?: string;
  session_type?: 'persistent' | 'temporary';
  message: string;
  report?: string;
  tool?: string;
  type?: string;
}

export interface NexusSummaryPayload {
  data: string[];
}

export interface NexusChatStreamChunk {
  delta?: string;
  response?: string;
  status?: string;
  error?: boolean;
  triggers?: AiWorkspaceTrigger[];
}
