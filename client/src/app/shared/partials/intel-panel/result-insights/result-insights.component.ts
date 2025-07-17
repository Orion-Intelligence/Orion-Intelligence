import { FormsModule } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsolidatedCallbackModel } from '../../../model/results/consolidated/consolidated.callback.model';
interface UniqueLinkItem {
  title: string;
  url: string;
  status: boolean;
}
@Component({
  selector: 'app-result-insights',
  imports: [CommonModule, FormsModule],
  templateUrl: './result-insights.component.html',
  styleUrl: './result-insights.component.css'
})
export class ResultInsightsComponent {
  @Input() consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  isKeywordExpanded = true;
  isCoverageExpanded = true;
  isThreatExpanded = true;
  isUrlsExpanded = true;
  searchQuery = '';
  filterOptions = ['All', 'Email', 'Name'];
  selectedFilter: string = 'All';
  allResults: string[] = ['Alex Robert', 'alex.lawson@example.com', 'alissd', 'alisdsd'];
  emails: string[] = [];
  names: string[] = [];

  uniqueUrls: UniqueLinkItem[] = [];

  keywordData = [
    { value: 3432, label: 'Total Found' },
    { value: 2435, label: 'Documents' },
    { value: 323, label: 'Links' },
    { value: 764, label: 'Pages' },
  ];

  coverageData = [
    { value: 3432, label: 'Total' },
    { value: 2435, label: 'Active', color: '#1ec773' },
    { value: 323, label: 'Inactive', color: '#e6534b' },
    { value: 764, label: 'Seldom', color: '#f08b36' },
  ];
  ngOnInit(): void {
    this.uniqueUrls = this.getUniqueLinks(this.consolidatedCallbackModel);
    const { emails, names } = this.extractNamesAndEmails(this.consolidatedCallbackModel);
    this.emails = emails;
    this.names = names;
    alert(this.emails.join(', '));
  }
  toggleKeyword() {
    this.isKeywordExpanded = !this.isKeywordExpanded;
  }

  toggleCoverage() {
    this.isCoverageExpanded = !this.isCoverageExpanded;
  }
  toggleThreatActor() {
    this.isThreatExpanded = !this.isThreatExpanded;
  }
  toggleUniqueUrls() {
    this.isUrlsExpanded = !this.isUrlsExpanded;
  }
  toggleFilter(option: string) {
    this.selectedFilter = option;
  }
  threatResults(): string[] {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return [];

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


  getUniqueLinks(consolidated: ConsolidatedCallbackModel): UniqueLinkItem[] {
    const linkMap = new Map<string, UniqueLinkItem>();

    const addToMap = (url: string | undefined, title: string | undefined, date?: string) => {
      if (url && !linkMap.has(url)) {
        const status = this.getStatus(date);
        linkMap.set(url, { url, title: title || 'Untitled', status });
      }
    };

    // General
    consolidated.generic_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.m_title, item.m_creation_date);
      item.m_clearnet_links?.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
      item.m_weblink?.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
      item.m_dumplink?.forEach(link => addToMap(link, item.m_title, item.m_creation_date));
    });

    // Leak (same as general if applicable)
    consolidated.leak_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.m_title, item.m_update_date);
    });

    // Defacement
    consolidated.defacement_model?.Result?.forEach(item => {
      addToMap(item.m_url, item.q, item.m_date_of_leak);
      item.m_source_url?.forEach(link => addToMap(link, item.q, item.m_date_of_leak));
    });

    // Social
    consolidated.social_model?.Result?.forEach(item => {
      addToMap(item.m_channel_url, item.m_title, item.m_message_date);
      item.m_weblink?.forEach(link => addToMap(link, item.m_title, item.m_message_date));
    });

    // Chat (if chat_model has links)
    consolidated.chat_model?.Result?.forEach(item => {
      item.m_weblink?.forEach(link =>
        addToMap(link, item.m_content || 'Chat Message', item.m_message_date)
      );
    });

    // Exploit (if exploit_model has links)
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

    // General
    consolidated.generic_model?.Result?.forEach(item => {
      extractFromText(item.m_content);
      extractFromText(item.m_highlighted);
      extractFromText(item.m_important_content);
      extractFromText(item.m_meta_description);
    });

    // Defacement
    consolidated.defacement_model?.Result?.forEach(item => {
      extractFromText(item.m_attacker);
      extractFromText(item.m_team);
    });

    // Social
    consolidated.social_model?.Result?.forEach(item => {
      extractFromText(item.m_sender_name);
      extractFromText(item.m_channel_name);
      extractFromText(item.m_title);
      extractFromText(item.m_summary);
      extractFromText(item.m_content);
    });

    // Leak
    consolidated.leak_model?.Result?.forEach(item => {
      extractFromText(item.m_title);
      extractFromText(item.m_content);
    });

    // Exploit
    consolidated.exploit_model?.Result?.forEach(item => {
      extractFromText(item.m_title);
    });

    // Chat
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

}