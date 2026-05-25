import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-case-edit-drawer',
  imports: [CommonModule],
  host: { class: 'contents' },
  templateUrl: './case-edit-drawer.html'
})
export class CaseEditDrawerComponent {
  private isClosing = false;

  isOpen = false;

  @Input() title = '';
  @Input() subtitle = '';
  @Input() saveLabel = 'Save';
  @Input() saveTestId = '';
  @Input() cancelTestId = '';
  @Input() drawerTestId = '';

  @Output() save = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.isOpen = true;
      this.cdr.detectChanges();
    }, 10);
  }

  requestCancel(): void {
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.isOpen = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.cancel.emit();
    }, 300);
  }
}
