import { Injectable } from '@angular/core';
import { Observable, concat, of, timer } from 'rxjs';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { ApiEnvelope, PlatformResult, ScanEvent } from '../models/social-scan.models';

@Injectable({ providedIn: 'root' })
export class SocialScanService {
  constructor(private api: ApiService) {}

  performScan(username: string): Observable<ScanEvent> {
    const result$ = timer(1000, 2000).pipe(switchMap(() => this.api.post<ApiEnvelope<PlatformResult[]>>('social/recon', { query: username })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ type: 'complete', payload: Array.isArray(response.result) ? response.result : [] }) as ScanEvent));
    return concat(of<ScanEvent>({ type: 'progress', payload: { progress: 10, step: 'Submitting job to API...' } }), result$);
  }

  performImageScan(base64Image: string): Observable<ScanEvent> {
    const result$ = timer(2000, 3000).pipe(switchMap(() => this.api.post<ApiEnvelope<PlatformResult[]>>('social/recon/image', { image_base64: base64Image })),
      filter(response => !!response && 'result' in response),
      take(1),
      map(response => ({ type: 'complete', payload: Array.isArray(response.result) ? response.result : [] }) as ScanEvent));
    return concat(of<ScanEvent>({ type: 'progress', payload: { progress: 10, step: 'Submitting image to API...' } }), result$);
  }
}
