import { Component, Input } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Edge } from 'vis-network/standalone';

@Component({
  selector: 'app-listings',
  imports: [NgFor, NgIf],
  templateUrl: './listings.component.html',
})
export class ListingsComponent {
  @Input() nodeSet!: any;
  @Input() rawEdges: Edge[] = [];
  @Input() result: any[] = []

  collapseToggle = false;

  toggleCollapse() {
    this.rawEdges.forEach(edge => {
      console.log(`From: ${edge.from}, To: ${edge.to}`);
    });
    this.collapseToggle = !this.collapseToggle;
  }
  openMenu(id: string) {

  }
  checkDocument(id: string): boolean {
    let category = this.checkCluster(id);
    if (category === '')
      return false;
    else
      return true;
  }
  checkCluster(id: string): string {
    let category = '';

    if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/general') ||
      (edge.from === 'cti_vertices/general')
    )) {
      category = 'general';
    } else if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/leak') ||
      (edge.from === 'cti_vertices/leak')
    )) {
      category = 'leak';
    } else if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/defacement') ||
      (edge.from === 'cti_vertices/defacement')
    )) {
      category = 'defacement';
    } else if (this.rawEdges.some((edge) =>
      (edge.to === 'cti_vertices/chat') ||
      (edge.from === 'cti_vertices/chat')
    )) {
      category = 'chat';
    }
    return category
  }
  extractId(path: string): string {
    const match = path.match(/[a-f0-9]{64}/);
    return match ? match[0] : '';
  }
  shortenId(id: string): string {
    return id.length > 15 ? id.slice(0, 21) + '...' : id;
  }
}
