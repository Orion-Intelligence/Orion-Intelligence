import { Component, Input, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { GraphModel } from '../../model/charts/charts.model'

@Component({
  selector: 'app-graphs',
  imports: [NgChartsModule, NgIf],
  templateUrl: './charts.component.html',
})
export class GraphsComponent {
  @Input() graphModel!: GraphModel;


  public chartType!: ChartType;
  public chartLabels: string[] = [];
  public chartData: number[] = [];
  public chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false
  };
  public chartLegend = true;
  public chartPlugins = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graphModel'] && this.graphModel) {
      this.updateChart();
    }
  }

  updateChart(): void {
    if (!this.graphModel?.data?.length) return;

    this.chartLabels = this.graphModel.data.map(item => item.name);
    this.chartData = this.graphModel.data.map(item => item.value);
    this.chartType = this.graphModel.type;
    this.chartOptions = this.graphModel.type;
  }
}
