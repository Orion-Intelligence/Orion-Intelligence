import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result-insights',
  imports: [CommonModule, FormsModule],
  templateUrl: './result-insights.component.html',
  styleUrl: './result-insights.component.css'
})
export class ResultInsightsComponent {
  isKeywordExpanded = true;
  isCoverageExpanded = true;
  isThreatExpanded = true;
  isUrlsExpanded = true;
  searchQuery = '';
  filterOptions = ['All', 'Email', 'Name'];
  selectedFilter: string = 'All';
  allResults: string[] = ['Alex Robert', 'alex.lawson@example.com', 'alissd', 'alisdsd'];

  uniqueUrls = [
    { title: 'Dark Web Forum', url: 'http://exampleforum.onion', active: true },
    { title: 'Leaked Dump Site', url: 'http://dumpdata.com/leaks', active: false },
    { title: 'Hackers Blog', url: 'https://bloghacks.net/post', active: true },
    { title: 'Inactive Repo', url: 'https://repo.dead.net/', active: false },
    { title: 'Tracking Server', url: 'http://trackerxyz.org/', active: true },
  ];

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
    if (!this.searchQuery.trim()) return [];

    // You can later apply filter logic based on `selectedFilter` if needed
    return this.allResults.filter(item =>
      item.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

}