export interface NexusChatPayload {
  message: string;
  report?: string;
  tool?: string;
  type?: string;
  history?: Array<{ role: string; content: string }>;
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
