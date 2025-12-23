import {Injectable} from '@angular/core';
import {Resolve} from '@angular/router';
import {map, catchError, of, Observable} from 'rxjs';
import {ConfigSettings} from '../model/app/config';
import {ApiService} from '../services/api.service';
import {AppService} from '../../services/core/app/app.service';

@Injectable({ providedIn: 'root' })
export class ConfigResolver implements Resolve<boolean> {

  constructor(private appService: AppService, private apiService: ApiService) {}

  resolve(): Observable<boolean> {
    return this.apiService.get<any>('public').pipe(
      map(response => {
        if (response?.settings) {
          const current = this.appService.configData();
          this.appService.configData.set(
            new ConfigSettings(response.settings, current.localSettings)
          );
        }
        return true;
      }),
      catchError(() => of(false))
    );
  }
}
