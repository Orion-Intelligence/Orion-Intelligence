import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private sidebarStateSubject = new BehaviorSubject<boolean>(false);
  sidebarState$ = this.sidebarStateSubject.asObservable();

  openSidebar(): void {
    this.sidebarStateSubject.next(true);
  }

  closeSidebar(): void {
    this.sidebarStateSubject.next(false);
  }
}
