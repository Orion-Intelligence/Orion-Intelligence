import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { BehaviorSubject } from 'rxjs';
import { audit_filters } from '../../../shared/constants/filters';
import { AuditlogListComponent } from './auditlog-list/auditlog-list.component';
import { AuditLogCallbackModel } from '../../../shared/model/auditlog/auditlog.model';
import { AuditlogService } from '../../../services/auditlog/auditlog.service';
import { BaseListingComponent } from '../../../shared/directive/base.listing.directive';
@Component({
  selector: 'app-auditlog',
  imports: [FormsModule, PaginationComponent, AsyncPipe, AuditlogListComponent, FiltersComponent, NgOptimizedImage],
  templateUrl: './auditlog.component.html'
})
export class AuditlogComponent extends BaseListingComponent<AuditLogCallbackModel> {
  private auditService = inject(AuditlogService);
  private filterOpenSubject = new BehaviorSubject<boolean>(false);

  protected data$ = this.auditService.auditData$;
  protected service = this.auditService;

  filterModel = audit_filters;
  isFilterOpen$ = this.filterOpenSubject.asObservable();

  openSidebar() {
    this.filterOpenSubject.next(true); 
  }

  closeSidebar() {
    this.filterOpenSubject.next(false); 
  }
}
