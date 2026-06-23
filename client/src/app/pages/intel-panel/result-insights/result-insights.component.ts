import { FormsModule } from '@angular/forms';
import { Component, OnInit, input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { UniqueLinkItem } from '../../../shared/model/homepage/consolidation_insights';
import { search_filter_labels } from '../../../shared/constants/shared-enums';
import { getStatusFlag } from '../../../shared/utils/intel-report.util';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-result-insights',
  imports: [CommonModule, FormsModule, NgClass, TranslatePipe],
  templateUrl: './result-insights.component.html'
})
export class ResultInsightsComponent implements OnInit {
  sectionStates: Record<string, boolean> = {};
  sectionSearchQueries: Record<string, string> = {};
  copiedInsightItemKey = '';
  uniqueUrlSearchQuery = '';
  copiedUniqueUrlKey = '';
  searchQuery = '';
  filterOptions = ['All', 'Email', 'Username', 'Actor', 'Team', 'Attacker'];
  selectedFilter: string = 'All';
  emails: string[] = [];
  usernames: string[] = [];
  actors: string[] = [];
  teams: string[] = [];
  attackers: string[] = [];
  dataSections: { title: string; key: string; data: string[]; }[] = [];
  uniqueUrls: UniqueLinkItem[] = [];
  keywordData: { value: number; label: string; }[] = [];
  coverageData: { value: number; label: string; color: string; }[] = [];
  readonly consolidatedCallbackModel = input<ConsolidatedCallbackModel>(new ConsolidatedCallbackModel());
  readonly results = input<any>();
  readonly rankedResults = input<any>();
  readonly isGrouped = input.required<boolean>();
  readonly result_count = input.required<number>();

  ngOnInit(): void {
    this.uniqueUrls = this.getUniqueLinks(this.consolidatedCallbackModel(), this.rankedResults(), this.isGrouped());
    const { emails, usernames, actors, teams, attackers } = this.extractThreatEntities(this.consolidatedCallbackModel(), this.rankedResults(), this.isGrouped());
    this.emails = emails;
    this.usernames = usernames;
    this.actors = actors;
    this.teams = teams;
    this.attackers = attackers;
    this.keywordData = [
      { value: this.getTotalResultCount(this.consolidatedCallbackModel(), this.rankedResults(), this.isGrouped()), label: 'Total Found' },
      { value: this.getAllThreatEntities().length, label: 'Threat Entities' },
      { value: this.getSingleUrlPerResultCount(this.consolidatedCallbackModel(), this.rankedResults(), this.isGrouped()), label: 'Links' },
      { value: this.getActiveModelCount(this.consolidatedCallbackModel(), this.rankedResults(), this.isGrouped()), label: 'Pages' }
    ];
    const consolidatedCallbackModel = this.consolidatedCallbackModel();
    const rankedResults = this.rankedResults();
    const isGrouped = this.isGrouped();
    this.getCoverageSummaryFromModels(consolidatedCallbackModel, rankedResults, isGrouped);
    const extractedData = this.extractMultipleFieldsFromResults(consolidatedCallbackModel, rankedResults, isGrouped);
    this.dataSections = Object.entries(search_filter_labels).map(([key, title]) => {
      const variants = new Set<string>([
        key,
        key.replace(/^m_/, ''),
        key.endsWith('s') ? key.slice(0, -key) : key,
        key.replace(/^m_/, '').replace(/s$/, ''),
        key.replace(/^m_/, '').replace(/_([a-z])/g, (_, c) => c.toUpperCase())
      ]);
      const collected: string[] = [];
      for (const k of variants) {
        const v = (extractedData as any)[k];
        if (Array.isArray(v)) {
          collected.push(...v);
        }
      }
      return {
        title,
        key: key,
        data: Array.from(new Set(collected))
      };
    });
    for (const key of Object.keys(search_filter_labels)) {
      this.sectionStates[key] = false;
    }
    this.sectionStates['isKeywordExpanded'] = true;
    this.sectionStates['isCoverageExpanded'] = true;
    this.sectionStates['isThreatExpanded'] = true;
    this.sectionStates['isUrlsExpanded'] = true;
  }

  toggleFilter(option: string) {
    this.selectedFilter = option;
  }

  toggleSection(section: string): void {
    if (section in this.sectionStates) {
      this.sectionStates[section] = !this.sectionStates[section];
    }
  }

  isSectionExpanded(section: string): boolean {
    return this.sectionStates[section];
  }

  getFilteredSectionData(section: { key: string; data: string[] }): string[] {
    const query = (this.sectionSearchQueries[section.key] || '').trim().toLowerCase();
    if (!query) {
      return section.data;
    }
    return section.data.filter(item => item.toLowerCase().includes(query));
  }

  copyInsightItem(item: string, sectionKey: string, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!navigator.clipboard) {
      return;
    }
    const copiedKey = `${sectionKey}-${index}`;
    navigator.clipboard.writeText(item).then(() => {
      this.copiedInsightItemKey = copiedKey;
      setTimeout(() => {
        if (this.copiedInsightItemKey === copiedKey) {
          this.copiedInsightItemKey = '';
        }
      }, 1200);
    }).catch(() => undefined);
  }

  getFilteredUniqueUrls(): UniqueLinkItem[] {
    const query = this.uniqueUrlSearchQuery.trim().toLowerCase();
    if (!query) {
      return this.uniqueUrls;
    }
    return this.uniqueUrls.filter(item =>
      item.title.toLowerCase().includes(query) || item.url.toLowerCase().includes(query));
  }

  getActiveUniqueUrlCount(): number {
    return this.uniqueUrls.filter(item => item.status).length;
  }

  copyUniqueUrl(item: UniqueLinkItem, index: number, event: MouseEvent): void {
    event.stopPropagation();
    if (!navigator.clipboard) {
      return;
    }
    const copiedKey = `${item.url}-${index}`;
    navigator.clipboard.writeText(item.url).then(() => {
      this.copiedUniqueUrlKey = copiedKey;
      setTimeout(() => {
        if (this.copiedUniqueUrlKey === copiedKey) {
          this.copiedUniqueUrlKey = '';
        }
      }, 1200);
    }).catch(() => undefined);
  }

  coverageDotClass(item: { label: string; color: string }): string {
    if (item.label === 'Active' || item.color === '#1ec773') {
      return 'bg-[#1ec773]';
    }
    if (item.label === 'Inactive' || item.color === '#e6534b') {
      return 'bg-[#e6534b]';
    }
    if (item.label === 'Seldom' || item.color === '#f08b36') {
      return 'bg-[#f08b36]';
    }
    return 'bg-transparent';
  }

  statusDotClass(isActive: boolean): string {
    return isActive ? 'bg-[#1ec773]' : 'bg-[#e6534b]';
  }

  threatResults(): string[] {
    const query = this.searchQuery.trim().toLowerCase();
    let source: string[];
    switch (this.selectedFilter) {
      case 'Email':
        source = this.emails;
        break;
      case 'Username':
        source = this.usernames;
        break;
      case 'Actor':
        source = this.actors;
        break;
      case 'Team':
        source = this.teams;
        break;
      case 'Attacker':
        source = this.attackers;
        break;
      case 'All':
      default:
        source = this.getAllThreatEntities();
        break;
    }
    return source.filter(item => item.toLowerCase().includes(query));
  }

  getAllThreatEntities(): string[] {
    return Array.from(new Set([
      ...this.emails,
      ...this.usernames,
      ...this.actors,
      ...this.teams,
      ...this.attackers
    ]));
  }

  getTotalResultCount(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): number {
    if (!isGrouped && Array.isArray(rankedData)) {
      return rankedData.length;
    }
    return ((consolidated.leak_model?.Result?.length || 0) +
          (consolidated.chat_model?.Result?.length || 0) +
          (consolidated.exploit_model?.Result?.length || 0) +
          (consolidated.apt_model?.Result?.length || 0) +
          (consolidated.malware_model?.Result?.length || 0) +
          (consolidated.generic_model?.Result?.length || 0) +
          (consolidated.defacement_model?.Result?.length || 0) +
          (consolidated.social_model?.Result?.length || 0));
  }

  getActiveModelCount(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): number {
    if (!isGrouped && Array.isArray(rankedData)) {
      return 1;
    }
    const models = [
      consolidated.leak_model,
      consolidated.exploit_model,
      consolidated.apt_model,
      consolidated.malware_model,
      consolidated.chat_model,
      consolidated.generic_model,
      consolidated.social_model,
      consolidated.defacement_model
    ];
    return models.filter(model => model?.Result && model.Result.length > 0).length;
  }

  getUniqueLinks(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): UniqueLinkItem[] {
    const linkMap = new Map<string, UniqueLinkItem>();
    const addToMap = (url: string | undefined, title: string | undefined, date?: string) => {
      if (url && !linkMap.has(url)) {
        const status = this.getStatus(date);
        linkMap.set(url, { url, title: title || 'Untitled', status });
      }
    };
    const items: any[] = isGrouped
      ? [
        ...(consolidated.generic_model?.Result || []),
        ...(consolidated.leak_model?.Result || []),
        ...(consolidated.defacement_model?.Result || []),
        ...(consolidated.social_model?.Result || []),
        ...(consolidated.chat_model?.Result || []),
        ...(consolidated.exploit_model?.Result || []),
        ...(consolidated.apt_model?.Result || []),
        ...(consolidated.malware_model?.Result || [])
      ]
      : (Array.isArray(rankedData) ? rankedData : []);
    items.forEach(item => {
      addToMap(item.m_url, item.m_title, item.m_creation_date || item.m_update_date || item.m_date);
      ['m_clearnet_links', 'm_weblink', 'm_dumplink', 'm_source_url'].forEach(field => {
        const links = item[field];
        if (Array.isArray(links)) {
          links.forEach(link => {
            addToMap(link, item.m_title, item.m_creation_date);
          });
        }
      });
    });
    return Array.from(linkMap.values());
  }

  getStatus(dateString?: string): boolean {
    return getStatusFlag(dateString);
  }

  extractThreatEntities(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): {
      emails: string[];
      usernames: string[];
      actors: string[];
      teams: string[];
      attackers: string[];
  } {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    const emails = new Set<string>();
    const usernames = new Set<string>();
    const actors = new Set<string>();
    const teams = new Set<string>();
    const attackers = new Set<string>();
    const toValues = (value?: unknown): string[] => {
      if (!value) {
        return [];
      }
      const values = Array.isArray(value) ? value : [value];
      return values
        .flatMap(item => typeof item === 'string' ? item.split(/\n+/) : [String(item)])
        .map(item => item.trim())
        .filter(item => item && item.toLowerCase() !== 'unknown');
    };
    const addValues = (target: Set<string>, value?: unknown) => {
      toValues(value).forEach(item => target.add(item));
    };
    const extractEmails = (value?: unknown) => {
      if (!value) {
        return;
      }
      toValues(value).forEach(item => {
        (item.match(emailRegex) || []).forEach(email => emails.add(email));
      });
    };
    const items: any[] = isGrouped
      ? [
        ...(consolidated.generic_model?.Result || []),
        ...(consolidated.defacement_model?.Result || []),
        ...(consolidated.social_model?.Result || []),
        ...(consolidated.leak_model?.Result || []),
        ...(consolidated.exploit_model?.Result || []),
        ...(consolidated.apt_model?.Result || []),
        ...(consolidated.malware_model?.Result || []),
        ...(consolidated.chat_model?.Result || [])
      ]
      : (Array.isArray(rankedData) ? rankedData : []);
    items.forEach(item => {
      extractEmails(item.m_email);
      extractEmails(item.m_content);
      extractEmails(item.m_highlighted);
      extractEmails(item.m_important_content);
      extractEmails(item.m_meta_description);
      addValues(usernames, item.m_username);
      addValues(usernames, item.username);
      addValues(usernames, item.m_sender_username);
      addValues(actors, item.m_actor);
      addValues(actors, item.m_threat_actor);
      addValues(actors, item.m_family);
      addValues(teams, item.m_team);
      addValues(attackers, item.m_attacker);
    });
    return {
      emails: Array.from(emails),
      usernames: Array.from(usernames),
      actors: Array.from(actors),
      teams: Array.from(teams),
      attackers: Array.from(attackers)
    };
  }

  getCoverageSummaryFromModels(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): void {
    let active = 0;
    let seldom = 0;
    let inactive = 0;
    let total: number;
    const allResults: any[] = isGrouped
      ? [
        ...(consolidated.leak_model?.Result || []),
        ...(consolidated.chat_model?.Result || []),
        ...(consolidated.generic_model?.Result || []),
        ...(consolidated.exploit_model?.Result || []),
        ...(consolidated.apt_model?.Result || []),
        ...(consolidated.malware_model?.Result || []),
        ...(consolidated.social_model?.Result || []),
        ...(consolidated.defacement_model?.Result || [])
      ]
      : (Array.isArray(rankedData) ? rankedData : []);
    total = allResults.length;
    allResults.forEach(item => {
      const rawDate = item.m_update_date || item.m_date || item.m_creation_date;
      const status = this.getStatusCategory(rawDate);
      if (status === 'Active') {
        active++;
      }
      else if (status === 'Seldom') {
        seldom++;
      }
      else {
        inactive++;
      }
    });
    this.coverageData = [
      { value: total, label: 'Total Found', color: '' },
      { value: active, label: 'Active', color: '#1ec773' },
      { value: inactive, label: 'Inactive', color: '#e6534b' },
      { value: seldom, label: 'Seldom', color: '#f08b36' }
    ];
  }

  getStatusCategory(dateString?: string): 'Active' | 'Seldom' | 'Inactive' {
    if (!dateString) {
      return 'Inactive';
    }
    const updatedDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays <= 5) {
      return 'Active';
    }
    else if (diffInDays <= 10) {
      return 'Seldom';
    }
    else {
      return 'Inactive';
    }
  }

  getSingleUrlPerResultCount(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): number {
    const urls = new Set<string>();
    if (!isGrouped && Array.isArray(rankedData)) {
      rankedData.forEach((item: any) => {
        const fields = ['m_url', 'm_weblink', 'm_dumplink', 'm_clearnet_links', 'm_source_url', 'm_channel_url'];
        const url = this.getFirstHttpUrlFromFields(item, fields);
        if (url) {
          urls.add(url);
        }
      });
      return urls.size;
    }
    const fieldMap: Record<string, string[]> = {
      generic_model: ['m_url', 'm_clearnet_links', 'm_weblink', 'm_dumplink'],
      leak_model: ['m_url'],
      defacement_model: ['m_url', 'm_source_url'],
      social_model: ['m_channel_url', 'm_weblink'],
      chat_model: ['m_weblink'],
      exploit_model: ['m_url'],
      apt_model: ['m_source_url', 'm_references'],
      malware_model: ['m_source_url', 'm_references']
    };
    Object.entries(fieldMap).forEach(([modelKey, fields]) => {
      const results = (consolidated as any)[modelKey]?.Result || [];
      results.forEach((item: any) => {
        const url = this.getFirstHttpUrlFromFields(item, fields);
        if (url) {
          urls.add(url);
        }
      });
    });
    return urls.size;
  }

  private getFirstHttpUrlFromFields(item: any, fields: string[]): string | null {
    for (const field of fields) {
      const value = item[field];
      const url = Array.isArray(value)
        ? value.find(v => typeof v === 'string' && v.startsWith('http'))
        : (typeof value === 'string' && value.startsWith('http') ? value : null);
      if (url) {
        return url;
      }
    }
    return null;
  }

  extractMultipleFieldsFromResults(groupData: any, rankData: any, isGrouped: boolean): Record<string, string[]> {
    const resultMap: Record<string, Set<string>> = {};
    const dataArray = isGrouped
      ? Object.values(groupData).flatMap((model: any) => model?.Result || [])
      : (Array.isArray(rankData) ? rankData : []);
    for (const item of dataArray) {
      for (const [key, value] of Object.entries(item)) {
        if (!resultMap[key]) {
          resultMap[key] = new Set();
        }
        if (Array.isArray(value)) {
          for (const v of value) {
            if (typeof v === 'string' && v.trim()) {
              resultMap[key].add(v);
            }
          }
        }
        else if (typeof value === 'string' && value.trim()) {
          resultMap[key].add(value);
        }
      }
    }
    const finalResult: Record<string, string[]> = {};
    for (const key in resultMap) {
      finalResult[key] = Array.from(resultMap[key]);
    }
    return finalResult;
  }
}
