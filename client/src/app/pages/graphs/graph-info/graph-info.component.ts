import { Component, EventEmitter, input, Input, Output } from '@angular/core';
import { NgIf, TitleCasePipe } from '@angular/common';
import { ListingsComponent } from "../listings/listings.component";
import { Edge } from 'vis-network/standalone';

@Component({
  selector: 'app-graph-info',
  imports: [TitleCasePipe, NgIf, ListingsComponent],
  templateUrl: './graph-info.component.html'
})
export class GraphInfoComponent {
  @Output() physicsToggled = new EventEmitter<boolean>();
  @Output() expandToggled = new EventEmitter<boolean>();
  @Input() selectedType!: string;
  @Input() singleInput!: string;
  @Input() propertyType!: string;
  @Input() propertyValue!: string;
  @Input() physicsEnabled!: boolean;
  @Input() expandEnabled!: boolean;
  @Input() nodeSet!: any;
  @Input() rawEdges: Edge[] = [];
  @Input() result: any[] = []

  detailsOpen = true;
  indicatorsOpen = false;

  toggleCollapse(section: 'details' | 'indicators') {
    if (section === 'details') {
      this.detailsOpen = !this.detailsOpen;
    } else if (section === 'indicators') {
      this.indicatorsOpen = !this.indicatorsOpen;
    }
  }

  formatPropertyName(input: string): string {
    return input.replace(/^m_/, '').replace(/_/g, ' ').trim();
  }

  toggleAnimation() {
    this.physicsEnabled = !this.physicsEnabled;
    this.physicsToggled.emit(this.physicsEnabled);
  }
  toggleExpand() {
    this.expandEnabled = !this.expandEnabled;
    this.expandToggled.emit(this.expandEnabled);
  }

}
