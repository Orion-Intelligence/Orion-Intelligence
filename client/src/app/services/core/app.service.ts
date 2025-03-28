import {Injectable, signal} from '@angular/core';
import {ApiService} from '../../shared/services/api.service';
import {ConfigData, ConfigSettings} from '../../shared/model/app/config';
import {ActivatedRoute, Router} from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  private configData: ConfigData = new ConfigData();
  public page = signal<number>(1);

  constructor(private apiService: ApiService, private activatedRoute: ActivatedRoute, private router: Router) {
    this.activatedRoute.queryParams.subscribe(params => {
      const pageParam = params['mSearchParamPage'];
      if (pageParam && !isNaN(+pageParam)) {
        this.updatePage(+pageParam);
      }
    });
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

  updatePage(newPage: number): void {
    this.page.set(newPage);
    const currentParams = {...this.activatedRoute.snapshot.queryParams};
    currentParams['mSearchParamPage'] = newPage;
    this.router.navigate([], {
      relativeTo: this.activatedRoute, queryParams: currentParams, replaceUrl: true
    }).then();
  }
}
