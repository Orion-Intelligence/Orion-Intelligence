import { NgClass } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface UiDropdownOption {
  key: string;
  label: string;
}

interface UiDropdownMenuOption {
  key: string | null;
  label: string;
  trackKey: string;
  testKey: string | null;
}

@Component({
  selector: 'app-ui-dropdown',
  standalone: true,
  imports: [FormsModule, NgClass],
  host: {
    class: 'block',
  },
  templateUrl: './ui-dropdown.component.html',
})
export class UiDropdownComponent {
  private static nextId = 0;
  private readonly fallbackId = `ui-dropdown-${UiDropdownComponent.nextId++}`;
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('listbox') private listbox?: ElementRef<HTMLElement>;

  readonly id = input<string | null>(null);
  readonly menuId = input<string | null>(null);
  readonly testId = input<string | null>(null);
  readonly optionTestIdPrefix = input<string | null>(null);
  readonly options = input<UiDropdownOption[]>([]);
  readonly selected = input<string | null | undefined>(null);
  readonly placeholder = input('Select');
  readonly searchPlaceholder = input('Search options');
  readonly searchable = input(true);
  readonly allowEmpty = input(false);
  readonly disabled = input(false);
  readonly size = input<'default' | 'large'>('default');
  readonly loading = input(false);
  readonly valueChange = output<string | null>();
  readonly searchChange = output<string>();
  isOpen = false;
  searchTerm = '';
  activeIndex = -1;

  get selectedLabel(): string {
    const selected = this.selected();
    if (!selected) {
      return this.placeholder();
    }
    return this.options().find(option => option.key === selected)?.label || this.placeholder();
  }

  get visibleOptions(): UiDropdownMenuOption[] {
    const query = this.searchTerm.trim().toLowerCase();
    const options: UiDropdownMenuOption[] = this.options().map(option => ({
      ...option,
      trackKey: option.key,
      testKey: option.key,
    }));

    if (this.shouldShowEmptyOption()) {
      options.unshift({
        key: null,
        label: this.placeholder(),
        trackKey: '__empty__',
        testKey: null,
      });
    }

    if (!query) {
      return options;
    }

    return options.filter(option => option.label.toLowerCase().includes(query) || String(option.key || '').toLowerCase().includes(query));
  }

  get resolvedMenuId(): string {
    return this.menuId() || `${this.fallbackId}-menu`;
  }

  shouldShowEmptyOption(): boolean {
    return this.allowEmpty() && this.options().length > 0;
  }

  toggle(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.canOpen()) {
      return;
    }
    if (this.isOpen) {
      this.close();
      return;
    }
    this.open();
  }

  select(value: string | null, event?: Event): void {
    event?.stopPropagation();
    this.isOpen = false;
    this.searchTerm = '';
    this.activeIndex = -1;
    this.valueChange.emit(value);
  }

  onButtonKeydown(event: KeyboardEvent): void {
    if (!this.canOpen()) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      this.open();
      this.moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      this.open();
      this.setActiveIndex(event.key === 'Home' ? 0 : this.visibleOptions.length - 1);
      return;
    }

    if (this.searchable() && this.isPrintableKey(event)) {
      event.preventDefault();
      this.open(event.key);
    }
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.searchChange.emit(value);
    this.setActiveIndex(this.visibleOptions.length ? 0 : -1);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (this.handleNavigationKey(event)) {
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.selectActive(event);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  onOptionKeydown(event: KeyboardEvent): void {
    if (this.handleNavigationKey(event)) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }

  setActiveIndex(index: number): void {
    const options = this.visibleOptions;
    if (!options.length) {
      this.activeIndex = -1;
      return;
    }
    this.activeIndex = Math.min(Math.max(index, 0), options.length - 1);
    this.scrollActiveIntoView();
  }

  optionId(index: number): string {
    return `${this.resolvedMenuId}-option-${index}`;
  }

  isSelected(value: string | null): boolean {
    return value === null ? !this.selected() : this.selected() === value;
  }

  optionClass(option: UiDropdownMenuOption, index: number): string {
    if (this.isSelected(option.key)) {
      return 'bg-[var(--color-blue-720)] font-semibold text-[var(--color-text1)]';
    }
    if (this.activeIndex === index) {
      return 'bg-white/[0.045] font-medium text-[var(--color-text1)]';
    }
    return 'font-medium text-[var(--color-text3)] hover:bg-white/[0.035] hover:text-[var(--color-text1)]';
  }

  @HostListener('document:click')
  close(): void {
    this.isOpen = false;
    this.searchTerm = '';
    this.activeIndex = -1;
  }

  private open(searchTerm = ''): void {
    this.isOpen = true;
    this.searchTerm = searchTerm;
    this.searchChange.emit(searchTerm);
    const selectedIndex = this.visibleOptions.findIndex(option => this.isSelected(option.key));
    this.activeIndex = selectedIndex >= 0 ? selectedIndex : (this.visibleOptions.length ? 0 : -1);
    this.focusSearch();
    this.scrollActiveIntoView();
  }

  private canOpen(): boolean {
    return !this.disabled() && (this.options().length > 0 || this.allowEmpty());
  }

  private handleNavigationKey(event: KeyboardEvent): boolean {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        return true;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        return true;
      case 'Home':
        event.preventDefault();
        this.setActiveIndex(0);
        return true;
      case 'End':
        event.preventDefault();
        this.setActiveIndex(this.visibleOptions.length - 1);
        return true;
      case 'PageDown':
        event.preventDefault();
        this.moveActive(6);
        return true;
      case 'PageUp':
        event.preventDefault();
        this.moveActive(-6);
        return true;
      default:
        return false;
    }
  }

  private moveActive(delta: number): void {
    const options = this.visibleOptions;
    if (!options.length) {
      this.activeIndex = -1;
      return;
    }
    const nextIndex = this.activeIndex < 0 ? 0 : this.activeIndex + delta;
    this.setActiveIndex(nextIndex);
  }

  private selectActive(event: Event): void {
    const option = this.visibleOptions[this.activeIndex];
    if (!option) {
      return;
    }
    this.select(option.key, event);
  }

  private focusSearch(): void {
    if (!this.searchable()) {
      return;
    }
    window.setTimeout(() => {
      this.searchInput?.nativeElement.focus();
      const valueLength = this.searchInput?.nativeElement.value.length || 0;
      this.searchInput?.nativeElement.setSelectionRange(valueLength, valueLength);
    });
  }

  private scrollActiveIntoView(): void {
    window.setTimeout(() => {
      const activeOption = this.listbox?.nativeElement.querySelector<HTMLElement>(`[data-dropdown-option-index="${this.activeIndex}"]`);
      activeOption?.scrollIntoView({ block: 'nearest' });
    });
  }

  private isPrintableKey(event: KeyboardEvent): boolean {
    return event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey;
  }
}
