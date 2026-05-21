import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SatelliteCompareResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class MonthCompareService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  runCompare(lat: number, lon: number, delta = 0.05, imageType = 'true_colour'): Observable<SatelliteCompareResponse> {
    return this.satelliteIntelService.createPolledRequest(() => this.api.post<SatelliteCompareResponse>('satellite/compare', { lat, lon, delta, image_type: imageType }),
      (res) => this.getPollStatus(res),
      3000,
      { trackState: true },);
  }

  private getPollStatus(res: SatelliteCompareResponse): string | undefined {
    return res?.result?.status || res?.status;
  }
}
