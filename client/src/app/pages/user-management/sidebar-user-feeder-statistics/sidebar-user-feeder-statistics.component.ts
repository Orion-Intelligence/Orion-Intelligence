import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface FeederRuleStat {
  rule: string;
  count: number;
}

interface ElasticIndexStat {
  label: string;
  index: string;
  count: number;
}

interface SystemStatistics {
  feeder: {
    total_scripts: number;
    enabled: number;
    disabled: number;
    healthy: number;
    failing: number;
    idle: number;
    total_values: number;
    latest_success: string | null;
    per_rule: FeederRuleStat[];
  };
  elastic: {
    indices: ElasticIndexStat[];
    total_documents: number;
  };
}

@Component({
  selector: 'app-sidebar-user-feeder-statistics',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './sidebar-user-feeder-statistics.component.html',
})
export class SidebarUserFeederStatisticsComponent implements OnInit {
  loading = true;
  errored = false;
  data: SystemStatistics | null = null;

  constructor(private apiService: ApiService) {
  }

  ngOnInit(): void {
    this.apiService.get<SystemStatistics>('profile/system-statistics')
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.data = response;
        },
        error: () => {
          this.errored = true;
        },
      });
  }

  get kpis(): { label: string; value: number }[] {
    const feeder = this.data?.feeder;
    if (!feeder || !this.data) {
      return [];
    }
    return [
      { label: 'Total scripts', value: feeder.total_scripts },
      { label: 'Enabled', value: feeder.enabled },
      { label: 'Disabled', value: feeder.disabled },
      { label: 'Healthy', value: feeder.healthy },
      { label: 'Failing', value: feeder.failing },
      { label: 'Idle', value: feeder.idle },
      { label: 'Feed URLs', value: feeder.total_values },
      { label: 'Indexed documents', value: this.data.elastic.total_documents },
    ];
  }

  private scaledPercent(count: number, values: number[]): number {
    if (count <= 0) {
      return 0;
    }
    const max = Math.max(1, ...values);
    const ratio = Math.sqrt(count) / Math.sqrt(max);
    return Math.min(100, Math.max(8, Math.round(ratio * 100)));
  }

  rulePercent(count: number): number {
    return this.scaledPercent(count, (this.data?.feeder.per_rule ?? []).map(rule => rule.count));
  }

  indexPercent(count: number): number {
    return this.scaledPercent(count, (this.data?.elastic.indices ?? []).map(index => index.count));
  }
}
