import { Component, OnInit, signal } from '@angular/core';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';

import * as echarts from 'echarts';
import worldMap from '../../../../../src/assets/data/map/world.json';

@Component({
  selector: 'app-world-heatmap',
  imports: [NgxEchartsModule],
  templateUrl: './world-heatmap.component.html',
  styleUrl: './world-heatmap.component.css'
})
export class WorldHeatmapComponent implements OnInit {

  chartOption = signal<EChartsOption>({});


  ngOnInit(): void {

    // Register world map
    echarts.registerMap('world', worldMap as any);

    // Example data
    const countryData = [
      { name: 'Pakistan', value: 120 },
      { name: 'United States', value: 300 },
      { name: 'India', value: 250 },
      { name: 'China', value: 400 },
      { name: 'Germany', value: 180 }
    ];

    this.chartOption.set({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name} : ${params.value || 0}`;
        }
      },

      visualMap: {
        min: 0,
        max: 400,
        left: 'left',
        bottom: '5%',
        text: ['High', 'Low'],
        calculable: true,
        inRange: {
          color: ['#e0f3ff', '#0057b7'] // light → dark
        }
      },

      series: [
        {
          name: 'Country Data',
          type: 'map',
          map: 'world',
          roam: true, // allow zoom and pan
          emphasis: {
            label: {
              show: true
            }
          },
          data: countryData
        }
      ]
    });
  }
}