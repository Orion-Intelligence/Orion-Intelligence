import { Injectable } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import {ConfigData, ConfigSettings} from '../../shared/model/app/config';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private configData: ConfigData = new ConfigData();

  constructor(private apiService: ApiService) {
  }

  loadConfig(): void {
    this.apiService.get<ConfigData>('public').subscribe(response => {
      if (response && response.settings) {
        this.configData = new ConfigData(response);
      }
    });
  }

  getConfig(): ConfigSettings {
    return this.configData.settings;
  }
}
