import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SatelliteSentinelSearchResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class SentinelSearchService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  search(lat: number, lon: number, delta = 0.05): Observable<SatelliteSentinelSearchResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.api.post<SatelliteSentinelSearchResponse>('satellite/sentinel/search', { lat, lon, delta }),
      (res) => this.getPollStatus(res),
      3000,
      { trackState: true },);
  }

  private getPollStatus(res: SatelliteSentinelSearchResponse): string | undefined {
    return res?.result?.status || res?.status;
  }
}
