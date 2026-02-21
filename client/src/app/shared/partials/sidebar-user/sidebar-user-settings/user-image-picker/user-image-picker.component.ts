import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { NgClass, NgIf } from '@angular/common';
@Component({
  selector: 'app-user-image-picker',
  imports: [NgIf, NgClass],
  templateUrl: './user-image-picker.component.html'
})
export class UserImagePickerComponent implements OnInit, OnChanges {
  selectedFile?: File;
  selectedImage?: string;

  @Input() id!: string;
  @Input() imageUrl!: string;
  @Input() defaultImage: string = 'assets/images/tenant/logo_url_default.png';
  @Input() wide = false;

  @Output() onImageSelected = new EventEmitter<File>();
  @Output() onClear = new EventEmitter<string>();

  ngOnInit(): void {
    this.selectedImage = this.imageUrl || this.defaultImage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] || changes['defaultImage']) {
      this.selectedImage = this.imageUrl || this.defaultImage;
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
    this.onClear.emit(this.id);
    this.selectedFile = undefined;
    this.selectedImage = this.defaultImage;
    this.imageUrl = this.defaultImage;
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
