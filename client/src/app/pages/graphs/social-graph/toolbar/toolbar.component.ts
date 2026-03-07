import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent {
  searchTerm = input.required<string>();
  isSearchDisabled = input.required<boolean>();
  viewMode = input.required<'graph' | 'list'>();
  isPhysicsEnabled = input.required<boolean>();
  isEditMode = input.required<boolean>();
  canEditConnections = input.required<boolean>();
  searchChanged = output<string>();
  scanTriggered = output<void>();
  imageUploadClicked = output<void>();
  viewModeChanged = output<'graph' | 'list'>();
  physicsToggled = output<void>();
  editModeToggled = output<void>();

  onSearchInput(event: Event) {
    this.searchChanged.emit((event.target as HTMLInputElement).value);
  }
}
