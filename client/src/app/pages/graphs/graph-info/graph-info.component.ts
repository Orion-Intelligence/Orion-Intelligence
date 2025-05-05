import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf, TitleCasePipe} from '@angular/common';

@Component({
  selector: 'app-graph-info', imports: [TitleCasePipe, NgIf], templateUrl: './graph-info.component.html'
})
export class GraphInfoComponent {
  @Output() physicsToggled = new EventEmitter<boolean>();
  @Input() selectedType!: string;
  @Input() singleInput!: string;
  @Input() propertyType!: string;
  @Input() propertyValue!: string;

  animationEnabled = true;

  formatPropertyName(input: string): string {
    return input.replace(/^m_/, '').replace(/_/g, ' ').trim();
  }

  toggleAnimation() {
    this.animationEnabled = !this.animationEnabled;
    this.physicsToggled.emit(this.animationEnabled);
  }
}
