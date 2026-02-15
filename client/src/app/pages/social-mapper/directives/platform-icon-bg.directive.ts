import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';
import { IconService } from '../../../shared/services/icon.service';

@Directive({
  selector: '[socialMapperPlatformBg]',
  standalone: true,
})
export class PlatformIconBgDirective {
  platformName = input.required<string>({ alias: 'socialMapperPlatformBg' });

  private el = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private iconService = inject(IconService);

  constructor() {
    effect(() => {
      const platformName = this.platformName();
      const brandColor = this.iconService.getPlatformBrandColor(platformName);
      const backgroundColor = this.hexToRgba(brandColor, 0.28);
      const borderColor = this.hexToRgba(brandColor, 0.55);

      this.renderer.setStyle(this.el.nativeElement, 'background-color', backgroundColor);
      this.renderer.setStyle(this.el.nativeElement, 'border-color', borderColor);
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', `inset 0 0 0 1px ${borderColor}`);
    });
  }

  private hexToRgba(hex: string, alpha: number): string
  {
    const normalizedHex = hex.replace('#', '');

    if (!/^[0-9a-fA-F]{6}$/.test(normalizedHex)) {
      return `rgba(71,85,105,${alpha})`;
    }

    const r = parseInt(normalizedHex.substring(0, 2), 16);
    const g = parseInt(normalizedHex.substring(2, 4), 16);
    const b = parseInt(normalizedHex.substring(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
  }
}
