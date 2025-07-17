import { Component, Input, HostListener } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { GraphModel } from '../../model/charts/charts.model';
import { TooltipDirective } from '../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-customize-bar-chart',
  imports: [NgFor, CommonModule, TooltipDirective],
  templateUrl: './customize-bar-chart.component.html'
})
export class CustomizeBarChartComponent {
  @Input() graphModel!: GraphModel;

  hoveredIndex: number | null = null;

  get roundedMaxValue(): number {
    const max = Math.max(...this.graphModel.data.map(d => d.value), 1);

    if (max === 0) return 100;

    const minIntervals = 4;
    const rawStep = max / minIntervals;
    const power = Math.floor(Math.log10(rawStep));
    const magnitude = Math.pow(10, power);

    let niceFactor = 1;
    if (rawStep / magnitude > 5) niceFactor = 10;
    else if (rawStep / magnitude > 2) niceFactor = 5;
    else if (rawStep / magnitude > 1) niceFactor = 2;

    const stepSize = niceFactor * magnitude;
    const roundedMax = Math.ceil(max / stepSize) * stepSize;

    return roundedMax;
  }

  onMouseEnter(index: number): void {
    this.hoveredIndex = index;
  }

  onMouseLeave(): void {
    this.hoveredIndex = null;
  }
  round(value: number): number {
    return Math.round(value);
  }

}
