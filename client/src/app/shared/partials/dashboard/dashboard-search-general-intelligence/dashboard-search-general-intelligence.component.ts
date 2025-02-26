import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-search-general-intelligence',
  standalone: true,  // If using standalone
  imports: [CommonModule],  // Fix for *ngFor
  templateUrl: './dashboard-search-general-intelligence.component.html',
  styleUrls: ['./dashboard-search-general-intelligence.component.css']
})
export class DashboardSearchGeneralIntelligenceComponent {
  items = Array.from({ length: 10 }).map((_, i) => ({
    header: `Header ${i + 1}`,
    description: `Description ${i + 1}`,
    url: `https://example.com/page${i + 1}`,
    publishedOn: `2025-02-${10 + i}`,
    network: `Network ${i + 1}`,
    updatedOn: `2025-02-${15 + i}`,
    status: i % 2 === 0 ? 'Active' : 'Inactive',
  }));
}
