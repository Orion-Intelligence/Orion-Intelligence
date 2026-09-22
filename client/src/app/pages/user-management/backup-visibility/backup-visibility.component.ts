import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../services/core/app/app.service';
import { finalize } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import type { BackupVisibility, BackupVisibilityTenant, CountRow } from '../backup-restore/model/backup-restore.model';

@Component({
  selector: 'app-backup-visibility',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './backup-visibility.component.html',
})
export class BackupVisibilityComponent implements OnInit {
  loading = true;
  errored = false;
  data: BackupVisibility | null = null;
  scope: 'admin' | 'tenant' = 'admin';
  tenantQuery = '';
  tenantKind = 'all';

  get filteredTenants(): BackupVisibilityTenant[] {
    const query = this.tenantQuery.trim().toLowerCase();
    return (this.data?.tenants ?? []).filter(tenant =>
      (this.tenantKind === 'all' || tenant.kind === this.tenantKind) &&
      [tenant.name, tenant.slug, tenant.tenant_id].some(value => (value ?? '').toLowerCase().includes(query)));
  }

  resetTenantFilters(): void {
    this.tenantQuery = '';
    this.tenantKind = 'all';
  }

  constructor(private apiService: ApiService, private route: ActivatedRoute, protected appService: AppService) {
  }

  ngOnInit(): void {
    this.loadBackup();
  }

  loadBackup(): void {
    this.loading = true;
    this.errored = false;
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.scope = this.route.snapshot.queryParamMap.get('scope') === 'tenant' ? 'tenant' : 'admin';
    this.apiService.get<BackupVisibility>(`${this.scope}/backups/${id}/visibility`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => (this.data = response),
        error: () => (this.errored = true),
      });
  }

  get kpis(): { label: string; value: number; icon: string }[] {
    if (!this.data) {
      return [];
    }
    return [
      { label: 'Total tenants', value: this.data.totals.tenants, icon: 'bi-people-fill' },
      { label: 'Primary tenants', value: this.data.totals.primary, icon: 'bi-building' },
      { label: 'Secondary tenants', value: this.data.totals.secondary, icon: 'bi-diagram-3' },
      { label: this.scope === 'tenant' ? 'Your documents' : 'Admin documents', value: this.data.admin.documents, icon: 'bi-file-earmark-text' },
    ];
  }

  get adminSections(): { title: string; storage: string; icon: string; total: number; collectionCount: number; rows: CountRow[] }[] {
    const admin = this.data?.admin;
    if (!admin) {
      return [];
    }
    return [
      { title: 'Accounts', storage: 'MongoDB', icon: 'bi-collection', rows: this.toRows(admin.mongo) },
      { title: 'Findings', storage: 'Elasticsearch', icon: 'bi-search', rows: this.toRows(admin.elastic) },
      { title: 'Connections', storage: 'ArangoDB', icon: 'bi-diagram-3', rows: this.toRows(admin.arango) },
    ].map(section => ({
      ...section,
      total: section.rows.reduce((sum, row) => sum + row.count, 0),
      collectionCount: section.rows.length,
    }));
  }

  private toRows(counts: Record<string, number> | undefined): CountRow[] {
    return Object.entries(counts ?? {})
      .map(([name, count]) => ({ name, count: Number(count) || 0 }))
      .sort((first, second) => second.count - first.count);
  }

  kindClass(kind: string): string {
    if (kind === 'default') {
      return 'bg-amber-500/10 text-amber-300 [body.light-theme_&]:bg-amber-100 [body.light-theme_&]:text-amber-800';
    }
    if (kind === 'secondary') {
      return 'bg-violet-500/10 text-violet-300 [body.light-theme_&]:bg-violet-100 [body.light-theme_&]:text-violet-800';
    }
    return 'bg-sky-500/10 text-sky-300 [body.light-theme_&]:bg-sky-100 [body.light-theme_&]:text-sky-800';
  }

  formatDate(value: string): string {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleString();
  }
}
