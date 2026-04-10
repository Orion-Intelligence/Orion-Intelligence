import { Component, input } from '@angular/core';
import { AsyncPipe, DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { AuditLogCallbackModel } from '../../../../shared/model/auditlog/auditlog.model';
import { AuditlogService } from '../../../../services/auditlog/auditlog.service';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
@Component({
  selector: 'app-auditlog-list',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './auditlog-list.component.html',
  animations: [fadeInDashboardItem],
})
export class AuditlogListComponent {
  auditData$: Observable<AuditLogCallbackModel | null>;
  readonly isLoading = input(true);

  constructor(public auditService: AuditlogService) {
    this.auditData$ = this.auditService.auditData$;
  }

  get currentPage$() {
    return this.auditService.currentPage$;
  }
}
