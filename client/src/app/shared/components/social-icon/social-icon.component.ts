import { Component, ChangeDetectionStrategy, input, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconService } from '../../services/icon.service';

@Component({
  selector: 'app-social-icon',
  standalone: true,
  imports: [CommonModule],
  template: `<img *ngIf="iconDataUrl()" [src]="iconDataUrl()" [alt]="platformName()" class="w-full h-full object-contain p-1">`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialIconComponent implements OnInit {
  platformName = input.required<string>();
  iconDataUrl = signal<string>('');
  
  private iconService = inject(IconService);

  ngOnInit() {
    this.iconService.getWhiteIconDataUrl(this.platformName()).then(url => {
      this.iconDataUrl.set(url);
    });
  }
}