import { FormsModule } from '@angular/forms';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';
import { UniqueLinkItem } from '../../../shared/model/homepage/consolidation_insights';
import { search_filter_labels } from '../../../shared/constants/shared-enums';
import { getStatusFlag } from '../../../shared/utils/intel-report.util';
@Component({
  selector: 'app-result-insights',
  imports: [CommonModule, FormsModule, NgClass],
  templateUrl: './result-insights.component.html'
})
export class ResultInsightsComponent implements OnInit {
  sectionStates: Record<string, boolean> = {};
  searchQuery = '';
  filterOptions = ['All', 'Email', 'Name'];
  selectedFilter: string = 'All';
  emails: string[] = [];
  names: string[] = [];
  dataSections: { title: string; key: string; data: string[]; }[] = [];
  uniqueUrls: UniqueLinkItem[] = [];
  keywordData: { value: number; label: string; }[] = [];
  coverageData: { value: number; label: string; color: string; }[] = [];

  @Input() consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  @Input() results: any;
  @Input() rankedResults: any;
  @Input() isGrouped!: boolean;
  @Input() result_count!: number;

  ngOnInit(): void {
    this.uniqueUrls = this.getUniqueLinks(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped);
    const { emails, names } = this.extractNamesAndEmails(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped);
    this.emails = emails;
    this.names = names;
    this.keywordData = [
      { value: this.getTotalResultCount(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped), label: 'Total Found' },
      { value: this.emails.length + this.names.length, label: 'Documents' },
      { value: this.getSingleUrlPerResultCount(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped), label: 'Links' },
      { value: this.getActiveModelCount(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped), label: 'Pages' }
    ];
    this.getCoverageSummaryFromModels(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped);
    const extractedData = this.extractMultipleFieldsFromResults(this.consolidatedCallbackModel, this.rankedResults, this.isGrouped);
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

  threatResults(): string[] {
    const query = this.searchQuery.trim().toLowerCase();
    let source: string[];
    switch (this.selectedFilter) {
      case 'Email':
        source = this.emails;
        break;
      case 'Name':
        source = this.names;
        break;
      case 'All':
      default:
        source = [...this.emails, ...this.names];
        break;
    }
    return source.filter(item => item.toLowerCase().includes(query));
  }

  getTotalResultCount(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): number {
    if (!isGrouped && Array.isArray(rankedData)) {
      return rankedData.length;
    }
    return ((consolidated.leak_model?.Result?.length || 0) +
          (consolidated.chat_model?.Result?.length || 0) +
          (consolidated.exploit_model?.Result?.length || 0) +
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
      consolidated.chat_model,
      consolidated.generic_model,
      consolidated.social_model,
      consolidated.defacement_model
    ];
    return models.filter(model => model && model.Result && model.Result.length > 0).length;
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
        ...(consolidated.exploit_model?.Result || [])
      ]
      : (Array.isArray(rankedData) ? rankedData : []);
    items.forEach(item => {
      addToMap(item.m_url, item.m_title, item.m_creation_date || item.m_update_date || item.m_leak_date || item.m_message_date);
      ['m_clearnet_links', 'm_weblink', 'm_dumplink', 'm_source_url'].forEach(field => {
        const links = item[field];
        if (Array.isArray(links)) {
          links.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
        }
      });
    });
    return Array.from(linkMap.values());
  }

  getStatus(dateString?: string): boolean {
    return getStatusFlag(dateString);
  }

  extractNamesAndEmails(consolidated: ConsolidatedCallbackModel, rankedData: any[], isGrouped: boolean): {
      emails: string[];
      names: string[];
  } {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    const nameRegex = /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g;
    const emails = new Set<string>();
    const names = new Set<string>();
    const extractFromText = (text?: string | string[]) => {
      if (!text) {
        return;
      }
      const texts = Array.isArray(text) ? text : [text];
      texts.forEach(t => {
        (t.match(emailRegex) || []).forEach(e => emails.add(e));
        (t.match(nameRegex) || []).forEach(n => names.add(n));
      });
    };
    const items: any[] = isGrouped
      ? [
        ...(consolidated.generic_model?.Result || []),
        ...(consolidated.defacement_model?.Result || []),
        ...(consolidated.social_model?.Result || []),
        ...(consolidated.leak_model?.Result || []),
        ...(consolidated.exploit_model?.Result || []),
        ...(consolidated.chat_model?.Result || [])
      ]
      : (Array.isArray(rankedData) ? rankedData : []);
    items.forEach(item => {
      extractFromText(item.m_content);
      extractFromText(item.m_highlighted);
      extractFromText(item.m_important_content);
      extractFromText(item.m_meta_description);
      extractFromText(item.m_attacker);
      extractFromText(item.m_team);
      extractFromText(item.m_sender_name);
      extractFromText(item.m_channel_name);
      extractFromText(item.m_title);
      extractFromText(item.m_summary);
    });
    return {
      emails: Array.from(emails),
      names: Array.from(names)
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
        ...(consolidated.social_model?.Result || []),
        ...(consolidated.defacement_model?.Result || [])
      ]
      : (Array.isArray(rankedData) ? rankedData : []);
    total = allResults.length;
    allResults.forEach(item => {
      const rawDate = item.m_update_date || item.m_leak_date || item.m_message_date || item.m_creation_date;
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
    const fieldMap: {
          [key: string]: string[];
      } = {
        generic_model: ['m_url', 'm_clearnet_links', 'm_weblink', 'm_dumplink'],
        leak_model: ['m_url'],
        defacement_model: ['m_url', 'm_source_url'],
        social_model: ['m_channel_url', 'm_weblink'],
        chat_model: ['m_weblink'],
        exploit_model: ['m_url']
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
