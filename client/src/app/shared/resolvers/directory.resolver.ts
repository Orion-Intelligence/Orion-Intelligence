import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { DirectoryData } from '../model/directory';
import {DirectoryService} from '../../services/dashboard/directory.service';

@Injectable({ providedIn: 'root' })
export class DirectoryResolver implements Resolve<DirectoryData> {
  constructor(private apiService: ApiService, private directoryService: DirectoryService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DirectoryData> {
    return this.apiService.get<DirectoryData>('directory').pipe(
      tap((data) => this.directoryService.setDirectoryData(data))
    );
  }
}
