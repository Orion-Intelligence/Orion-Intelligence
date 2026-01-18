import { Component, EventEmitter, Output } from '@angular/core';
import { NgFor, KeyValuePipe, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {fadeInDashboardItem} from '../../../shared/animations/dashboard.item.animation';


export enum SearchTag {
  ALL = 'm_search_all',
  DOMAIN = 'm_domain',
  USERNAME = 'm_username',
  URL = 'm_url',
  IP = 'm_ip',
  CHANNEL = 'm_channel',
  FILE = 'm_file',
  EMAIL = 'm_email'
}

export const TAG_LABELS: Record<SearchTag, string> = {
  [SearchTag.ALL]: 'All',
  [SearchTag.DOMAIN]: 'Domain',
  [SearchTag.USERNAME]: 'Username',
  [SearchTag.URL]: 'URL',
  [SearchTag.IP]: 'IP Address',
  [SearchTag.CHANNEL]: 'Channel',
  [SearchTag.FILE]: 'File Name',
  [SearchTag.EMAIL]: 'Email',
};

export interface AdvancedFilter {
  id: string;
  tag: SearchTag;
  value: string;
  operator: '&&' | '||';
}

@Component({
  selector: 'app-credentials-search-bar',
  imports: [NgFor, NgIf, KeyValuePipe, FormsModule],
  templateUrl: './credentials-search-bar.component.html',
  styleUrl: './credentials-search-bar.component.css',
  animations: [fadeInDashboardItem],
})
export class CredentialsSearchBarComponent {
  SearchTag = SearchTag;
  TAG_LABELS = TAG_LABELS;

  isAdvanced = false;
  selectedTag = SearchTag.ALL;
  basicQuery = '';

  advancedFilters: AdvancedFilter[] = [
    { id: this.generateId(), tag: SearchTag.DOMAIN, value: '', operator: '&&' }
  ];

  @Output() searchTriggered = new EventEmitter<string>();

  toggleAdvanced(): void {
    this.isAdvanced = !this.isAdvanced;
  }

  selectBasicTag(tag: SearchTag): void {
    this.selectedTag = tag;
  }

  addFilter(): void {
    this.advancedFilters.push({
      id: this.generateId(),
      tag: SearchTag.DOMAIN,
      value: '',
      operator: '&&'
    });
  }

  removeFilter(id: string): void {
    if (this.advancedFilters.length > 1) {
      this.advancedFilters = this.advancedFilters.filter(f => f.id !== id);
    }
  }

  triggerSearch(): void {
    let finalQuery;

    if (this.isAdvanced) {
      finalQuery = this.advancedFilters
        .filter(f => f.value.trim() !== '')
        .map((f, index) => {
          const prefix = `${f.tag}:`;
          const op = index === 0 ? '' : ` ${this.advancedFilters[index - 1].operator} `;
          return `${op}${prefix}${f.value.trim()}`;
        })
        .join('');
    } else {
      finalQuery = this.normalizeBasicQuery(this.selectedTag, this.basicQuery);
    }

    this.searchTriggered.emit(finalQuery);
  }

  private normalizeBasicQuery(tag: string, input: string): string {
    if (!input.trim()) return '';
    let normalized = input
      .replace(/\s*\|\|\s*/g, ' || ')
      .replace(/\s*&&\s*/g, ' && ')
      .trim();

    const parts = normalized.split(/\s+(?:\|\||&&)\s+/g);
    const operators = normalized.match(/(\|\||&&)/g) || [];
    const result: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part) continue;
      result.push(`${tag}:${part}`);
      if (operators[i]) {
        result.push(operators[i]);
      }
    }
    return result.join(' ');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

}
