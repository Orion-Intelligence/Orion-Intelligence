import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from '../services/api.service';
import { DirectoryCallbackModel } from '../model/directory/directory.model';
import { DirectoryService } from '../../services/directory/directory.service';

@Injectable({ providedIn: 'root' })
export class DirectoryResolver implements Resolve<DirectoryCallbackModel> {
  constructor(private apiService: ApiService, private directoryService: DirectoryService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DirectoryCallbackModel> {
    return this.apiService.get<DirectoryCallbackModel>('directory').pipe(
      tap((data) => this.directoryService.setDirectoryData(data))
    );
  }
}
