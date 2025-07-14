import { Component, Input, SimpleChanges } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ChartDataset } from 'chart.js';
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
    this.chartType = this.graphModel.type;

    this.chartData = this.graphModel.data.map(item => item.value);

    const backgroundColors = this.graphModel.data.map(item => '#2A5784');



    this.chartPlugins = [];

    this.chartDatasets = [{
      data: this.chartData,
      backgroundColor: backgroundColors,
      borderWidth: 0,
      barThickness: 30
    }];
  }

  public chartOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          color: '#888', // X-axis label color
          font: {
            size: 14
          }
        },
        grid: {
          display: false // hide grid lines
        }
      },
      y: {
        ticks: {
          color: '#888', // Y-axis label color
          font: {
            size: 14
          }
        },
        grid: {
          borderDash: [4, 4],
          color: '#E5E5EF' // grid line color
        },
        title: {
          display: true,
          text: 'Sales',
          color: '#555',
          font: {
            size: 16,
            weight: 'bold'
          }
        }
      }
    },
    plugins: {
      legend: {
        onClick: null as any,
        display: false,
        labels: {
          color: '#444'
        }
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#333',
        titleColor: '#fff',
        bodyColor: '#fff'
      }
    }
  };
  public chartDatasets: ChartDataset<ChartType, number[]>[] = [];
}

