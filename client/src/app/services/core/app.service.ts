import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {config_data} from './model/config_data';
import {ApiService} from '../../shared/services/api.service';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private configDataSubject = new BehaviorSubject<config_data | null>(null);
  configData$ = this.configDataSubject.asObservable();

  constructor(private apiService: ApiService) {}

  loadConfig(): void {
    this.apiService.get<config_data>('public').subscribe(config => {
      this.configDataSubject.next(config);
    });
  }

  getConfig(): config_data | null {
    return this.configDataSubject.getValue();
  }
}
