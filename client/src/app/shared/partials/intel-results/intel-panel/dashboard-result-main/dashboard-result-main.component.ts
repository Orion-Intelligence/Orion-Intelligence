import { Component } from '@angular/core';
import { ResultItem } from '../../../../model/intel-results/general/search_general_callback_model';
import {ResultSectionComponent} from './result-section/result-section.component';
import {ResultListComponent} from './result-list/result-list.component';
import {CommonModule, NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-dashboard-result-main',
  templateUrl: './dashboard-result-main.component.html',
  styleUrls: ['./dashboard-result-main.component.css'],
  imports: [
    ResultListComponent,
    CommonModule,
    ResultSectionComponent,
    NgOptimizedImage
  ]
})
export class DashboardResultMainComponent {
  resultItem: ResultItem = new ResultItem({
    m_title: "Portugal Umaor Database leaked data collection",
    m_url: "https://www.xyzurl.com/Trusted-Internet?node-id=60-271",
    m_content: "Lorem ipsum dolor sit amet, bitcoin trend adipiscing elit.",
    m_network: "Onion",
    m_update_date: "12/12/2024",
    m_creation_date: "12/12/2024",
    m_section: ["General", "Leaks", "Marketplace"],
    m_content_type: ["Sections", "Email", "Name", "Content", "Address"],
    m_important_content: "Lorem ipsum dolor sit amet consectetur. Bibendum egestas massa id tempus a nisl nulla...",
    m_meta_description: "Lorem ipsum dolor sit amet consectetur. Congue egestas congue a placerat nullam dictum nunc...",
    m_validity_score: 80,
    m_hash: "active"
  });

  // Dummy data for sections
  sections = [
    { title: "Section Heading", content: "Lorem ipsum dolor sit amet consectetur. Bibendum egestas massa..." },
    { title: "Section Heading", content: "Lorem ipsum dolor sit amet consectetur. Congue egestas congue a..." }
  ];

  // Dummy data for list items
  listItems = ["Item 1", "Item 2", "Item 3", "Item 4"];

  activeTab: string = "Sections";

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
