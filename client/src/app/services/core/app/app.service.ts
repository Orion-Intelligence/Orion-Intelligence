import { Injectable, Signal, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsModel, ConfigSettings, LocalSettingsModel } from '../../../shared/model/app/config';
import { AppStorageService } from './app-storage.service';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { license_rules, search_filter_labels } from '../../../shared/constants/shared-enums';
import { CompanyProfile } from '../../../shared/model/company-profile/company.profile.model';
import { TenantModel } from '../../../shared/model/tenant/tenant.model';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  public configData = signal<ConfigSettings>(new ConfigSettings());
  public page = signal<number>(1);

  public entities = signal<any[]>([]);

  private entitiesCache: any[] | null = null;

  public userProfile = signal<CompanyProfile>({
    companyName: '',
    email: '',
    phone: null,
    country: '',
    city: '',
    postalCode: '',
    taxId: ''
  });
  public tenantData = signal<TenantModel>({
    companyName: '',
    iocs: []
  });
  public profileImageUrl = signal<string | null>(null);

  constructor(private apiService: ApiService, private activatedRoute: ActivatedRoute, private router: Router, private appStorageService: AppStorageService, private http: HttpClient) {
    this.loadEntities()
    this.loadLicenseRules()
    this.activatedRoute.queryParams.subscribe(params => {
      const pageParam = +params['page'];
      if (!isNaN(pageParam)) this.updatePage(pageParam);
    });

    this.loadStaticConfig();
    this.appStorageService.setupWatcher(this.configData);
  }

  loadConfig(): void {
    this.apiService.get<any>('public').subscribe(response => {
      if (response?.settings) {
        const current = this.configData();
        this.configData.set(new ConfigSettings(response.settings, current.localSettings));
      }
    });
  }

  loadStaticConfig(): void {
    const current = this.configData();
    const newConfig = this.appStorageService.getStaticConfig(current.appSettings);
    this.configData.set(newConfig);
  }

  getConfig(): ConfigSettings {
    return this.configData();
  }

  set<T extends keyof (AppSettingsModel & LocalSettingsModel)>(key: T, value: (AppSettingsModel & LocalSettingsModel)[T]): void {
    this.configData.update(current => {
      const isAppSetting = key in current.appSettings;
      const updatedAppSettings = isAppSetting ? { ...current.appSettings, [key]: value } : current.appSettings;
      const updatedLocalSettings = !isAppSetting ? { ...current.localSettings, [key]: value } : current.localSettings;
      return new ConfigSettings(updatedAppSettings, updatedLocalSettings);
    });
  }

  updatePage(newPage: number): void {
    this.page.set(newPage);
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: { ...this.activatedRoute.snapshot.queryParams, page: newPage },
      replaceUrl: true
    }).then();
  }

  loadEntities(): void {
    if (this.entitiesCache) {
      this.entities.set(this.entitiesCache);
      return;
    }

    this.http.get<any[]>('assets/data/entities_data/entities.json').pipe(
      tap(data => {
        this.entitiesCache = data;
        this.entities.set(data);
        for (const e of data) {
          const key = `${e.key.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`)}`;
          search_filter_labels[key] = e.title;
        }
      })
    ).subscribe();
  }

  loadLicenseRules(): void {
    this.http.get<any>('assets/data/licenses/license_rules.json').pipe(
      tap(data => {
        for (const key in data) {
          license_rules[key] = data[key];
        }
      })
    ).subscribe();
  }

  clearAll(): void {
    this.appStorageService.clearStorage();
    this.configData.set(new ConfigSettings());
  }
}
