import {Component, OnInit} from '@angular/core';
import { NgIf, CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { ProfileImagePickerComponent } from "../sidebar-profile-settings/profile-image-picker/profile-image-picker.component";
import { AppService } from '../../../../services/core/app/app.service';

@Component({
  selector: 'app-sidebar-profile-system-settings',
  imports: [ProfileImagePickerComponent, FormsModule, NgIf, CommonModule],
  templateUrl: './sidebar-profile-system-settings.component.html',
  styleUrls: ['./sidebar-profile-system-settings.component.css']
})
export class SidebarProfileSystemSettingsComponent implements OnInit{
  isEditing = false;

  systemData = {
    ai_endpoint: '',
    telegram_allowed: false,
    language_allowed: '',
    version: '',
    logo_url: '',
    api_allowed: '0'
  };

  form = {
    language: '',
    version: '',
    logo_url: '',
    api_allowed: '0',
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
  ) {}

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
    this.form.ai_endpoint = this.systemData.ai_endpoint;
    this.form.telegram_allowed = this.systemData.telegram_allowed;
    this.isEditing = false;
  }

  save() {
    this.appService.configData.update(cfg => {
      cfg.appSettings.logo_url = this.form.logo_url;
      return cfg;
    });

    this.apiService.post('public/update', { settings: this.form }).subscribe({
      next: () => this.appService.loadConfig(),
      error: (err) => console.log(err)
    });
  }

  clearLogo() {
    this.appService.configData.update(cfg => {
      cfg.appSettings.logo_url = "";
      return cfg;
    });

    this.apiService.post('public/update', { settings: { logo_url: '' } }).subscribe({
      next: () => {
        this.systemData.logo_url = '';
        this.appService.loadConfig();
      },
      error: (err) => console.log(err)
    });
  }
}
