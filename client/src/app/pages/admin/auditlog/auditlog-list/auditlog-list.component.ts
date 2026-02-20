import { Component, Input } from '@angular/core';
import { AsyncPipe, DatePipe, NgForOf, NgIf } from '@angular/common';
import { Observable } from 'rxjs';
import { AuditLogCallbackModel } from '../../../../shared/model/auditlog/auditlog.model';
import { AuditlogService } from '../../../../services/auditlog/auditlog.service';
import { fadeInDashboardItem } from '../../../../shared/animations/dashboard.item.animation';
@Component({
  selector: 'app-auditlog-list',
  imports: [AsyncPipe, DatePipe, NgForOf, NgIf],
  templateUrl: './auditlog-list.component.html',
  animations: [fadeInDashboardItem],
})
export class AuditlogListComponent {
  @Input() isLoading = true;
  auditData$: Observable<AuditLogCallbackModel | null>;

  constructor(public auditService: AuditlogService) {
    this.auditData$ = this.auditService.auditData$;
  }

  get currentPage$() {
    return this.auditService.currentPage$;
  }
}
