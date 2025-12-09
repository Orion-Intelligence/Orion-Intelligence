import { Component } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { ProfileImagePickerComponent } from "../sidebar-profile-settings/profile-image-picker/profile-image-picker.component";
import { AppService } from '../../../../services/core/app/app.service';

@Component({
  selector: 'app-sidebar-profile-system-settings',
  imports: [ProfileImagePickerComponent, FormsModule, NgIf, CommonModule],
  templateUrl: './sidebar-profile-system-settings.component.html'
})
export class SidebarProfileSystemSettingsComponent {
  isEditing = false;

  systemData = {
    language_allowed: '',
    version: '',
    api_allowed: '0'
  };

  form = {
    language: '',
    version: '',
    api_allowed: '0'
  };

  languageOptions = [
    'en', 'fr', 'es', 'de', 'it', 'pt', 'ru',
    'zh', 'ja', 'ko', 'ar', 'hi', 'bn',
    'tr', 'nl', 'sv', 'pl', 'cs'
  ];

  constructor(private apiService: ApiService, protected appService: AppService) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    const settings = this.appService.configData()?.appSettings;

    if (!settings) {
      return;
    }

    this.systemData = settings;

    this.form.language = settings.language_allowed;
    this.form.version = settings.version;
    this.form.api_allowed = settings.api_allowed;
  }

  toggleEdit() {
    if (this.isEditing) {
      this.save();
    }
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.form.language = this.systemData.language_allowed;
    this.form.api_allowed = this.systemData.api_allowed;
    this.isEditing = false;
  }

  save() {
    this.apiService.post('public/update', this.form).subscribe({
      next: () => {
        this.appService.loadConfig();
      },
      error: (err) => {
        console.log(err)
      },
    });
  }
}
