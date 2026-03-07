import { Directive, HostBinding, effect, inject, input } from '@angular/core';
import { IconService } from '../../../../shared/services/icon.service';
@Directive({
  selector: '[socialMapperPlatformBg]',
  standalone: true,
})
export class PlatformIconBgDirective {
  private iconService = inject(IconService);

  @HostBinding('attr.data-platform-bg') platformBg = 'slate';
  platformName = input.required<string>({ alias: 'socialMapperPlatformBg' });

  constructor() {
    effect(() => {
      const platformName = this.platformName();
      const brandColor = this.iconService.getPlatformBrandColor(platformName);
      this.platformBg = this.getColorBucketFromHex(brandColor);
    });
  }

  private getColorBucketFromHex(hex: string): string {
    const normalizedHex = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6}$/.test(normalizedHex)) {
      return 'slate';
    }
    const r = parseInt(normalizedHex.substring(0, 2), 16) / 255;
    const g = parseInt(normalizedHex.substring(2, 4), 16) / 255;
    const b = parseInt(normalizedHex.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (delta === 0) {
      return 'slate';
    }
    let hue: number;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    }
    else if (max === g) {
      hue = (b - r) / delta + 2;
    }
    else {
      hue = (r - g) / delta + 4;
    }
    hue = Math.round(hue * 60);
    if (hue < 0) {
      hue += 360;
    }
    if (hue < 20 || hue >= 340) {
      return 'red';
    }
    if (hue < 45) {
      return 'orange';
    }
    if (hue < 70) {
      return 'amber';
    }
    if (hue < 160) {
      return 'green';
    }
    if (hue < 200) {
      return 'cyan';
    }
    if (hue < 245) {
      return 'blue';
    }
    if (hue < 300) {
      return 'violet';
    }
    return 'pink';
  }
}
