import { Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AppSettingsModel, ConfigSettings, LocalSettingsModel } from '../../../shared/model/app/config';
import { AppStorageService } from './app-storage.service';
import { ApiService } from '../../../shared/services/api.service';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { license_rules, search_filter_labels } from '../../../shared/constants/shared-enums';
import { userSessionData } from '../../../shared/model/company-profile/node.model';
import { TenantModel } from '../../../shared/model/tenant/tenant.model';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DemoTourConfig } from '../../../shared/model/demo-tour/demo.tour.model';
@Injectable({
  providedIn: 'root'
})
export class AppService {
  private entitiesCache: any[] | null = null;
  private sessionLoadPromise: Promise<void> | null = null;
  private demoTourLoadPromise: Promise<void> | null = null;

  public configData = signal<ConfigSettings>(new ConfigSettings());
  public page = signal<number>(1);
  public entities = signal<any[]>([]);
  public worldJson = signal<any>(null);
  public demoTourConfig = signal<DemoTourConfig>({});
  public userSessionData = signal<userSessionData>(this.createEmptyUserSessionData());
  public tenantData = signal<TenantModel>({
    name: '',
    iocs: []
  });
  public userImageUrl = signal<string | null>(null);

  private createEmptyUserSessionData(): userSessionData {
    return {
      user: {
        email: '',
        twofa_enabled: false,
        username: '',
        role: '',
        status: '',
        subscription: false,
        verificationDate: '',
        license: [],
        demo_tour:false,
      },
      tenant: {
        id: '',
        name: '',
        phone: '',
        isDefault: false,
        hasOnboarding: false,
        country: '',
        city: '',
        postalCode: '',
        taxId: '',
        userId: '',
        licenses: [],
        assignedQuota: '0',
        quotaExceeded: false
      },
      alerts: [],
      alert_summary: {
        unseen_total: 0,
        counts_by_type: {},
        counts_by_risk: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        }
      }
    };
  }

  constructor(private title: Title, private apiService: ApiService, private activatedRoute: ActivatedRoute, private router: Router, private appStorageService: AppStorageService, private http: HttpClient) {
    this.loadEntities();
    this.loadLicenseRules();
    this.loadWorldJson();
    this.loadDemoTourConfig();
    this.activatedRoute.queryParams.subscribe(params => {
      const pageParam = +params['page'];
      if (!isNaN(pageParam)) {
        this.updatePage(pageParam);
      }
    });
    this.loadStaticConfig();
    this.appStorageService.setupWatcher(this.configData);
  }

  async loadSession(forced = false): Promise<void> {
    if (this.sessionLoadPromise) {
      return this.sessionLoadPromise;
    }

    let token = localStorage.getItem('token');
    if (token || forced) {
      this.sessionLoadPromise = (async () => {
        try {
          const session = await firstValueFrom(this.apiService.post<userSessionData>('get/tenant/node', {}));
          if (session) {
            this.userSessionData.set(session);
          }
        }
        catch {
          this.userSessionData.set(this.createEmptyUserSessionData());
        }
        finally {
          this.sessionLoadPromise = null;
        }
      })();
      return this.sessionLoadPromise;
    }
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
      this.updateFavicon(current.appSettings.logo_url);
      return new ConfigSettings(updatedAppSettings, updatedLocalSettings);
    });
  }

  public updateFavicon(url: string = '/api/s/static/system/logo.png'): void {
    (document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
            document.head.appendChild(Object.assign(document.createElement('link'), { rel: 'icon' }))).href = url;
  }

  updatePage(newPage: number): void {
    this.page.set(newPage);
    this.router
      .navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: { ...this.activatedRoute.snapshot.queryParams, page: newPage },
        replaceUrl: true
      })
      .then();
  }

  loadEntities(): void {
    if (this.entitiesCache) {
      this.entities.set(this.entitiesCache);
      return;
    }
    this.http
      .get<any[]>('assets/data/entities_data/entities.json')
      .pipe(tap(data => {
        this.entitiesCache = data;
        this.entities.set(data);
        for (const e of data) {
          const key = `${e.key.replace(/[A-Z]/g, (c: string) => `_${c.toLowerCase()}`)}`;
          search_filter_labels[key] = e.title;
        }
      }))
      .subscribe();
  }

  loadLicenseRules(): void {
    this.http
      .get<any>('assets/data/licenses/license_rules.json')
      .pipe(tap(data => {
        for (const key in data) {
          license_rules[key] = data[key];
        }
      }))
      .subscribe();
  }

  loadWorldJson(): void {
    this.http
      .get<any>('assets/data/map/world.json')
      .pipe(tap(data => {
        this.worldJson.set(data);
      }))
      .subscribe();
  }

  loadDemoTourConfig(): Promise<void> {
    if (this.demoTourLoadPromise) {
      return this.demoTourLoadPromise;
    }

    this.demoTourLoadPromise = firstValueFrom(this.http.get<DemoTourConfig>('assets/data/demo_tour/demo_tour.json'))
      .then(data => {
        this.demoTourConfig.set(data || {});
      })
      .catch(() => {
        this.demoTourConfig.set({});
      })
      .finally(() => {
        this.demoTourLoadPromise = null;
      });

    return this.demoTourLoadPromise;
  }

  clearAll(): void {
    this.appStorageService.clearStorage();
    this.configData.set(new ConfigSettings());
    this.userImageUrl.set(null);
    this.userSessionData.set(this.createEmptyUserSessionData());
  }

  isMobileMode(): boolean {
    return this.activatedRoute.snapshot.queryParamMap.get('mode') === 'free';
  }

  setOnboardingStatus(value: boolean) {
    this.userSessionData.update(state => {
      if (!state) {
        return state;
      }
      localStorage.setItem('onboarding', String(value));
      return {
        ...state,
        tenant: {
          ...state.tenant,
          hasOnboarding: value
        }
      };
    });
  }
}
