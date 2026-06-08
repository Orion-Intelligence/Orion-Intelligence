import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, NgClass, NgOptimizedImage } from '@angular/common';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { audit_filters } from '../../../shared/constants/filters';
import { AuditlogListComponent } from './auditlog-list/auditlog-list.component';
import { AuditLogCallbackModel } from '../../../shared/model/auditlog/auditlog.model';
import { AuditlogService } from '../../../services/auditlog/auditlog.service';
import { BaseListingComponent } from '../../../shared/directive/base.listing.directive';
import { HelperService } from '../../../shared/services/helper.service';
import { take } from 'rxjs/operators';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-auditlog',
  imports: [FormsModule, PaginationComponent, AsyncPipe, AuditlogListComponent, FiltersComponent, NgOptimizedImage, NgClass, TranslatePipe],
  templateUrl: './auditlog.component.html'
})
export class AuditlogComponent extends BaseListingComponent<AuditLogCallbackModel> {
  private auditService = inject(AuditlogService);
  private helperService = inject(HelperService);
  private sidebarService = inject(SidebarService);

  protected data$ = this.auditService.auditData$;
  protected service = this.auditService;

  filterModel = audit_filters;
  isFilterOpen$ = this.sidebarService.sidebarState$;
  selectedActor = '';
  sidebarReady = false;

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sidebarReady = true;
    });
  }

  openSidebar() {
    this.sidebarService.openSidebar();
  }

  closeSidebar() {
    this.sidebarService.closeSidebar();
  }

  onActorChange() {
    this.selectedFilters = { ...this.selectedFilters, actor_id: this.selectedActor || null };
    this.reload();
  }

  exportAuditLogs() {
    this.auditService.auditData$.pipe(take(1)).subscribe(data => {
      const items = data?.items || [];
      if (!items.length) {
        return;
      }
      const page = data?.page || 1;
      const rows = items.map((item, index) => ({
        id: index + 1 + (page - 1) * 100,
        timestamp: item.ts,
        actor: item.actor_id,
        tenant: item.tenant_id,
        event: item.event
      }));
      this.helperService.downloadAsCSV(rows);
    });
  }
}
