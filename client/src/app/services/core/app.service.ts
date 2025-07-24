import { Injectable, signal, effect } from '@angular/core';
import { ApiService } from '../../shared/services/api.service';
import { ConfigData, ConfigSettings } from '../../shared/model/app/config';
import { ActivatedRoute, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public configData = signal<ConfigData>(new ConfigData());
  public page = signal<number>(1);
  private watchList: (keyof ConfigSettings)[] = ['enable_advanced_tools'];

  constructor(
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    this.activatedRoute.queryParams.subscribe(params => {
      const pageParam = params['mSearchParamPage'];
      if (pageParam && !isNaN(+pageParam)) {
        this.updatePage(+pageParam);
      }
    });

    this.loadStaticConfig()
    this.watchConfigSettings();
  }

  loadConfig(): void {
    this.apiService.get<ConfigData>('public').subscribe(response => {
      if (response && response.settings) {
        this.configData.set(new ConfigData(response));
      }
    });
  }

  loadStaticConfig(): void {
    const cfg = this.configData();
    cfg.settings.enable_advanced_tools = localStorage.getItem('enable_advanced_tools') === 'true';
    this.configData.set(cfg);
  }

  getConfig(): ConfigSettings {
    return this.configData().settings;
  }

  updatePage(newPage: number): void {
    this.page.set(newPage);
    const currentParams = { ...this.activatedRoute.snapshot.queryParams };
    currentParams['mSearchParamPage'] = newPage;
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: currentParams,
      replaceUrl: true
    }).then();
  }

  watchConfigSettings(): void {
    let prevValues: Partial<Record<keyof ConfigSettings, any>> = {};
    this.watchList.forEach(key => {
      prevValues[key] = this.configData().settings[key];
    });

    effect(() => {
      const current = this.configData().settings;
      this.watchList.forEach(key => {
        const newValue = current[key];
        if (newValue !== prevValues[key]) {
          localStorage.setItem(key, typeof newValue === 'boolean' ? (newValue ? 'true' : 'false') : String(newValue));
          prevValues[key] = newValue;
        }
      });
    });
  }
}
