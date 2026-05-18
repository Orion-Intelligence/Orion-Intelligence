import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostBinding, Input, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThreatLensDisplayFeedItem, ThreatLensFeedRange } from '../threat.lens.model';

export interface ThreatLensFeedRangeOption {
  key: ThreatLensFeedRange;
  label: string;
}

@Component({
  selector: 'app-threat-lens-feed-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './threat-lens-feed-panel.html',
})
export class ThreatLensFeedPanelComponent {
  @ViewChild('feedScroller') private feedScroller?: ElementRef<HTMLDivElement>;

  @Input() title = '';
  @Input() description = '';
  @Input() searchPlaceholder = 'Search...';
  @Input() emptyMessage = 'No records found for the selected time window.';
  @Input() collapsed = false;
  @Input() searchTerm = '';
  @Input() selectedRange: ThreatLensFeedRange = 'all';
  @Input() ranges: ThreatLensFeedRangeOption[] = [];
  @Input() items: ThreatLensDisplayFeedItem[] = [];

  @Output() toggleClicked = new EventEmitter<void>();
  @Output() searchTermChange = new EventEmitter<string>();
  @Output() rangeSelected = new EventEmitter<ThreatLensFeedRange>();
  @Output() hoverChanged = new EventEmitter<boolean>();
  @Output() interacted = new EventEmitter<void>();
  @Output() itemSelected = new EventEmitter<ThreatLensDisplayFeedItem>();

  @HostBinding('class')
  get hostClass(): string {
    const sizeClass = this.collapsed
      ? 'h-auto min-h-0'
      : 'h-[calc(50%-0.375rem)] min-h-[250px] max-[1100px]:h-auto max-[1100px]:min-h-[280px]';

    return `block w-full ${sizeClass}`;
  }

  getScrollerElement(): HTMLDivElement | undefined {
    return this.feedScroller?.nativeElement;
  }

  scrollToTop(): void {
    this.feedScroller?.nativeElement.scrollTo({ top: 0 });
  }
}
