import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-safe-zone-pro',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './safe-zone-pro.component.html',
  styleUrl: './safe-zone-pro.component.css'
})
export class SafeZoneProComponent {
  @Output() close = new EventEmitter<void>();

  selectedSubscription: string = 'monthly-highlighted';
  userName: string = '';
  userPhone: string = '';
  userEmail: string = '';

  constructor() { }

  closePopup() {
    this.close.emit();
  }
}