export interface ChatApiResponse {
  result?: string;
  reply?: string;
  message?: string;
  text?: string;
  [k: string]: unknown;
}
