export interface NexusChatPayload {
  message: string;
  report?: string;
}

export interface NexusSummaryPayload {
  data: string[];
}

export interface NexusChatStreamChunk {
  delta?: string;
  response?: string;
}
