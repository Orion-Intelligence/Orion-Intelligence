import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { FeederRuleOption, FeederScriptItem } from '../../../shared/model/profile/feeder.model';
import { FeederService } from './feeder.service';
import { SidebarUserFeederAddComponent } from './add/sidebar-user-feeder-add.component';
import { SidebarUserFeederViewComponent } from './view/sidebar-user-feeder-view.component';
import { supportsFileUploadForRuleType, supportsValueUploadForRuleType } from './feeder-rule.utils';

@Component({
  selector: 'app-sidebar-user-feeder',
  standalone: true,
  imports: [NgClass, FormsModule, SidebarUserFeederAddComponent, SidebarUserFeederViewComponent],
  templateUrl: './sidebar-user-feeder.component.html',
  animations: [fadeInDashboardItem],
})
export class SidebarUserFeederComponent implements OnInit {
  activeTab: 'add' | 'view' | 'values' = 'add';
  highlightedScript: FeederScriptItem | null = null;
  rules: FeederRuleOption[] = [];
  selectedRuleKey = '';
  isCatalogLoading = true;
  formError = '';

  constructor(private feederService: FeederService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.selectedRuleKey = this.route.snapshot.queryParamMap.get('rule') || '';
    this.loadCatalog();
  }

  get selectedRule(): FeederRuleOption | undefined {
    return this.rules.find((rule) => rule.key === this.selectedRuleKey);
  }

  get selectedRuleType(): string {
    return this.selectedRule?.rule_type || '';
  }

  hasScriptTab(): boolean {
    return supportsFileUploadForRuleType(this.selectedRuleType);
  }

  hasValuesTab(): boolean {
    return supportsValueUploadForRuleType(this.selectedRuleType);
  }

  setActiveTab(tab: 'add' | 'view' | 'values'): void {
    this.highlightedScript = null;
    this.activeTab = tab;
  }

  onScriptUploaded(script: FeederScriptItem): void {
    this.highlightedScript = script;
    this.activeTab = 'view';
    this.loadCatalog();
  }

  onRuleChange(): void {
    this.highlightedScript = null;
    this.ensureValidActiveTab();
    this.syncRuleQueryParam();
  }

  getRuleLabel(ruleKey: string): string {
    return this.humanizeKey(ruleKey);
  }

  private loadCatalog(): void {
    this.isCatalogLoading = true;
    this.feederService.getCatalog()
      .pipe(finalize(() => {
        this.isCatalogLoading = false;
      }))
      .subscribe({
        next: (response) => {
          this.rules = response?.rules ?? [];
          if (!this.selectedRuleKey && this.rules.length > 0) {
            this.selectedRuleKey = this.rules[0].key;
          }
          if (this.selectedRuleKey && !this.rules.some((rule) => rule.key === this.selectedRuleKey)) {
            this.selectedRuleKey = this.rules[0]?.key || '';
          }
          this.ensureValidActiveTab();
          this.syncRuleQueryParam();
          this.formError = '';
        },
        error: (error) => {
          this.formError = error?.error?.detail || 'Failed to load feeder categories';
        }
      });
  }

  private humanizeKey(value: string): string {
    return value
      .replace(/_collector$/g, '')
      .replace(/[_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (match) => match.toUpperCase());
  }

  private ensureValidActiveTab(): void {
    if (!this.hasScriptTab() && this.activeTab === 'view') {
      this.activeTab = this.hasValuesTab() ? 'values' : 'add';
      return;
    }
    if (!this.hasValuesTab() && this.activeTab === 'values') {
      this.activeTab = 'view';
    }
  }

  private syncRuleQueryParam(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { rule: this.selectedRuleKey || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
