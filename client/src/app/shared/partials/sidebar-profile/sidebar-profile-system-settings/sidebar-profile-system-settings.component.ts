import { Component } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { ProfileImagePickerComponent } from "../sidebar-profile-settings/profile-image-picker/profile-image-picker.component";

@Component({
  selector: 'app-sidebar-profile-system-settings',
  imports: [ProfileImagePickerComponent, FormsModule, NgIf, CommonModule],
  templateUrl: './sidebar-profile-system-settings.component.html'
})
export class SidebarProfileSystemSettingsComponent {
  isEditing = false;

  systemData = {
    language: '',
    version: '',
    apiAllowed: '0'
  };

  form = {
    language: '',
    version: '',
    apiAllowed: '0'
  };

  languageOptions = [
    'en', 'fr', 'es', 'de', 'it', 'pt', 'ru',
    'zh', 'ja', 'ko', 'ar', 'hi', 'bn',
    'tr', 'nl', 'sv', 'pl', 'cs'
  ];

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    const baseUrl = 'system-settings';
    this.apiService.get<any>(baseUrl).subscribe(data => {
      this.systemData = data;

      this.form.language = data.language;
      this.form.version = data.version;
      this.form.apiAllowed = data.apiAllowed;
    });
  }

  toggleEdit() {
    if (this.isEditing) {
      this.save();
    }
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.form.language = this.systemData.language;
    this.form.apiAllowed = this.systemData.apiAllowed;
    this.isEditing = false;
  }

  save() {
    // this.systemService.updateSystemSettings({
    //   language_allowed: this.form.language,
    //   api_allowed: this.form.apiAllowed
    // }).subscribe(() => {
    //   this.loadSettings();
    // });
  }
}
