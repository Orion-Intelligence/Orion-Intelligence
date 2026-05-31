import { Component, Input, OnChanges } from '@angular/core';
import { ScrollRailMarker, ScrollRailMessage, ScrollRailPrompt } from '../../../../shared/model/chat/message-scroll-rail.model';

@Component({
  selector: 'app-message-scroll-rail',
  standalone: true,
  templateUrl: './message-scroll-rail.component.html',
})
export class MessageScrollRailComponent implements OnChanges {
  private readonly maxVisiblePrompts = 28;
  private activeMessageIndex: number | null = null;
  private activeMarkerIndex: number | null = null;
  private activePromptNumber: number | null = null;

  prompts: ScrollRailPrompt[] = [];
  visibleMarkers: ScrollRailMarker[] = [];

  @Input() messages: readonly ScrollRailMessage[] = [];

  ngOnChanges(): void {
    this.rebuildPrompts();
  }

  isActive(prompt: ScrollRailPrompt): boolean {
    return prompt.promptNumber === this.activePromptNumber;
  }

  isMarkerActive(marker: ScrollRailMarker): boolean {
    return marker.markerIndex === this.activeMarkerIndex;
  }

  scrollToMarker(marker: ScrollRailMarker): void {
    this.setActivePrompt(marker.targetPrompt, marker);
    this.scrollToMessage(marker.targetPrompt);
  }

  scrollToPrompt(prompt: ScrollRailPrompt): void {
    this.setActivePrompt(prompt, this.getMarkerForPrompt(prompt));
    this.scrollToMessage(prompt);
  }

  private scrollToMessage(prompt: ScrollRailPrompt): void {
    document
      .querySelector<HTMLElement>(`[data-ai-message-index="${prompt.messageIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private rebuildPrompts(): void {
    let promptNumber = 0;
    this.prompts = this.messages.reduce<ScrollRailPrompt[]>((items, message, messageIndex) => {
      if (message.sender === 'user') {
        promptNumber += 1;
        items.push({ messageIndex, promptNumber, title: this.getPromptTitle(message) });
      }
      return items;
    }, []);

    if (!this.prompts.some(prompt => prompt.messageIndex === this.activeMessageIndex)) {
      const lastPrompt = this.prompts.at(-1);
      this.activeMessageIndex = lastPrompt?.messageIndex ?? null;
      this.activePromptNumber = lastPrompt?.promptNumber ?? null;
    }
    this.visibleMarkers = this.getVisibleMarkers(this.prompts);
    this.syncActiveMarker();
  }

  private getVisibleMarkers(prompts: ScrollRailPrompt[]): ScrollRailMarker[] {
    const markerCount = Math.min(this.maxVisiblePrompts, prompts.length);
    return Array.from({ length: markerCount }, (_, index) => {
      const startIndex = Math.floor(index * prompts.length / markerCount);
      const rawEndIndex = Math.floor((index + 1) * prompts.length / markerCount) - 1;
      const endIndex = Math.max(startIndex, Math.min(rawEndIndex, prompts.length - 1));
      const targetPrompt = prompts[Math.round((startIndex + endIndex) / 2)];
      const startPromptNumber = prompts[startIndex].promptNumber;
      const endPromptNumber = prompts[endIndex].promptNumber;
      return {
        endPromptNumber,
        markerIndex: index,
        startPromptNumber,
        targetPrompt,
        title: startPromptNumber === endPromptNumber ? `Prompt ${startPromptNumber}` : `Prompts ${startPromptNumber}-${endPromptNumber}`,
      };
    });
  }

  private setActivePrompt(prompt: ScrollRailPrompt, marker: ScrollRailMarker | undefined): void {
    this.activeMessageIndex = prompt.messageIndex;
    this.activePromptNumber = prompt.promptNumber;
    this.activeMarkerIndex = marker?.markerIndex ?? null;
  }

  private syncActiveMarker(): void {
    if (this.activePromptNumber === null) {
      this.activeMarkerIndex = null;
      return;
    }

    const marker = this.visibleMarkers.find(item => this.activePromptNumber !== null
      && this.activePromptNumber >= item.startPromptNumber
      && this.activePromptNumber <= item.endPromptNumber);
    this.activeMarkerIndex = marker?.markerIndex ?? null;
  }

  private getMarkerForPrompt(prompt: ScrollRailPrompt): ScrollRailMarker | undefined {
    return this.visibleMarkers.find(marker => prompt.promptNumber >= marker.startPromptNumber && prompt.promptNumber <= marker.endPromptNumber);
  }

  private getPromptTitle(message: ScrollRailMessage): string {
    const title = typeof message.text === 'string' ? message.text.trim().replace(/\s+/g, ' ') : '';
    return title ? title.slice(0, 90) : 'Untitled prompt';
  }
}
