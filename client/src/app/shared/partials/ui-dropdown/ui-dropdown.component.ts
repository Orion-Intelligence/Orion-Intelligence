import { NgClass, NgTemplateOutlet } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { Component, ElementRef, HostListener, OnDestroy, ViewChild, input, output, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
  imports: [FormsModule, NgClass, NgTemplateOutlet, OverlayModule, TranslatePipe],
  host: {
    class: 'block',
  },
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './ui-dropdown.component.html',
})
export class UiDropdownComponent implements OnDestroy {
  private static nextId = 0;
  private static activeDropdown: UiDropdownComponent | null = null;
  private readonly fallbackId = `ui-dropdown-${UiDropdownComponent.nextId++}`;
  @ViewChild('triggerButton') private triggerButton?: ElementRef<HTMLButtonElement>;
  @ViewChild('searchInput') private searchInput?: ElementRef<HTMLInputElement>;
  @ViewChild('listbox') private listbox?: ElementRef<HTMLElement>;

  readonly id = input<string | null>(null);
  readonly menuId = input<string | null>(null);
  readonly testId = input<string | null>(null);
  readonly optionTestIdPrefix = input<string | null>(null);
  readonly options = input<UiDropdownOption[]>([]);
  readonly selected = input<string | null | undefined>(null);
  readonly selectedValues = input<string[] | null | undefined>(null);
  readonly placeholder = input('Select');
  readonly searchPlaceholder = input('Search options');
  readonly searchable = input(true);
  readonly allowEmpty = input(false);
  readonly multiSelect = input(false);
  readonly showSelectedChips = input(false);
  readonly menuPlacement = input<'absolute' | 'static'>('absolute');
  readonly surface = input<'default' | 'alert'>('default');
  readonly disabled = input(false);
  readonly size = input<'default' | 'large'>('default');
  readonly loading = input(false);
  readonly valueChange = output<string | null>();
  readonly valuesChange = output<string[]>();
  readonly searchChange = output<string>();
  isOpen = false;
  searchTerm = '';
  activeIndex = -1;
  overlayWidth = 0;
  readonly overlayPositions: ConnectedPosition[] = [{ originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 0 }];

  constructor(private readonly hostElement: ElementRef<HTMLElement>) {}

  get selectedLabel(): string {
    if (this.multiSelect()) {
      const selectedValues = this.selectedValues() || [];
      if (!selectedValues.length) {
        return this.placeholder();
      }
      const labels = selectedValues.map(value => this.options().find(option => option.key === value)?.label || value);
      if (labels.length <= 2) {
        return labels.join(', ');
      }
      return `${labels.slice(0, 2).join(', ')} +${labels.length - 2}`;
    }

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
    if (this.multiSelect()) {
      if (value === null) {
        this.valuesChange.emit([]);
        return;
      }
      const selectedValues = this.selectedValues() || [];
      const nextValues = selectedValues.includes(value)
        ? selectedValues.filter(item => item !== value)
        : [...selectedValues, value];
      this.valuesChange.emit(nextValues);
      return;
    }

    this.close();
    this.valueChange.emit(value);
  }

  removeSelectedValue(value: string, event: Event): void {
    event.stopPropagation();
    const selectedValues = this.selectedValues() || [];
    this.valuesChange.emit(selectedValues.filter(item => item !== value));
  }

  selectedChipLabel(value: string): string {
    return this.options().find(option => option.key === value)?.label || value;
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
    if (this.multiSelect()) {
      return value === null ? !(this.selectedValues() || []).length : (this.selectedValues() || []).includes(value);
    }
    return value === null ? !this.selected() : this.selected() === value;
  }

  isOptionVisuallySelected(value: string | null): boolean {
    return value !== null && this.isSelected(value);
  }

  optionClass(option: UiDropdownMenuOption, index: number): string {
    if (this.isLightTheme()) {
      if (option.key === null) {
        return 'bg-transparent font-medium text-[#64748b] hover:bg-transparent hover:text-[#334155]';
      }
      if (this.isSelected(option.key)) {
        return 'border border-[#d8dee8] bg-[#eef1f6] font-semibold text-[#172235]';
      }
      if (this.activeIndex === index) {
        return 'bg-[#f1f4f8] font-medium text-[#172235]';
      }
      return 'font-medium text-[#40516a] hover:bg-[#f1f4f8] hover:text-[#172235]';
    }

    if (option.key === null) {
      return 'bg-transparent font-medium text-[#d6dee8] hover:bg-transparent hover:text-[#f8fafc]';
    }
    const activeSurfaceClass = this.surface() === 'alert' ? '!bg-[#1a2835]' : '!bg-[#1D2A41]';
    if (this.isSelected(option.key)) {
      return `${activeSurfaceClass} font-semibold text-[var(--color-text1)]`;
    }
    if (this.activeIndex === index) {
      return `${activeSurfaceClass} font-medium text-[var(--color-text1)]`;
    }
    const hoverSurfaceClass = this.surface() === 'alert' ? 'hover:!bg-[#1a2835]' : 'hover:!bg-[#1D2A41]';
    return `font-medium text-[var(--color-text3)] ${hoverSurfaceClass} hover:text-[var(--color-text1)]`;
  }

  triggerClass(): string {
    const lightTheme = this.isLightTheme();
    const radiusClass = this.isOpen
      ? (this.size() === 'large' ? 'rounded-t-[10px] rounded-b-none' : 'rounded-t-[7px] rounded-b-none')
      : (this.size() === 'large' ? 'rounded-[10px]' : 'rounded-[7px]');
    const sizeClass = this.size() === 'large'
      ? `${lightTheme ? 'h-10' : 'h-11'} ${radiusClass} px-3 text-sm`
      : `${lightTheme ? 'h-9 px-3' : 'h-10 px-[15px]'} ${radiusClass} text-xs`;
    const openBorderClass = this.isOpen ? '!border-b-transparent hover:!border-b-transparent focus:!border-b-transparent' : '';
    const darkSurfaceClass = this.surface() === 'alert'
      ? '!bg-[#152230] hover:!bg-[#152230] focus:!bg-[#152230]'
      : '!bg-[#131E30] hover:!bg-[#131E30] focus:!bg-[#131E30]';
    const themeClass = lightTheme
      ? `border-[#c7d5e6] bg-white text-[#172235] hover:border-[#b8c8dc] hover:bg-[#f8fbff] focus:border-[#b8c8dc] focus:bg-white ${openBorderClass}`
      : `border-[#2c3a4a] ${darkSurfaceClass} text-[var(--color-text1)] hover:border-[#2c3a4a] focus:border-[#2c3a4a] ${openBorderClass}`;
    return `${sizeClass} ${themeClass}`;
  }

  selectedLabelClass(): string {
    const hasSelection = this.multiSelect() ? !!(this.selectedValues() || []).length : !!this.selected();
    const labelSizeClass = this.size() === 'large' ? 'text-sm' : 'text-[13px]';
    if (hasSelection) {
      return this.isLightTheme() ? `text-[#172235] ${labelSizeClass}` : `text-[#f8fafc] ${labelSizeClass}`;
    }
    return this.isLightTheme() ? `text-[#64748b]/85 ${labelSizeClass}` : `text-[#C7D5E6]/80 ${labelSizeClass}`;
  }

  searchInputClass(): string {
    return this.isLightTheme()
      ? 'bg-white text-[#172235] placeholder:text-[#94a3b8] focus:bg-white'
      : (this.surface() === 'alert'
        ? '!bg-[#152230] text-[var(--color-text1)] placeholder:text-[#A0B8D1] focus:!bg-[#152230]'
        : '!bg-[#131E30] text-[var(--color-text1)] placeholder:text-[#A0B8D1] focus:!bg-[#131E30]');
  }

  checkboxClass(): string {
    return this.isLightTheme() ? 'border-[#c7d5e6] bg-white' : 'border-[#4b5f78] !bg-[#131E30]';
  }

  listboxClass(): string {
    return this.size() === 'large' ? 'max-h-[280px]' : 'max-h-[240px]';
  }

  menuClass(): string {
    const surfaceClass = this.surface() === 'alert' ? 'ui-dropdown-menu-alert' : '';
    const darkSurfaceClass = this.surface() === 'alert' ? '!bg-[#152230]' : '!bg-[#131E30]';
    const themeSurface = this.isLightTheme()
      ? 'border-[#d5dde8] bg-white shadow-[0_14px_34px_rgba(15,23,42,0.14)]'
      : `border-[#2c3a4a] ${darkSurfaceClass} shadow-[0_8px_18px_rgba(0,0,0,0.22)]`;
    const base = `ui-dropdown-menu ${surfaceClass} box-border w-full min-w-full left-0 right-0 z-[1250] rounded-b-lg rounded-t-none border border-t-0 p-1 ${themeSurface}`;
    if (this.menuPlacement() === 'static') {
      return `ui-dropdown-menu ${surfaceClass} box-border w-full min-w-full z-[1250] rounded-b-lg rounded-t-none border border-t-0 p-1 ${themeSurface}`;
    }
    return `${base} absolute top-full`;
  }

  @HostListener('document:click')
  close(): void {
    this.isOpen = false;
    this.searchTerm = '';
    this.activeIndex = -1;
    if (UiDropdownComponent.activeDropdown === this) {
      UiDropdownComponent.activeDropdown = null;
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.updateOverlayMetrics();
    }
  }

  ngOnDestroy(): void {
    if (UiDropdownComponent.activeDropdown === this) {
      UiDropdownComponent.activeDropdown = null;
    }
  }

  private open(searchTerm = ''): void {
    UiDropdownComponent.activeDropdown?.close();
    UiDropdownComponent.activeDropdown = this;
    this.isOpen = true;
    this.searchTerm = searchTerm;
    this.searchChange.emit(searchTerm);
    this.updateOverlayMetrics();
    const selectedIndex = this.visibleOptions.findIndex(option => this.isSelected(option.key));
    this.activeIndex = selectedIndex >= 0 ? selectedIndex : (this.visibleOptions.length ? 0 : -1);
    this.focusSearch();
    this.scrollActiveIntoView();
  }

  private updateOverlayMetrics(): void {
    const triggerRect = this.triggerButton?.nativeElement.getBoundingClientRect() || this.hostElement.nativeElement.getBoundingClientRect();
    this.overlayWidth = triggerRect.width || 0;
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

  isLightTheme(): boolean {
    return typeof document !== 'undefined' && document.body.classList.contains('light-theme');
  }

}
