import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../services/api.service';
import { AppService } from '../../../../../services/core/app/app.service';


@Component({
  selector: 'app-profile-image-picker',
  imports: [],
  templateUrl: './profile-image-picker.component.html'
})
export class ProfileImagePickerComponent implements OnInit {
  @Input() userId!: string;
  @Output() onImageUploaded = new EventEmitter<string>();

  currentImageUrl: any;
  isHovering = false;
  selectedFile?: File;
  previewUrl?: string;
  isUploading = false;

  constructor(private apiService: ApiService, private appService: AppService) { this.currentImageUrl = this.appService.profileImageUrl(); }
  ngOnInit(): void {
  }
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const maxSize = 50 * 1024;
    if (file.size > maxSize) {
      alert('File too large! Please select an image under 50 KB.');
      return;
    }
    const validTypes = ['image/jpeg'];
    if (!validTypes.includes(file.type)) {
      alert('Invalid file type! Please upload a JPEG image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewUrl = e.target.result;
    };
    reader.readAsDataURL(file);
    this.selectedFile = file;
    this.appService.profileImageUrl = file;
    this.uploadImage();
  }

  // onFileSelected(event: any) {
  //   const file = event.target.files[0];
  //   if (!file) return;
  //   const maxSize = 50 * 1024;
  //   if (file.size > maxSize) {
  //     alert('File too large! Please select an image under 50 KB.');
  //     return;
  //   }
  //   if (!file.type.startsWith('image/')) {
  //     alert('Invalid file type! Please upload an image.');
  //     return;
  //   }
  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     const img = new Image();
  //     img.onload = () => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = img.width; canvas.height = img.height;
  //       const ctx = canvas.getContext('2d')!;
  //       ctx.drawImage(img, 0, 0);
  //       canvas.toBlob((blob) => {
  //         if (!blob) return; if (blob.size > maxSize) {
  //           alert('JPEG version too large! Try a smaller image.');
  //           return;
  //         }
  //         this.selectedFile = new File([blob], 'profile.jpeg', { type: 'image/jpeg' });
  //         this.previewUrl = URL.createObjectURL(this.selectedFile);
  //         this.uploadImage();
  //       }, 'image/jpeg', 0.9);
  //     };
  //     img.src = e.target.result;
  //   };
  //   reader.readAsDataURL(file);
  // }

  uploadImage() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);
    this.apiService.post('upload/image', formData).subscribe({
      next: () => {
      },
      error: (err) => {
        this.previewUrl = '';
        console.error(err);
        alert(err?.error?.detail || 'upload image fail');
      },
    });
  }
}
