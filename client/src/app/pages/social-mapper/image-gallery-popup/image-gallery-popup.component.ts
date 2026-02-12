import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialImage } from '../../../shared/model/social/social-scan.models';

@Component({
  selector: 'app-image-gallery-popup',
  templateUrl: './image-gallery-popup.component.html',
  styleUrls: ['./image-gallery-popup.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
})
export class ImageGalleryPopupComponent {
  username = input.required<string>();
  images = input.required<SocialImage[]>();
  close = output<void>();

  onClose() {
    this.close.emit();
  }
}
