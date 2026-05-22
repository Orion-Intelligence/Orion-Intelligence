import { Subscription } from 'rxjs';
import { MapEntityByIdItem } from '../../models/geo-fencing.models';
import { SatelliteFacilitiesService } from '../map-entities/facilities/facilities.service';

export class MapEntityDetailsState {
  private sub?: Subscription;

  isLoading = false;
  isOpen = false;
  data: MapEntityByIdItem[] = [];

  constructor(private facilitiesService: SatelliteFacilitiesService) {}

  destroy(): void {
    this.sub?.unsubscribe();
  }

  load(ids: string[]): void {
    if (this.isLoading) {
      return;
    }

    const normalizedIds = Array.from(new Set((ids || []).filter((id) => typeof id === 'string' && !!id.trim())));
    if (!normalizedIds.length) {
      return;
    }

    this.isLoading = true;
    this.sub?.unsubscribe();
    this.sub = this.facilitiesService.getMapEntitiesByIds(normalizedIds).subscribe({
      next: (response) => {
        this.data = Array.isArray(response?.Result) ? response.Result : [];
        this.isOpen = this.data.length > 0;
      },
      error: () => {
        this.data = [];
        this.isOpen = false;
      },
    });
    this.sub.add(() => {
      this.isLoading = false;
    });
  }

  close(): void {
    this.isOpen = false;
    this.data = [];
  }
}
