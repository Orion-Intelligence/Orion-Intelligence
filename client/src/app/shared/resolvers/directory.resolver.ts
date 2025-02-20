import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import {ApiService} from '../services/api.service';
import {DirectoryApiCallbackModel} from '../model/directory';

@Injectable({ providedIn: 'root' })
export class DirectoryResolver implements Resolve<any> {
  constructor(private apiService: ApiService) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<DirectoryApiCallbackModel> {
    return this.apiService.get<DirectoryApiCallbackModel>('directory');
  }
}
