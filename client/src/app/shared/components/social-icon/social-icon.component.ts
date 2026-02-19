import { Component, ChangeDetectionStrategy, input, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../../services/icon.service';
@Component({
    selector: 'app-social-icon',
    standalone: true,
    imports: [CommonModule],
    template: `@if (iconDataUrl()) { <img [src]="iconDataUrl()" [alt]="platformName()" class="w-full h-full object-contain"> }`,
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        'class': 'block w-full h-full'
    }
})
export class SocialIconComponent {
    platformName = input.required<string>();
    iconDataUrl = signal<string>('');
    private iconService = inject(IconService);
    constructor() {
        effect(() => {
            const platform = this.platformName();
            this.iconService.getWhiteIconDataUrl(platform).then(url => {
                this.iconDataUrl.set(url);
            });
        });
    }
}
