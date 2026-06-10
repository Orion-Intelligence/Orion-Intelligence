import { Component, OnInit, input, output } from '@angular/core';
import { KeyValuePipe, NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { advancedRowMotionAnimation } from '../../../shared/animations/advanced.row.motion.animation';
import { StealerlogsSearchFilters, StealerlogsSearchFilterLabels } from '../../../shared/model/stealerlogs-filter/stealerlogs-filters';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ChatWidgetComponent } from '../../../pages/root-searches/ai-workspace/chat-widget/chat-widget.component';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { AppService } from '../../../services/core/app/app.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface SharedSearchAdvancedFilter { id: string; tag: string; value: string; operator: '&&' | '||' }

@Component({
  selector: 'app-ioc-search',
  imports: [KeyValuePipe, FormsModule, TooltipDirective, NgClass, ChatWidgetComponent, TranslatePipe],
  templateUrl: './ioc-search.component.html',
  animations: [fadeInDashboardItem, advancedRowMotionAnimation],
})
export class IocSearchComponent implements OnInit {
  private readonly DEFAULT_VALUE_VALIDATORS: RegExp[] = [ /^[^\s@]+@[^\s@]+\.[^\s@]+$/, /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/, /^(?:\d{6}|\d{13,19})$/ ];
  private readonly DEFAULT_TAG_VALIDATORS: Record<string, RegExp> = { [StealerlogsSearchFilters.EMAIL]: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, [StealerlogsSearchFilters.DOMAIN]: /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/, [StealerlogsSearchFilters.IP]: /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/, [StealerlogsSearchFilters.CREDITCARD]: /^(?:\d{6}|\d{13,19})$/, [StealerlogsSearchFilters.CHANNEL]: /^.*$/ };

  readonly basicTags = input<string[]>([StealerlogsSearchFilters.ALL, StealerlogsSearchFilters.DOMAIN, StealerlogsSearchFilters.EMAIL, StealerlogsSearchFilters.CREDITCARD, StealerlogsSearchFilters.IP]);
  readonly filterLabels = input<Record<string, string>>(StealerlogsSearchFilterLabels);
  readonly allTag = input<string>(StealerlogsSearchFilters.ALL);
  readonly defaultBasicTag = input<string>(StealerlogsSearchFilters.ALL);
  readonly defaultAdvancedTag = input<string>(StealerlogsSearchFilters.DOMAIN);
  readonly maxAdvancedFilters = input<number>(8);
  readonly valueValidators = input<RegExp[]>(this.DEFAULT_VALUE_VALIDATORS);
  readonly tagValidators = input<Record<string, RegExp>>(this.DEFAULT_TAG_VALIDATORS);
  readonly useRouteQuery = input<boolean>(true);
  readonly advancedTitle = input<string>('Advanced Filter Builder');
  readonly advancedSubtitle = input<string>('Combine multiple filters with AND/OR for precise results');
  isAdvanced = false;
  basicSubmitted = false;
  basicTouched = false;
  selectedTag = this.defaultBasicTag();
  basicQuery = '';
  advancedFilters: SharedSearchAdvancedFilter[] = [{ id: this.generateId(), tag: this.defaultAdvancedTag(), value: '', operator: '&&' }];
  readonly searchTriggered = output<string>();

  constructor(protected sidebarService: SidebarService, private route: ActivatedRoute, protected licenseService: LicenseService, protected appService: AppService) { }

  ngOnInit(): void {
    this.selectedTag = this.defaultBasicTag();
    this.advancedFilters = [{ id: this.generateId(), tag: this.defaultAdvancedTag(), value: '', operator: '&&' }];
    if (this.useRouteQuery()) {
      this.route.queryParams.subscribe(params => {
        const q = params['q'];
        if (q) {
          this.basicQuery = q;
        }
      });
    }
  }

  toggleAdvanced(): void {
    this.isAdvanced = !this.isAdvanced;
  }

  selectBasicTag(tag: string): void {
    this.selectedTag = tag;
    this.basicSubmitted = false;
  }

  addFilter(): void {
    if (this.advancedFilters.length >= this.maxAdvancedFilters()) {
      return;
    }
    this.advancedFilters.push({
      id: this.generateId(),
      tag: this.defaultAdvancedTag(),
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
      const invalidFilter = this.advancedFilters.find(f => f.value && !this.validateValue(f.tag, f.value));
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
    }
    else {
      if (this.isBasicInvalid()) {
        return;
      }
      finalQuery = this.normalizeBasicQuery(this.selectedTag, this.basicQuery);
    }
    this.searchTriggered.emit(finalQuery);
  }

  isBasicInvalid(): boolean {
    if (!this.basicSubmitted && !this.basicTouched) {
      return false;
    }
    if (!this.basicSubmitted) {
      return false;
    }
    const value = this.basicQuery?.trim();
    if (this.selectedTag !== this.allTag() && !value) {
      return true;
    }
    if (!value) {
      return false;
    }
    return !this.validateComplexQuery(value);
  }

  isAdvancedInvalid(filter: SharedSearchAdvancedFilter): boolean {
    return !!filter.value && !this.validateValue(filter.tag, filter.value);
  }

  validateComplexQuery(input: string): boolean {
    if (!input.trim()) {
      return false;
    }
    if (this.selectedTag === this.allTag()) {
      return true;
    }
    if (this.hasInvalidOperators(input)) {
      return false;
    }
    if (/\s+/.test(input) && !/&&|\|\|/.test(input)) {
      return false;
    }
    const tokens = this.extractTokens(input);
    if (!tokens.length) {
      return false;
    }
    return tokens.every(token => this.isValidToken(token));
  }

  private isValidToken(value: string): boolean {
    return this.valueValidators().some(regex => regex.test(value));
  }

  private hasInvalidOperators(input: string): boolean {
    return (/(&{3,}|\|{3,})/.test(input) ||
              /(&&\|\||\|\|&&)/.test(input) ||
              /^[&|]/.test(input));
  }

  private extractTokens(input: string): string[] {
    const normalized = this.normalizeOperators(input);
    return normalized
      .split(/\s+(?:\|\||&&)\s+/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  private normalizeOperators(input: string): string {
    return input
      .replace(/(?<!\|)\|(?!\|)/g, ' || ')
      .replace(/(?<!&)&(?!&)/g, ' && ')
      .replace(/\s*\|\|\s*/g, ' || ')
      .replace(/\s*&&\s*/g, ' && ')
      .trim();
  }

  validateValue(tag: string, value: string): boolean {
    if (tag == StealerlogsSearchFilters.CHANNEL) {
      return true;
    }
    if (this.hasInvalidOperators(value)) {
      return false;
    }
    if (/\s+/.test(value) && !/&&|\|\|/.test(value)) {
      return false;
    }
    const validator = this.tagValidators()[tag];
    if (!validator) {
      return true;
    }
    const values = this.extractValues(value);
    if (!values.length) {
      return false;
    }
    return values.every(v => validator.test(v));
  }

  private normalizeBasicQuery(tag: string, input: string): string {
    if (!input.trim()) {
      return '';
    }
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
      if (!part || part === '&&' || part === '||') {
        continue;
      }
      result.push(`${tag}:${part}`);
      if (operators[i]) {
        result.push(operators[i]);
      }
    }
    return result.join(' ');
  }

  getBasicErrorMessage(): string {
    const value = this.basicQuery?.trim();
    if (!value && this.selectedTag !== this.allTag()) {
      return `Please enter a valid ${this.selectedTag}`;
    }
    if (this.hasInvalidOperators(value)) {
      return 'Invalid operator usage (use && or ||)';
    }
    if (/\s+/.test(value) && !/&&|\|\|/.test(value)) {
      return 'Use && or || between multiple values';
    }
    if (this.selectedTag === this.allTag()) {
      return '';
    }
    const fallbackLabel = this.filterLabels()[this.selectedTag] || this.selectedTag;
    switch (this.selectedTag) {
      case StealerlogsSearchFilters.EMAIL:
        return 'Invalid email format';
      case StealerlogsSearchFilters.DOMAIN:
        return 'Invalid domain format';
      case StealerlogsSearchFilters.IP:
        return 'Invalid IP address format';
      case StealerlogsSearchFilters.CREDITCARD:
        return 'Invalid crediticard format';
      default:
        return `Invalid ${fallbackLabel.toLowerCase()} format`;
    }
  }

  private extractValues(input: string): string[] {
    return input
      .replace(/(?<!\|)\|(?!\|)/g, ' || ')
      .replace(/(?<!&)&(?!&)/g, ' && ')
      .split(/\s+(?:\|\||&&)\s+/)
      .map(v => v.trim())
      .filter(Boolean);
  }

  onBasicQueryChange(value: string): void {
    this.basicQuery = value;
    if (!this.basicTouched && value.trim().length > 0) {
      this.basicTouched = true;
    }
    this.basicSubmitted = this.basicTouched;
  }

  filterBasicInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    if (this.selectedTag === this.allTag()) {
      this.basicQuery = inputElement.value;
      return;
    }
    let regex: RegExp;
    switch (this.selectedTag) {
      case StealerlogsSearchFilters.EMAIL:
        regex = /[^a-zA-Z0-9@._&|\s-]/g;
        break;
      case StealerlogsSearchFilters.DOMAIN:
        regex = /[^a-zA-Z0-9.&|\s-]/g;
        break;
      case StealerlogsSearchFilters.IP:
        regex = /[^0-9.&|\s]/g;
        break;
      case StealerlogsSearchFilters.CREDITCARD:
        regex = /[^0-9\s&|]/g;
        break;
      default:
        regex = /[^a-zA-Z0-9&|@.\s]/g;
    }
    const sanitized = inputElement.value.replace(regex, '');
    if (sanitized !== inputElement.value) {
      const cursor = inputElement.selectionStart ?? sanitized.length;
      inputElement.value = sanitized;
      this.basicQuery = sanitized;
      inputElement.setSelectionRange(cursor - 1, cursor - 1);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
