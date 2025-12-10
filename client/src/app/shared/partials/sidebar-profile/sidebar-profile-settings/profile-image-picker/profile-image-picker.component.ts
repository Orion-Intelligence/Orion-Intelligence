import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService} from '../../../../services/api.service';
import {AppService} from '../../../../../services/core/app/app.service';
import {AuthService} from '../../../../../services/authetication/auth.service';
import {NgIf} from '@angular/common';


@Component({
  selector: 'app-profile-image-picker',
  imports: [
    NgIf
  ],
  templateUrl: './profile-image-picker.component.html'
})
export class ProfileImagePickerComponent implements OnInit {
  @Input() userId!: string;
  @Output() onImageUploaded = new EventEmitter<string>();

  selectedFile?: File;
  previewUrl?: string;
  isUploading = false;

  constructor(private apiService: ApiService, protected appService: AppService, protected authService: AuthService) {
  }

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

    if (file.type !== 'image/png') {
      alert('Only PNG files are allowed.');
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

  uploadImage() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    if (this.isProfile()) {
      this.apiService.post('upload/image', formData).subscribe({
        next: (res) => {
          this.isUploading = false;
        },
        error: (err) => {
          this.isUploading = false;
          this.previewUrl = '';
          console.error(err);
          alert(err?.error?.detail || 'Upload image failed');
        },
      });
    } else if (this.isAdmin()) {

      this.apiService.post('upload/logo', formData).subscribe({
        next: (res) => {
          this.appService.loadConfig();
          this.isUploading = false;

        },
        error: (err) => {
          this.isUploading = false;
          this.previewUrl = '';
          console.error(err);
          alert(err?.error?.detail || 'Upload image failed');
        },
      });
    }
  }

  isProfile(): boolean {
    return this.authService.getRole() === 'profile'
  }

  isAdmin(): boolean {
    return this.authService.getRole() === 'admin'
  }

  protected readonly Date = Date;
}
