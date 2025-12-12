import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {ApiService} from '../../../../services/api.service';
import {AppService} from '../../../../../services/core/app/app.service';
import {AuthService} from '../../../../../services/authetication/auth.service';
import {NgIf} from '@angular/common';
import * as path from 'node:path';


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
  previewSystemUrl?: string;
  isUploading = false;
  isDefaultImage = true;

  constructor(private apiService: ApiService, protected appService: AppService, protected authService: AuthService) {
  }

  ngOnInit(): void {
    fetch(`/api/s/static/${this.appService.userProfile().preferences?.['userId']}`)
      .then(res => {
        console.log([...res.headers.entries()]);
        this.isDefaultImage = res.headers.get('x-default-image') === 'true';

        return res.blob();
      })
      .then(blob => {
        this.previewUrl = URL.createObjectURL(blob);
      });
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
    this.uploadImage();
  }

  uploadImage() {
    if (!this.selectedFile) return;
    this.isUploading = true;
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    if (this.isAdmin()) {
      this.apiService.post('upload/system', formData).subscribe({
        next: (res) => {
          this.appService.loadConfig();
          this.isUploading = false;
          this.previewSystemUrl = "/api/s/static/system/logo" + "?stamp=" + Math.random().toString(36).substring(2)
        },
        error: (err) => {
          this.isUploading = false;
          this.previewUrl = '';
          console.error(err);
        },
      });
    }
    else if (this.isProfile()) {
      this.apiService.post('upload/image', formData).subscribe({
        next: (res) => {
          this.isDefaultImage = false
          this.isUploading = false;
          this.previewUrl = `/api/s/static/${this.appService.userProfile().preferences?.['userId']}` + "?stamp=" + Math.random().toString(36).substring(2)
        },
        error: (err) => {
          this.isUploading = false;
          this.previewUrl = '';
          console.error(err);
        },
      });
    }
  }

  isProfile(): boolean {
    return window.location.pathname.includes('/profile/account');
  }

  isAdmin(): boolean {
    return window.location.pathname.includes('/system-settings');
  }

  clearLogo() {
    let resource_path=""
    if(this.isProfile()){
      resource_path = "delete/profile/image"
      this.apiService.post(resource_path, { settings: { logo_url: '' } }).subscribe({
        next: () => {
          this.isDefaultImage = true
          this.previewUrl = `/api/s/static/${this.appService.userProfile().preferences?.['userId']}` + "?stamp=" + Math.random().toString(36).substring(2)
        },
        error: (err) => console.log(err)
      });

    }else {
      resource_path = "public/update"
      this.appService.configData.update(cfg => {
        cfg.appSettings.logo_url = "";
        return cfg;
      });
      this.apiService.post(resource_path, { settings: { logo_url: '' } }).subscribe({
        next: () => {
          this.appService.loadConfig();
        },
        error: (err) => console.log(err)
      });
    }
  }

  protected readonly Date = Date;
}
