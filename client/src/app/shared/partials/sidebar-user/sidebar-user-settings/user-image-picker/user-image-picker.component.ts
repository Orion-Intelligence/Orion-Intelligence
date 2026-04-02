import { Component, OnChanges, OnInit, SimpleChanges, effect, input, output } from '@angular/core';
import { NgClass } from '@angular/common';
@Component({
  selector: 'app-user-image-picker',
  imports: [NgClass],
  templateUrl: './user-image-picker.component.html'
})
export class UserImagePickerComponent implements OnInit, OnChanges {
  readonly imageUrlInput = input<string | undefined>(undefined, { alias: 'imageUrl' });
  selectedFile?: File;
  selectedImage?: string;
  readonly id = input('');
  imageUrl!: string;
  readonly defaultImage = input<string>('assets/images/tenant/logo_url_default.png');
  readonly wide = input(false);
  readonly onImageSelected = output<File>();
  readonly onClear = output<string>();

  constructor() {
    effect(() => {
      const imageUrl = this.imageUrlInput();
      if (imageUrl !== undefined) {
        this.imageUrl = imageUrl;
      }
    });
  }

  ngOnInit(): void {
    this.selectedImage = this.imageUrl || this.defaultImage();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] || changes['defaultImage']) {
      this.selectedImage = this.imageUrl || this.defaultImage();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    this.selectedFile = file;
    this.onImageSelected.emit(file);
  }

  deleteImage(event?: Event) {
    event?.stopPropagation();
    this.onClear.emit(this.id());
    this.selectedFile = undefined;
    this.selectedImage = this.defaultImage();
    this.imageUrl = this.defaultImage();
  }

  hasCustomImage(): boolean {
    const image = this.selectedImage || this.imageUrl || '';
    if (!image) {
      return false;
    }
    const defaults = [
      'default.png',
      '/default',
      'logo_url_default.png',
      'logo_wide_light_default.png',
      'logo_wide_dark_default.png'
    ];
    return !defaults.some(token => image.endsWith(token));
  }
}
