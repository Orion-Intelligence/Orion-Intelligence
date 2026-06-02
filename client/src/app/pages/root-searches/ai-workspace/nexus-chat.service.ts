import { Injectable } from '@angular/core';
import { EMPTY, Observable, ReplaySubject, timer } from 'rxjs';
import { expand, switchMap, takeWhile } from 'rxjs/operators';
import { ChatApiResponse } from '../../../shared/model/chat/chat-api-response.model';
import { NexusChatPayload, NexusChatStreamChunk, NexusSummaryPayload } from '../../../shared/model/chat/nexus-chat.model';
import { ApiService } from '../../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class NexusChatService {
  private readonly streamTimeoutMs = 900000;
  private readonly recoverableStreamTtlMs = 600000;
  private activeStream?: { type: 'chat' | 'resume'; subject: ReplaySubject<NexusChatStreamChunk>; controller: AbortController; completed: boolean; emitted: boolean; completedAt: number | null; timeoutId: number; };

  constructor(private readonly api: ApiService) {}

  streamNexusChat(payload: NexusChatPayload, options: { recoverable?: boolean } = {}): Observable<NexusChatStreamChunk> {
    if (!options.recoverable) {
      return this.streamDirectNexusChat(payload);
    }
    if (this.activeStream && !this.activeStream.completed) {
      if (this.activeStream.type === 'chat') {
        return this.activeStream.subject.asObservable();
      }
      this.closeLocalStream(this.activeStream);
    }
    this.clearCompletedStream();
    return this.startNexusStream('/api/nexus/chat/workspace', payload, 'chat');
  }

  resumeNexusChat(): Observable<NexusChatStreamChunk> {
    if (this.hasRecoverableStream()) {
      return this.activeStream!.subject.asObservable();
    }
    this.clearCompletedStream();
    return this.startNexusStream('/api/nexus/chat/workspace', null, 'resume');
  }

  hasRecoverableStream(): boolean {
    if (!this.activeStream) {
      return false;
    }
    if (!this.activeStream.completed) {
      return true;
    }
    return this.activeStream.emitted
      && this.activeStream.completedAt !== null
      && Date.now() - this.activeStream.completedAt < this.recoverableStreamTtlMs;
  }

  cancelNexusChat(): void {
    const activeStream = this.activeStream;
    if (activeStream) {
      this.closeLocalStream(activeStream);
    }
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    void fetch('/api/nexus/chat/cancel', {
      method: 'POST',
      headers,
      body: '{}',
      credentials: 'include',
      keepalive: true,
    }).catch(() => undefined);
  }

  private streamDirectNexusChat(payload: NexusChatPayload): Observable<NexusChatStreamChunk> {
    return new Observable<NexusChatStreamChunk>((observer) => {
      const controller = new AbortController();
      let cancelled = false;
      let timedOut = false;
      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        this.cancelNexusChat();
        controller.abort();
      }, this.streamTimeoutMs);
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        Accept: 'application/x-ndjson',
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch('/api/nexus/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        credentials: 'include',
        signal: controller.signal,
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text() || response.statusText);
        }

        if (!response.body) {
          observer.complete();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });
          buffer = this.emitStreamLines(buffer, observer);
        }

        buffer += decoder.decode();
        this.emitStreamLines(`${buffer}\n`, observer);
        observer.complete();
      }).catch((error) => {
        if (timedOut) {
          observer.error(new Error('Nexus chat timed out.'));
          return;
        }
        if (cancelled || error?.name === 'AbortError') {
          observer.complete();
          return;
        }
        observer.error(error);
      }).finally(() => {
        window.clearTimeout(timeoutId);
      });

      return () => {
        cancelled = true;
        window.clearTimeout(timeoutId);
        controller.abort();
      };
    });
  }

  private startNexusStream(url: string, body: unknown, type: 'chat' | 'resume'): Observable<NexusChatStreamChunk> {
    const subject = new ReplaySubject<NexusChatStreamChunk>(1000);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
      if (this.activeStream?.subject === subject) {
        window.clearTimeout(this.activeStream.timeoutId);
        subject.error(new Error('Nexus chat timed out.'));
        this.activeStream = undefined;
      }
    }, this.streamTimeoutMs);
    const stream = {
      type,
      subject,
      controller,
      completed: false,
      emitted: false,
      completedAt: null,
      timeoutId,
    };
    this.activeStream = stream;
    this.consumeNexusStream(url, body, stream);
    return subject.asObservable();
  }

  private consumeNexusStream(url: string, body: unknown, stream: NonNullable<NexusChatService['activeStream']>): void {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      Accept: 'application/x-ndjson',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
      signal: stream.controller.signal,
    }).then(async (response) => {
      if (response.status === 204) {
        this.completeStream(stream, false);
        return;
      }
      if (!response.ok) {
        throw new Error(await response.text() || response.statusText);
      }
      if (!response.body) {
        this.completeStream(stream, false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const observer = {
        next: (chunk: NexusChatStreamChunk) => {
          stream.emitted = true;
          stream.subject.next(chunk);
        },
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        buffer = this.emitStreamLines(buffer, observer);
      }

      buffer += decoder.decode();
      this.emitStreamLines(`${buffer}\n`, observer);
      this.completeStream(stream, stream.emitted);
    }).catch((error) => {
      if (error?.name === 'AbortError') {
        this.completeStream(stream, stream.emitted);
        return;
      }
      stream.subject.error(error);
      if (this.activeStream === stream) {
        this.activeStream = undefined;
      }
    }).finally(() => {
      window.clearTimeout(stream.timeoutId);
    });
  }

  private closeLocalStream(stream: NonNullable<NexusChatService['activeStream']>): void {
    stream.controller.abort();
    window.clearTimeout(stream.timeoutId);
    stream.subject.complete();
    if (this.activeStream === stream) {
      this.activeStream = undefined;
    }
  }

  private completeStream(stream: NonNullable<NexusChatService['activeStream']>, keepForRecovery: boolean): void {
    if (stream.completed) {
      return;
    }
    stream.completed = true;
    stream.completedAt = Date.now();
    window.clearTimeout(stream.timeoutId);
    stream.subject.complete();
    if (this.activeStream === stream && !keepForRecovery) {
      this.activeStream = undefined;
    }
  }

  private clearCompletedStream(): void {
    if (!this.activeStream?.completed) {
      return;
    }
    if (!this.hasRecoverableStream()) {
      this.activeStream = undefined;
    }
  }

  clearNexusSession(): Observable<{ cleared?: boolean; }> {
    return this.api.post<{ cleared?: boolean; }>('nexus/chat/clear-session', {});
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

  private emitStreamLines(buffer: string, observer: { next: (value: NexusChatStreamChunk) => void; }): string {
    const lines = buffer.split(/\r?\n/);
    const rest = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) {
        continue;
      }
      let parsed: any;
      try {
        parsed = JSON.parse(line);
      }
      catch {
        continue;
      }
      const output = this.asRecord(parsed?.output);
      const delta = output?.['delta'];
      const response = output?.['response'];
      const status = this.asRecord(parsed?.status);
      const statusMessage = status?.['message'] ?? parsed?.status_message;
      const error = this.asRecord(parsed?.error);
      let detail = parsed?.detail ?? error?.['message'];
      if (typeof detail === 'string' && detail.toLowerCase().includes('stream is already active')) {
        detail = 'Nexus is still finishing the previous chat. Try again in a moment.';
      }
      if (statusMessage !== undefined) {
        observer.next({ status: this.streamValueToText(statusMessage) });
      }
      if (delta !== undefined) {
        observer.next({ delta: this.streamValueToText(delta) });
      }
      if (response !== undefined) {
        observer.next({ response: this.streamValueToText(response) });
      }
      else if (detail !== undefined) {
        observer.next({ response: this.streamValueToText(detail) });
      }
    }
    return rest;
  }

  private streamValueToText(value: unknown): string {
    const record = this.asRecord(value);
    if (record) {
      return this.streamValueToText(record['response'] ?? record['result'] ?? record['text'] ?? JSON.stringify(record));
    }
    return String(value);
  }
}
