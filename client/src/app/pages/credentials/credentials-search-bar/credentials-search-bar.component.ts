import { Component, EventEmitter, Output } from '@angular/core';
import { NgFor, KeyValuePipe, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { StealerlogsAdvancedFilter, StealerlogsSearchFilters, StealerlogsSearchFilterLabels } from '../../../shared/model/stealerlogs-filter/stealerlogs-filters';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';



@Component({
  selector: 'app-credentials-search-bar',
  imports: [NgFor, NgIf, KeyValuePipe, FormsModule, TooltipDirective, NgClass],
  templateUrl: './credentials-search-bar.component.html',
  styleUrl: './credentials-search-bar.component.css',
  animations: [fadeInDashboardItem],
})
export class CredentialsSearchBarComponent {
  SearchTag = StealerlogsSearchFilters;
  FILTER_LABELS = StealerlogsSearchFilterLabels;

  isAdvanced = false;
  basicSubmitted = false;
  selectedTag = StealerlogsSearchFilters.ALL;
  basicQuery = '';

  @Output() searchTriggered = new EventEmitter<string>();

  advancedFilters: StealerlogsAdvancedFilter[] = [
    { id: this.generateId(), tag: StealerlogsSearchFilters.DOMAIN, value: '', operator: '&&' }
  ];

  constructor(protected sidebarService: SidebarService) { }

  toggleAdvanced(): void {
    this.isAdvanced = !this.isAdvanced;
  }
  selectBasicTag(tag: StealerlogsSearchFilters): void {
    this.selectedTag = tag;
    this.basicSubmitted = false;
  }
  addFilter(): void {
    this.advancedFilters.push({
      id: this.generateId(),
      tag: StealerlogsSearchFilters.DOMAIN,
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
    this.basicSubmitted = true;

    let finalQuery = '';

    if (this.isAdvanced) {
      const invalidFilter = this.advancedFilters.find(
        f => f.value && !this.validateValue(f.tag, f.value)
      );

      if (invalidFilter) {
        return;
      }

      finalQuery = this.advancedFilters
        .filter(f => f.value.trim() !== '')
        .map((f, index) => {
          const op = index === 0 ? '' : ` ${this.advancedFilters[index - 1].operator} `;
          return `${op}${f.tag}:${f.value.trim()}`;
        })
        .join('');

    } else {
      if (this.isBasicInvalid()) {
        return;
      }

      finalQuery = this.normalizeBasicQuery(this.selectedTag, this.basicQuery);
    }

    this.searchTriggered.emit(finalQuery);
  }
  isBasicInvalid(): boolean {
    if (!this.basicSubmitted) return false;

    const value = this.basicQuery?.trim();

    if (this.selectedTag !== StealerlogsSearchFilters.ALL && !value) {
      return true;
    }

    if (!value) return false;

    return !this.validateValue(this.selectedTag, value);
  }
  isAdvancedInvalid(filter: StealerlogsAdvancedFilter): boolean {
    return !!filter.value && !this.validateValue(filter.tag, filter.value);
  }
  validateValue(tag: StealerlogsSearchFilters, value: string): boolean {
    const validator = this.TAG_VALIDATORS[tag];
    if (!validator) return true;

    return validator.test(value.trim());
  }
  private TAG_VALIDATORS: Record<string, RegExp> = {
    [StealerlogsSearchFilters.EMAIL]: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    [StealerlogsSearchFilters.DOMAIN]: /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/,
    [StealerlogsSearchFilters.IP]: /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/
  };

  private normalizeBasicQuery(tag: string, input: string): string {
    if (!input.trim()) return '';

    let normalized = input
      .replace(/(?<!\|)\|(?!\|)/g, ' || ')
      .replace(/(?<!&)&(?!&)/g, ' && ')
      .replace(/\s*\|\|\s*/g, ' || ')
      .replace(/\s*&&\s*/g, ' && ')
      .trim();

    const parts = normalized.split(/\s+(?:\|\||&&)\s+/g);
    const operators = normalized.match(/(\|\||&&)/g) || [];

    const result: string[] = [];

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (!part || part === '&&' || part === '||') continue;
      result.push(`${tag}:${part}`);
      if (operators[i]) {
        result.push(operators[i]);
      }
    }
    return result.join(' ');
  }

  getBasicErrorMessage(): string {
    const value = this.basicQuery?.trim();

    if (!value && this.selectedTag !== StealerlogsSearchFilters.ALL) {
      switch (this.selectedTag) {
        case StealerlogsSearchFilters.EMAIL:
          return 'Please enter a valid email';
        case StealerlogsSearchFilters.DOMAIN:
          return 'Please enter a valid domain';
        case StealerlogsSearchFilters.IP:
          return 'Please enter a valid IP address';
        default:
          return 'Please enter a value';
      }
    }

    // format error
    switch (this.selectedTag) {
      case StealerlogsSearchFilters.EMAIL:
        return 'Invalid email format';
      case StealerlogsSearchFilters.DOMAIN:
        return 'Invalid domain format';
      case StealerlogsSearchFilters.IP:
        return 'Invalid IP address format';
      default:
        return 'Invalid value';
    }
  }


  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

}
