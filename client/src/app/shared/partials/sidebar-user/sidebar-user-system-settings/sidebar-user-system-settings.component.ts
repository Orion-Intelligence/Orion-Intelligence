import { Component, OnInit } from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { UserImagePickerComponent } from "../sidebar-user-settings/user-image-picker/user-image-picker.component";
import { AppService } from '../../../../services/core/app/app.service';
import { AuthService } from '../../../../services/authetication/auth.service';
import { ConfigSettings } from '../../../model/app/config';

@Component({
  selector: 'app-sidebar-user-system-settings',
  imports: [FormsModule, NgIf, CommonModule, UserImagePickerComponent],
  templateUrl: './sidebar-user-system-settings.component.html',
  styleUrls: ['./sidebar-user-system-settings.component.css']
})
export class SidebarProfileSystemSettingsComponent implements OnInit {
  isEditing = false;

  systemData = {
    ai_endpoint: '',
    telegram_allowed: false,
    language_allowed: '',
    version: '',
    api_allowed: '0',
    app_name: '0'
  };

  form = {
    language: '',
    version: '',
    api_allowed: '0',
    app_name: '0',
    ai_endpoint: '',
    telegram_allowed: false
  };

  languageOptions = [
    'en', 'fr', 'es', 'de', 'it', 'pt', 'ru',
    'zh', 'ja', 'ko', 'ar', 'hi', 'bn',
    'tr', 'nl', 'sv', 'pl', 'cs'
  ];

  constructor(
    private apiService: ApiService,
    protected appService: AppService,
    protected authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings() {
    const settings = this.appService.configData()?.appSettings;
    if (!settings) return;

    this.systemData = settings as typeof this.systemData;
    this.form.language = settings.language_allowed;
    this.form.version = settings.version;
    this.form.api_allowed = settings.api_allowed;
    this.form.app_name = settings.app_name;
    this.form.ai_endpoint = settings.ai_endpoint;
    this.form.telegram_allowed = settings.telegram_allowed;
  }

  toggleEdit() {
    if (this.isEditing) this.save();
    this.isEditing = !this.isEditing;
  }

  cancelEdit() {
    this.form.language = this.systemData.language_allowed;
    this.form.version = this.systemData.version;
    this.form.api_allowed = this.systemData.api_allowed;
    this.form.app_name = this.systemData.app_name;
    this.form.ai_endpoint = this.systemData.ai_endpoint;
    this.form.telegram_allowed = this.systemData.telegram_allowed;
    this.isEditing = false;
  }

  updateUserResource(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.apiService.put('system/image', formData).subscribe();
  }

  deleteUserResource() {
    return this.apiService.delete('system/image').subscribe();
  }

  save() {
    this.apiService.post<any>('public/update', { settings: this.form }).subscribe({
      next: (response) => {
        if (response?.settings) {
          const current = this.appService.configData();
          this.appService.configData.set(
            new ConfigSettings(response.settings, current.localSettings)
          );

          const s = this.appService.configData()?.appSettings;
          if (s) {
            this.systemData = {
              ai_endpoint: s.ai_endpoint,
              telegram_allowed: s.telegram_allowed,
              language_allowed: s.language_allowed,
              version: s.version,
              api_allowed: s.api_allowed,
              app_name: s.app_name
            };
          }
        }
      },
      error: (err) => console.log(err)
    });
  }
}
