import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SatelliteSentinelImageResponse } from '../../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { ApiService } from '../../../../../shared/services/api.service';
import { SatelliteIntelService } from '../../satellite-intel-service';

@Injectable({ providedIn: 'root' })
export class SentinelImageService {
  constructor(private api: ApiService, private satelliteIntelService: SatelliteIntelService) {}

  fetchImage(lat: number, lon: number, delta = 0.05, imageType = 'true_colour', month?: string, size = 512): Observable<SatelliteSentinelImageResponse> {
    const payload: Record<string, any> = { lat, lon, delta, image_type: imageType, size };
    if (month?.trim()) {
      payload['month'] = month.trim();
    }
    return this.satelliteIntelService.createPolledRequest(() => this.api.post<SatelliteSentinelImageResponse>('satellite/sentinel/image', payload),
      (res) => this.getPollStatus(res),
      3000,
      { trackState: true },);
  }

  private getPollStatus(res: SatelliteSentinelImageResponse): string | undefined {
    return res?.result?.status || res?.status;
  }
}
