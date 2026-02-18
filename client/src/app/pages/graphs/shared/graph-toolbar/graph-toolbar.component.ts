import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-graph-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graph-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GraphToolbarComponent {
  searchTerm = input('');
  isSearchDisabled = input(false);
  searchPlaceholder = input('Enter username to scan...');
  searchActionLabel = input('Scan');
  showSearchActionButton = input(true);
  showImageButton = input(false);
  showClearButton = input(false);
  applyOuterPadding = input(true);

  viewMode = input<'graph' | 'list'>('graph');
  showViewModeToggle = input(true);
  isPhysicsEnabled = input(false);
  showPhysicsToggle = input(true);
  isEditMode = input(false);
  canEditConnections = input(false);
  showEditToggle = input(false);

  searchChanged = output<string>();
  searchSubmitted = output<void>();
  imageSearchClicked = output<void>();
  clearSearchClicked = output<void>();
  viewModeChanged = output<'graph' | 'list'>();
  physicsToggled = output<void>();
  editModeToggled = output<void>();

  onSearchInput(event: Event): void {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }

  onSetViewMode(mode: 'graph' | 'list'): void {
    if (this.viewMode() !== mode) {
      this.viewModeChanged.emit(mode);
    }
  }
}
