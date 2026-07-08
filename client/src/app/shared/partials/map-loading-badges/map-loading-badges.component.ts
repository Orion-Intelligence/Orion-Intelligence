import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-map-loading-badges',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './map-loading-badges.component.html',
})
export class MapLoadingBadgesComponent {
  @Input() items: string[] = [];
  @Input() topControlsInset = false;
}
