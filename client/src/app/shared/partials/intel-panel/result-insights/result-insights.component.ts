import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsolidatedCallbackModel } from '../../../model/results/consolidated/consolidated.callback.model';
import { UniqueLinkItem } from '../../../model/homepage/consolidationInsights'


@Component({
  selector: 'app-result-insights',
  imports: [CommonModule, FormsModule],
  templateUrl: './result-insights.component.html',
  styleUrl: './result-insights.component.css'
})
export class ResultInsightsComponent {
  @Input() consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  sectionStates: Record<string, boolean> = {
    isKeywordExpanded: true,
    isCoverageExpanded: true,
    isThreatExpanded: true,
    isUrlsExpanded: true,
    isLocationExpanded: false,
    isNetworkExpanded: false,
    isTeamExpanded: false,
    isSenderExpanded: false,
    isCveCweExpanded: false,
    isContentTypeExpanded: false,
    isPhoneNumbersExpanded: false,
  };
  searchQuery = '';
  filterOptions = ['All', 'Email', 'Name'];
  selectedFilter: string = 'All';
  emails: string[] = [];
  names: string[] = [];


  dataSections: { title: string; key: string; data: string[]; }[] = [];

  uniqueUrls: UniqueLinkItem[] = [];
  keywordData: { value: number, label: string }[] = [];
  coverageData: { value: number, label: string, color: string }[] = [];
  ngOnInit(): void {
    this.uniqueUrls = this.getUniqueLinks(this.consolidatedCallbackModel);
    const { emails, names } = this.extractNamesAndEmails(this.consolidatedCallbackModel);
    this.emails = emails;
    this.names = names;
    this.keywordData.push({ value: this.getTotalResultCount(this.consolidatedCallbackModel), label: 'Total Found' })
    this.keywordData.push({ value: this.emails.length + this.names.length, label: 'Documents' })
    this.keywordData.push({ value: this.getSingleUrlPerResultCount(this.consolidatedCallbackModel), label: 'Links' })
    this.keywordData.push({ value: this.getActiveModelCount(this.consolidatedCallbackModel), label: 'Pages' })
    this.getCoverageSummaryFromModels(this.consolidatedCallbackModel);
    const fieldsMap = {
      locations: ['m_country_name'],
      teams: ['m_team', 'm_attacker', 'm_channel_name'],
      senders: ['m_sender_name'],
      cveCwe: ['m_cve', 'm_cwe'],
      contentTypes: ['m_content_type', 'mContentType'],
      phoneNumbers: ['m_phone_numbers'],
    };
    const extractedData = this.extractMultipleFieldsFromModels(this.consolidatedCallbackModel, fieldsMap);
    this.dataSections = [
      { title: 'Locations', key: 'isLocationExpanded', data: extractedData['locations'] },
      { title: 'Teams', key: 'isTeamExpanded', data: extractedData['teams'] },
      { title: 'Senders', key: 'isSenderExpanded', data: extractedData['senders'] },
      { title: 'CVE & CWE', key: 'isCveCweExpanded', data: extractedData['cveCwe'] },
      { title: 'Content Types', key: 'isContentTypeExpanded', data: extractedData['contentTypes'] },
      { title: 'Phone Numbers', key: 'isContentTypeExpanded', data: extractedData['phoneNumbers'] },
    ];
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
    return !!this.sectionStates[section];
  }
  threatResults(): string[] {
    const query = this.searchQuery.trim().toLowerCase();

    let source: string[] = [];

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
  getTotalResultCount(consolidated: ConsolidatedCallbackModel): number {
    return (
      (consolidated.leak_model?.Result?.length || 0) +
      (consolidated.chat_model?.Result?.length || 0) +
      (consolidated.exploit_model?.Result?.length || 0) +
      (consolidated.generic_model?.Result?.length || 0) +
      (consolidated.defacement_model?.Result?.length || 0) +
      (consolidated.social_model?.Result?.length || 0)
    );
  }
  getActiveModelCount(consolidated: ConsolidatedCallbackModel): number {
    const models = [
      consolidated.leak_model,
      consolidated.exploit_model,
      consolidated.chat_model,
      consolidated.generic_model,
      consolidated.social_model,
      consolidated.defacement_model,
    ];

    return models.filter(model => model && model.Result && model.Result.length > 0).length;
  }
  getUniqueLinks(consolidated: ConsolidatedCallbackModel): UniqueLinkItem[] {
    const linkMap = new Map<string, UniqueLinkItem>();

    const addToMap = (url: string | undefined, title: string | undefined, date?: string) => {
      if (url && !linkMap.has(url)) {
        const status = this.getStatus(date);
        linkMap.set(url, { url, title: title || 'Untitled', status });
      }
    };

    consolidated.generic_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.m_title, item.m_creation_date);
      item.m_clearnet_links?.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
      item.m_weblink?.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
      item.m_dumplink?.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
    });

    consolidated.leak_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.m_title, item.m_update_date);
    });

    consolidated.defacement_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.q, item.m_date_of_leak);
      item.m_source_url?.forEach(link => addToMap(link, item.q, item.m_date_of_leak));
    });

    consolidated.social_model?.Result?.forEach(item => {
      addToMap(item.m_channel_url, item.m_title, item.m_message_date);
      item.m_weblink?.forEach(link => addToMap(link, item.m_title, item.m_message_date));
    });

    consolidated.chat_model?.Result?.forEach(item => {
      item.m_weblink?.forEach(link =>
        addToMap(link, item.m_content || 'Chat Message', item.m_message_date)
      );
    });

    consolidated.exploit_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.m_title || item.m_url, item.m_leak_date);
    });

    return Array.from(linkMap.values());
  }

  getStatus(dateString?: string): boolean {
    if (!dateString) return false;
    const createdDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 5) {
      return true;
    } else if (diffInDays <= 10) {
      return true;
    } else {
      return false;
    }
  }

  extractNamesAndEmails(consolidated: ConsolidatedCallbackModel): { emails: string[], names: string[] } {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g;
    const nameCandidatesRegex = /\b[A-Z][a-z]+\s[A-Z][a-z]+\b/g;
    const emails = new Set<string>();
    const names = new Set<string>();

    const extractFromText = (text?: string | string[]) => {
      if (!text) return;
      const texts = Array.isArray(text) ? text : [text];

      texts.forEach(t => {
        (t.match(emailRegex) || []).forEach(e => emails.add(e));
        (t.match(nameCandidatesRegex) || []).forEach(n => names.add(n));
      });
    };

    consolidated.generic_model?.Result?.forEach(item => {
      extractFromText(item.m_content);
      extractFromText(item.m_highlighted);
      extractFromText(item.m_important_content);
      extractFromText(item.m_meta_description);
    });

    consolidated.defacement_model?.Result?.forEach(item => {
      extractFromText(item.m_attacker);
      extractFromText(item.m_team);
    });

    consolidated.social_model?.Result?.forEach(item => {
      extractFromText(item.m_sender_name);
      extractFromText(item.m_channel_name);
      extractFromText(item.m_title);
      extractFromText(item.m_summary);
      extractFromText(item.m_content);
    });

    consolidated.leak_model?.Result?.forEach(item => {
      extractFromText(item.m_title);
      extractFromText(item.m_content);
    });

    consolidated.exploit_model?.Result?.forEach(item => {
      extractFromText(item.m_title);
    });

    consolidated.chat_model?.Result?.forEach(item => {
      extractFromText(item.m_content);
      extractFromText(item.m_sender_name);
      extractFromText(item.m_channel_name);
    });

    return {
      emails: Array.from(emails),
      names: Array.from(names),
    };
  }
  getCoverageSummaryFromModels(consolidated: ConsolidatedCallbackModel): void {
    let active = 0;
    let seldom = 0;
    let inactive = 0;
    let total = 0;

    const allResults: any[] = [
      ...(consolidated.leak_model?.Result || []),
      ...(consolidated.chat_model?.Result || []),
      ...(consolidated.generic_model?.Result || []),
      ...(consolidated.exploit_model?.Result || []),
      ...(consolidated.social_model?.Result || []),
      ...(consolidated.defacement_model?.Result || [])
    ];

    total = allResults.length;

    allResults.forEach(item => {
      const rawDate =
        item.m_update_date || item.m_date_of_leak || item.m_message_date || item.m_leak_date || item.m_creation_date;

      const status = this.getStatusCategory(rawDate);

      if (status === 'Active') active++;
      else if (status === 'Seldom') seldom++;
      else inactive++;
    });

    this.coverageData = [
      { value: total, label: 'Total', color: '' },
      { value: active, label: 'Active', color: '#1ec773' },
      { value: inactive, label: 'Inactive', color: '#e6534b' },
      { value: seldom, label: 'Seldom', color: '#f08b36' }
    ];
  }
  getStatusCategory(dateString?: string): 'Active' | 'Seldom' | 'Inactive' {
    if (!dateString) return 'Inactive';
    const updatedDate = new Date(dateString);
    const today = new Date();
    const diffInDays = Math.floor((today.getTime() - updatedDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 5) {
      return 'Active';
    } else if (diffInDays <= 10) {
      return 'Seldom';
    } else {
      return 'Inactive';
    }
  }
  getSingleUrlPerResultCount(consolidated: ConsolidatedCallbackModel): number {
    const fieldMap: { [key: string]: string[] } = {
      generic_model: ['m_url', 'm_clearnet_links', 'm_weblink', 'm_dumplink'],
      leak_model: ['m_url'],
      defacement_model: ['m_url', 'm_source_url'],
      social_model: ['m_channel_url', 'm_weblink'],
      chat_model: ['m_weblink'],
      exploit_model: ['m_url'],
    };

    const urls = new Set<string>();

    Object.entries(fieldMap).forEach(([modelKey, fields]) => {
      const results = consolidated[modelKey as keyof ConsolidatedCallbackModel]?.Result || [];
      results.forEach((item: any) => {
        for (const field of fields) {
          const value = item[field];
          const url = Array.isArray(value) ? value.find(v => typeof v === 'string' && v.startsWith('http'))
            : (typeof value === 'string' && value.startsWith('http') ? value : null);
          if (url) {
            urls.add(url);
            break;
          }
        }
      });
    });

    return urls.size;
  }

  extractMultipleFieldsFromModels(
    consolidatedModel: ConsolidatedCallbackModel,
    fieldsMap: Record<string, string[]>
  ): Record<string, string[]> {
    const resultMap: Record<string, Set<string>> = {};

    const allModels = [
      consolidatedModel.chat_model,
      consolidatedModel.leak_model,
      consolidatedModel.exploit_model,
      consolidatedModel.defacement_model,
      consolidatedModel.social_model,
      consolidatedModel.generic_model,
    ];

    for (const [key, fields] of Object.entries(fieldsMap)) {
      resultMap[key] = new Set();

      for (const model of allModels) {
        if (!model?.Result) continue;

        for (const item of model.Result) {
          for (const field of fields) {
            const value = (item as any)[field];

            if (Array.isArray(value)) {
              value.forEach(v => {
                if (typeof v === 'string' && v.trim()) resultMap[key].add(v);
              });
            } else if (typeof value === 'string' && value.trim()) {
              resultMap[key].add(value);
            }
          }
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