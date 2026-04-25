import { Injectable } from '@angular/core';
import { EMPTY, timer } from 'rxjs';
import { expand, switchMap, takeWhile } from 'rxjs/operators';
import { ChatApiResponse } from '../../../shared/model/chat/chat-api-response.model';
import { ApiService } from '../../../shared/services/api.service';

export type NexusChatPayload = {
  message: string;
  report?: string;
};

export type NexusSummaryPayload = {
  data: string[];
};

@Injectable({ providedIn: 'root' })
export class NexusChatService {
  constructor(private readonly api: ApiService) {}

  pollNexusChat(payload: NexusChatPayload) {
    return this.api.post<ChatApiResponse>('nexus/chat', payload).pipe(expand(response => this.isNexusPending(response)
      ? timer(2000).pipe(switchMap(() => this.api.post<ChatApiResponse>('nexus/chat', payload)))
      : EMPTY), takeWhile(response => this.isNexusPending(response), true));
  }

  pollNexusReportChat(payload: NexusChatPayload) {
    return this.api.post<ChatApiResponse>('nlp/chat/report', payload).pipe(expand(response => this.isNexusPending(response)
      ? timer(2000).pipe(switchMap(() => this.api.post<ChatApiResponse>('nlp/chat/report', payload)))
      : EMPTY), takeWhile(response => this.isNexusPending(response), true));
  }

  pollNexusSummary(payload: NexusSummaryPayload) {
    return this.api.post<ChatApiResponse>('nlp/summarize/ai', payload).pipe(expand(response => this.isNexusPending(response)
      ? timer(2000).pipe(switchMap(() => this.api.post<ChatApiResponse>('nlp/summarize/ai', payload)))
      : EMPTY), takeWhile(response => this.isNexusPending(response), true));
  }

  getNexusChatReply(response: ChatApiResponse): string {
    const result = this.asRecord(response?.result);
    const reply = result
      ? result['response'] ?? result['result'] ?? result['text'] ?? response?.reply ?? response?.message ?? response?.text
      : response?.result ?? response?.reply ?? response?.message ?? response?.text;
    return (reply ?? '').toString().trim();
  }

  getNexusSummary(response: ChatApiResponse): string {
    const result = this.asRecord(response?.result);
    const summary = result
      ? result['response'] ?? result['summary'] ?? result['result'] ?? result['text'] ?? response?.['summary'] ?? response?.message ?? response?.text
      : response?.result ?? response?.['summary'] ?? response?.message ?? response?.text;
    return Array.isArray(summary) ? summary.join('\n').trim() : (summary ?? '').toString().trim();
  }

  isNexusPending(response: ChatApiResponse): boolean {
    const status = this.getNexusStatus(response);
    return ['pending', 'processing', 'running', 'busy', 'queued', 'in_progress'].includes(status);
  }

  getNexusStep(response: ChatApiResponse): string {
    const result = this.asRecord(response?.result);
    const step = result?.['step'] ?? response?.['step'] ?? result?.['progress'] ?? response?.['progress'] ?? result?.['status'] ?? response?.['status'];
    return (step ?? '').toString().trim();
  }

  private getNexusStatus(response: ChatApiResponse): string {
    const result = this.asRecord(response?.result);
    return ((result?.['status'] ?? response?.['status'] ?? '') as string).toString().trim().toLowerCase();
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : null;
  }
}
