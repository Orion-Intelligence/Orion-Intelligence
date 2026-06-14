import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private requestLoading = false;
  private routeLoading = false;

  loading$ = this.loadingSubject.asObservable();

  show() {
    this.requestLoading = true;
    this.updateLoadingState();
  }

  hide() {
    this.requestLoading = false;
    this.updateLoadingState();
  }

  setRouteLoading(isLoading: boolean) {
    this.routeLoading = isLoading;
    this.updateLoadingState();
  }

  private updateLoadingState() {
    this.loadingSubject.next(this.requestLoading || this.routeLoading);
  }
}
