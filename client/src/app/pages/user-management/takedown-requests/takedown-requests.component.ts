import { AsyncPipe, DatePipe, NgClass, NgOptimizedImage } from '@angular/common';
import { AfterViewInit, Component, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../../shared/services/api.service';
import { FiltersComponent } from '../../../shared/partials/filters/filters.component';
import { PaginationComponent } from '../../../shared/partials/pagination/pagination.component';
import { takedown_filters } from '../../../shared/constants/filters';
import { SidebarService } from '../../../shared/services/sidebar.service';
import { DashboardService } from '../../../services/dashboard/dashboard.service';
import { LicenseService } from '../../../services/licenses/licenses.service';
import { AppService } from '../../../services/core/app/app.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { TakedownFilter, TakedownListResponse, TakedownRequestItem } from '../../../shared/model/takedown/takedown.model';
import { Observable } from 'rxjs';
import { TakedownRejectionPopupComponent } from './takedown-rejection-popup/takedown-rejection-popup.component';
import { TakedownActionComponent } from '../../../shared/partials/takedown-action/takedown-action.component';

@Component({
  selector: 'app-takedown-requests',
  standalone: true,
  imports: [FormsModule, DatePipe, NgClass, NgOptimizedImage, AsyncPipe, FiltersComponent, PaginationComponent, TranslatePipe, TakedownRejectionPopupComponent, TakedownActionComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './takedown-requests.component.html'
})
export class TakedownRequestsComponent implements OnInit, AfterViewInit {
  items: TakedownRequestItem[] = [];
  status: TakedownFilter = 'all';
  selectedFilters: Record<string, string | null> = {};
  filterModel = structuredClone(takedown_filters);
  isFilterOpen$: Observable<boolean>;
  sidebarReady = false;
  query = '';
  page = 1;
  limit = 100;
  total = 0;
  loading = false;
  actionId = '';
  error = '';
  rejectionTarget: TakedownRequestItem | null = null;
  unreadMailsCount = 0;
  mailAccountStatus: { configured: boolean; mailbox_address?: string; mailbox_exists?: boolean } | null = null;
  checkingMailStatus = false;

  constructor(private apiService: ApiService, public sidebarService: SidebarService, private dashboardService: DashboardService, private licenseService: LicenseService, private appService: AppService, private router: Router) {
    this.isFilterOpen$ = this.sidebarService.sidebarState$;
  }

  ngOnInit(): void {
    if (!this.licenseService.canReviewTakedowns()) {
      this.router.navigate(['/dashboard/profile/homepage']).then();
      return;
    }

    this.dashboardService.selectedFilters.set({});
    this.load();
    this.loadUnreadMailsCount();
    this.loadMailAccountStatus();
  }

  @HostListener('window:focus')
  onWindowFocus(): void {
    if (this.mailAccountStatus && !this.mailAccountStatus.configured) {
      this.loadMailAccountStatus();
      this.loadUnreadMailsCount();
    }
  }

  loadMailAccountStatus(): void {
    this.checkingMailStatus = true;
    this.apiService.get<{ configured: boolean; mailbox_address?: string; mailbox_exists?: boolean }>('takedowns/mail-account-status').subscribe({
      next: res => {
        this.mailAccountStatus = res;
        this.checkingMailStatus = false;
      },
      error: () => {
        this.mailAccountStatus = { configured: false };
        this.checkingMailStatus = false;
      }
    });
  }

  loadUnreadMailsCount(): void {
    this.apiService.get<{ unread_count: number }>('takedowns/unread-mails-count').subscribe({
      next: res => {
        this.unreadMailsCount = res?.unread_count ?? 0;
      },
      error: () => {
        this.unreadMailsCount = 0;
      }
    });
  }

  openTakedownMailbox(): void {
    const mailUrl = this.appService.getConfig().appSettings.orion_mail_url.trim();
    if (!mailUrl) {
      return;
    }
    const tenantId = this.appService.userSessionData()?.tenant?.id ?? '';
    const login = new URL('/api/auth/login', mailUrl);
    const mailHost = login.hostname;
    const isDefaultTenant = this.appService.userSessionData()?.tenant?.isDefault;
    if (!isDefaultTenant && mailHost.startsWith('mail.')) {
      const parent = mailHost.slice('mail.'.length);
      const intelHost = window.location.hostname;
      if (intelHost !== parent && intelHost.endsWith(`.${parent}`)) {
        const slug = intelHost.slice(0, intelHost.length - parent.length - 1);
        if (slug && !slug.includes('.')) {
          login.hostname = `${slug}${mailHost}`;
        }
      }
    }
    const params: Record<string, string> = {
      origin: login.origin,
      orion_origin: window.location.origin,
      return_to: '/inbox'
    };
    if (tenantId) {
      params.tenant_id = tenantId;
    }
    login.search = new URLSearchParams(params).toString();
    window.open(login.toString(), '_blank', 'noopener,noreferrer');
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.sidebarReady = true;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  load(): void {
    this.loading = true;
    this.error = '';
    let params = new HttpParams()
      .set('status', this.status)
      .set('q', this.query.trim())
      .set('page', this.page)
      .set('limit', this.limit);
    const daterange = this.selectedFilters.daterange;
    if (daterange) {
      params = params.set('daterange', daterange);
    }
    this.apiService.get<TakedownListResponse>('takedowns', { params }).subscribe({
      next: response => {
        this.items = response.items || [];
        this.total = response.total || 0;
        this.loading = false;
      },
      error: () => {
        this.error = 'Unable to load takedown requests.';
        this.loading = false;
      }
    });
  }

  applyFilters(filters: Record<string, string | null>): void {
    this.selectedFilters = { ...filters };
    this.status = (filters.status as TakedownFilter) || 'all';
    this.page = 1;
    this.load();
  }

  resetFilters(): void {
    this.selectedFilters = {};
    this.status = 'all';
    this.dashboardService.selectedFilters.set({});
    this.page = 1;
    this.load();
  }

  search(): void {
    this.page = 1;
    this.load();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.load();
  }

  accept(item: TakedownRequestItem): void {
    if (!item?.id || this.actionId) {
      return;
    }
    if (this.mailAccountStatus && !this.mailAccountStatus.configured) {
      this.error = 'Please activate your tenant mail account and configure passwords/keys before accepting takedown requests.';
      return;
    }
    this.actionId = item.id;
    this.apiService.post<TakedownRequestItem>(`takedowns/${item.id}/accept`, {}).subscribe({
      next: updated => {
        this.replaceItem(updated);
        this.actionId = '';
      },
      error: err => {
        this.error = err?.error?.detail ?? 'Unable to accept takedown request.';
        this.actionId = '';
      }
    });
  }

  reject(item: TakedownRequestItem): void {
    if (!item?.id || this.actionId) {
      return;
    }
    this.rejectionTarget = item;
  }

  cancelRejection(): void {
    if (this.actionId) {
      return;
    }
    this.rejectionTarget = null;
  }

  submitRejection(reason: string): void {
    const item = this.rejectionTarget;
    if (!item?.id || this.actionId) {
      return;
    }
    this.actionId = item.id;
    this.apiService.post<TakedownRequestItem>(`takedowns/${item.id}/reject`, { reason: reason.trim() }).subscribe({
      next: updated => {
        this.replaceItem(updated);
        this.actionId = '';
        this.rejectionTarget = null;
      },
      error: err => {
        this.error = err?.error?.detail ?? 'Unable to reject takedown request.';
        this.actionId = '';
      }
    });
  }

  canDecide(item: TakedownRequestItem): boolean {
    return !item.operator_tenant_id || item.operator_tenant_id === this.appService.userSessionData().tenant.id;
  }

  statusClass(status: string): string {
    switch (status) {
      case 'accepted':
        return 'border-[rgba(40,167,69,0.35)] bg-[rgba(40,167,69,0.1)] text-[#7ee787] [body.light-theme_&]:border-emerald-600/30 [body.light-theme_&]:bg-emerald-100 [body.light-theme_&]:text-emerald-800';
      case 'denied':
        return 'border-[rgba(220,53,69,0.35)] bg-[rgba(220,53,69,0.1)] text-[#ff8a8a] [body.light-theme_&]:border-red-600/30 [body.light-theme_&]:bg-red-100 [body.light-theme_&]:text-red-800';
      case 'failed':
        return 'border-[rgba(255,193,7,0.35)] bg-[rgba(255,193,7,0.1)] text-[#ffd866] [body.light-theme_&]:border-amber-600/30 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800';
      default:
        return 'border-[rgba(87,165,235,0.35)] bg-[rgba(87,165,235,0.1)] text-[var(--color-blue-640)] [body.light-theme_&]:border-sky-600/30 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-800';
    }
  }

  private replaceItem(updated: TakedownRequestItem): void {
    this.items = this.items.map(item => {
      if (item.id === updated.id) {
        return updated;
      }
      return item;
    });
  }
}
