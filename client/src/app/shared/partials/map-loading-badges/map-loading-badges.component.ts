import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-map-loading-badges',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './map-loading-badges.component.html',
})
export class MapLoadingBadgesComponent {
  @Input() items: string[] = [];
  @Input() topControlsInset = false;
}
