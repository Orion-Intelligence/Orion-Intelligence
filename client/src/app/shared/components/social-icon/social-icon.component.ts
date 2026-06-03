import { Component, ChangeDetectionStrategy, input, signal, effect, inject } from '@angular/core';

import { IconService } from '../../services/icon.service';
@Component({
  selector: 'app-social-icon',
  standalone: true,
  imports: [],
  template: `<span class="block h-full w-full">@if (iconDataUrl()) { <img [src]="iconDataUrl()" [alt]="platformName()" class="h-full w-full object-contain"> }</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialIconComponent {
  private iconService = inject(IconService);

  platformName = input.required<string>();
  iconDataUrl = signal<string>('');

  constructor() {
    effect(() => {
      const platform = this.platformName();
      this.iconService.getWhiteIconDataUrl(platform).then(url => {
        this.iconDataUrl.set(url);
      });
    });
  }
}
