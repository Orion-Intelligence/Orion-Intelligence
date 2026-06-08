export interface NexusChatPayload {
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
}
