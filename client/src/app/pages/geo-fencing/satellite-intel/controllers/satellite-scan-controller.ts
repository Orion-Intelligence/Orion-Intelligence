import { Observable, Subscription } from 'rxjs';
import { SatelliteAnomalyResponse, SatelliteCompareResponse, SatelliteSentinelImageResult, SatelliteSentinelSearchResponse } from '../../../../shared/model/satellite-intel/satellite-intel-api.models';
import { SatelliteIntelService } from '../satellite-intel-service';
import { SatelliteIntelRequest, SatelliteIntelViewport } from '../satellite-intel.types';
import { AnomalyService } from '../ui-overlays/anomaly-section/anomaly.service';
import { MonthCompareService } from '../ui-overlays/month-compare-section/month-compare.service';
import { SentinelImageService } from '../ui-overlays/sentinel-image-section/sentinel-image.service';
import { SentinelSearchService } from '../ui-overlays/sentinel-search-section/sentinel-search.service';
import { SatelliteLoadingController } from './satellite-loading.controller';
import { SatelliteIntelRequestEnum } from '../../enums/geo-fencing.enums';

export class SatelliteScanController {
  private sub?: Subscription;
  private pendingRequest: SatelliteIntelRequest | null = null;

  hasSearched = false;
  anomalyResult: SatelliteAnomalyResponse['result'] | null = null;
  compareResult: SatelliteCompareResponse['result'] | null = null;
  sentinelImageResult: SatelliteSentinelImageResult | null = null;
  sentinelResults: SatelliteSentinelSearchResponse['result'] | null = null;

  constructor(private satelliteService: SatelliteIntelService, private loading: SatelliteLoadingController, private anomalyService: AnomalyService, private monthCompareService: MonthCompareService, private sentinelSearchService: SentinelSearchService, private sentinelImageService: SentinelImageService) {}

  destroy(): void {
    this.sub?.unsubscribe();
  }

  markSearched(): void {
    this.hasSearched = true;
  }

  isScanning(errorMessage: string | null | undefined): boolean {
    return !!this.pendingRequest && !errorMessage;
  }

  resetRequestState(): void {
    this.sub?.unsubscribe();
    this.sub = undefined;
    this.satelliteService.resetState();
    this.pendingRequest = null;
  }

  runAnomalyScan(viewport: SatelliteIntelViewport): void {
    this.anomalyResult = null;
    this.hasSearched = true;
    this.runSatelliteRequest(SatelliteIntelRequestEnum.Anomaly, 'Running anomaly scan...', this.anomalyService.runScan(viewport.lat, viewport.lon, viewport.delta), (result) => {
      this.anomalyResult = result;
    });
  }

  runCompare(viewport: SatelliteIntelViewport, imageType: string): void {
    this.compareResult = null;
    this.hasSearched = true;
    this.runSatelliteRequest(SatelliteIntelRequestEnum.Compare, 'Loading 3-month comparison...', this.monthCompareService.runCompare(viewport.lat, viewport.lon, viewport.delta, imageType), (result) => {
      this.compareResult = result;
    });
  }

  runSentinelSearch(viewport: SatelliteIntelViewport): void {
    this.sentinelResults = null;
    this.hasSearched = true;
    this.runSatelliteRequest(SatelliteIntelRequestEnum.Sentinel, 'Checking available Sentinel passes...', this.sentinelSearchService.search(viewport.lat, viewport.lon, viewport.delta), (result) => {
      this.sentinelResults = result;
    });
  }

  runSentinelImage(viewport: SatelliteIntelViewport, imageType: string, month: string, size: number): void {
    this.sentinelImageResult = null;
    this.hasSearched = true;
    this.runSatelliteRequest(SatelliteIntelRequestEnum.SentinelImage, 'Fetching Sentinel image...', this.sentinelImageService.fetchImage(viewport.lat, viewport.lon, viewport.delta, imageType, month, size), (result) => {
      this.sentinelImageResult = result || null;
    });
  }

  private runSatelliteRequest<T>(requestType: SatelliteIntelRequest, loadingMessage: string, request$: Observable<T>, applyResult: (result: any) => void): void {
    this.sub?.unsubscribe();
    this.satelliteService.resetState();
    this.pendingRequest = requestType;

    const loadingId = this.loading.begin('Loading Satellite Intel', loadingMessage);
    this.sub = request$.subscribe({
      next: (response) => {
        if (this.satelliteService.isPendingResponse(response)) {
          return;
        }

        const result = this.satelliteService.getResponseResult(response);
        if (result !== null && result !== undefined) {
          applyResult(result);
        }
        this.finishSatelliteRequest(loadingId);
      },
      error: () => {
        this.finishSatelliteRequest(loadingId);
      },
    });
    this.sub.add(() => this.loading.end(loadingId));
  }

  private finishSatelliteRequest(loadingId: number): void {
    this.pendingRequest = null;
    this.loading.end(loadingId);
  }
}
