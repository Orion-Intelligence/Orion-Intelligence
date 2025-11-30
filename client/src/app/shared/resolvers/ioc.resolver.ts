import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, shareReplay, tap, map } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { AppService } from '../../services/core/app/app.service';
import { TenantModel } from '../model/tenant/tenant.model';

@Injectable({ providedIn: 'root' })
export class IocResolver implements Resolve<TenantModel> {
    private cache$?: Observable<TenantModel>;

    constructor(private apiService: ApiService, private appService: AppService) { }
    resolve(): Observable<TenantModel> {
        if (!this.cache$) {
            this.cache$ = this.apiService.post<TenantModel>('tenants/get', {}).pipe(
                tap(_tenantData => {
                    this.appService.tenantData.set(_tenantData);
                }),
                shareReplay(1),
                catchError(err => {
                    console.error('Failed to load tenant data iocs', err);
                    return of(null as any);
                })
            );
        }
        return this.cache$;
    }
}
