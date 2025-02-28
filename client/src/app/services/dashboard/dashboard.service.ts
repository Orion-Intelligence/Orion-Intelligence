import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SearchGeneralParamModel } from './models/search_general_param_model';
import { SearchGeneralCallbackModel } from './models/search_general_callback_model';
import { SearchLeakParamModel } from './models/search_leak_param_model';
import { SearchLeakCallbackModel } from './models/search_leak_callback_model';
import {SelectionTracker} from '../../pages/dashboard/helper-classes/SelectionTracker';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  searchGeneralParamModel: SearchGeneralParamModel = new SearchGeneralParamModel();
  searchGeneralCallbackModel: SearchGeneralCallbackModel = new SearchGeneralCallbackModel();

  searchLeakParamModel: SearchLeakParamModel = new SearchLeakParamModel();
  searchLeakCallbackModel: SearchLeakCallbackModel = new SearchLeakCallbackModel();

  searchQuery$ = new BehaviorSubject<string>('');
  tracker: SelectionTracker = new SelectionTracker();
}
