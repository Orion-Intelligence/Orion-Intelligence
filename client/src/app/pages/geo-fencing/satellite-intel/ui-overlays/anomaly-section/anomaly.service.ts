import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SatelliteAnomalyResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class AnomalyService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  runScan(lat: number, lon: number, delta = 0.05, shClientId?: string, shClientSecret?: string): Observable<SatelliteAnomalyResponse> {
    const payload: Record<string, any> = { lat, lon, delta };
    if (shClientId) {
      payload['sh_client_id'] = shClientId;
    }
    if (shClientSecret) {
      payload['sh_client_secret'] = shClientSecret;
    }
    return this.satelliteIntelService.createPolledRequest(() => this.api.post<SatelliteAnomalyResponse>('satellite/anomaly', payload),
      (res) => this.getPollStatus(res),
      4000,
      { trackState: true },);
  }

  private getPollStatus(res: SatelliteAnomalyResponse): string | undefined {
    return res?.result?.status || res?.status;
  }
}
