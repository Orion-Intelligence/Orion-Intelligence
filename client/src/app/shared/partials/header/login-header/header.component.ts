import { Component, Input } from '@angular/core';
import { NgClass, NgOptimizedImage } from '@angular/common';
import { ProfileComponent } from '../../profile/profile.component';
import { AppService } from '../../../../services/core/app/app.service';
@Component({
  selector: 'app-header',
  imports: [
    ProfileComponent,
    NgOptimizedImage,
    NgClass,
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  @Input() forceDark = false;

  constructor(protected appService: AppService) {}

  get isLightTheme(): boolean {
    if (this.forceDark) {
      return false;
    }
    return document.body.classList.contains('light-theme') || localStorage.getItem('theme') === 'light-theme';
  }
}
