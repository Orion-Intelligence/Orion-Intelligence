import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { ScanData, SecurityPosture, Finding } from '../../model/security-scan/security.scan.results.model';
Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels, annotationPlugin);

@Component({
  selector: 'app-security-scan-results',
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './security-scan-results.component.html',
  styleUrl: './security-scan-results.component.css'
})
export class SecurityScanResultsComponent implements OnInit {
  chartType = 'doughnut';
  meterChartType = 'doughnut';
  chartPlugins = [ChartDataLabels];

  scanData: ScanData = {
    url: 'https://bbc.com',
    host: 'BBC.com',
    port: 443,
    scanDate: 'July 19, 2025',
    scannedBy: 'Orion Intelligence'
  };

  securityPosture: SecurityPosture = {
    riskAppetite: 'Medium Risk Found',
    score: 65,
    riskBreakdown: {
      total: 11,
      medium: 3,
      low: 1,
      informational: 7
    }
  };

  findings: Finding[] = [
    {
      id: 1,
      title: 'Content Security Policy (CSP) Header Not Set',
      description: 'CSP is an added layer of security that helps mitigate certain types of attacks...',
      note: '*The page includes script files from a third-party domain.',
      severity: 'Medium Risk',
      confidence: 'High Confidence',
      instances: '12 Found',
      expanded: false,
      details: [],
      technicalDetails: {
        foundOn: 'https://bbc.com (GET request)',
        instancesCount: 12,
        cweId: 'CWE-ID: 829',
        wascId: 'WASC-ID: 15'
      }
    },
    {
      id: 2,
      title: 'Cross-Domain JavaScript Source File Inclusion',
      description: 'CSP helps mitigate XSS and injection attacks...',
      note: '*Page includes third-party script files.',
      severity: 'Low Risk',
      confidence: 'Medium Confidence',
      instances: '12 Found',
      expanded: false,
      details: [
        { id: 1, url: 'https://cdn.getHistory.com/pub13c/46210413674/bbcv_prod.js' },
        { id: 2, url: 'https://cdn.ithypress.com/api/ithypress.min.js' },
        { id: 3, url: 'https://emp.bbci.co.uk/emp/hump-4/hump-4.js' }
      ],
      technicalDetails: {
        foundOn: 'https://bbc.com (GET request)',
        instancesCount: 19,
        cweId: 'CWE-ID: 829',
        wascId: 'WASC-ID: 15'
      }
    }
  ];

  meterChartData: any;
  meterChartOptions: any;

  riskChartData: any;
  chartOptions: any;

  ngOnInit(): void {
    this.meterChartData = {
      labels: ['Risk Score', 'Remaining'],
      datasets: [
        {
          data: [this.securityPosture.score, 100 - this.securityPosture.score],
          backgroundColor: ['#4285F4', '#e0e0e0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270,
          cutout: '80%'
        }
      ]
    };

    this.meterChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        annotation: {
          annotations: {
            label1: {
              type: 'doughnutLabel',
              content: 'Risk Appetite:',
              position: {
                x: '50%',
                y: '100%'
              },
              font: {
                size: 16,
              },
              color: 'gray'
            },
            label2: {
              type: 'doughnutLabel',
              content: this.securityPosture.riskAppetite,
              position: {
                x: '50%',
                y: '0%'
              },
              font: {
                size: 16,
                weight: 'bold',

              },
              color: '#ffffff'
            }
          }
        },
        doughnutlabel: {
          labels: [
            {
              text: `${this.securityPosture.score}%`,
              font: { size: '20' }
            },
            {
              text: 'Overall'
            }
          ]
        }
      }
    };

    this.riskChartData = {
      labels: ['Low', 'Medium', 'Informational'],
      datasets: [
        {
          data: [this.securityPosture.riskBreakdown.low, this.securityPosture.riskBreakdown.medium, this.securityPosture.riskBreakdown.informational], // Adjusted total for demo
          backgroundColor: ['#00BCD4', '#FFC107', '#FF5722'],
          borderWidth: 0
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
        doughnutlabel: {
          labels: [
            {
              text: this.securityPosture.riskBreakdown.total.toString(),
              font: { size: '20' }
            },
            {
              text: 'Risks'
            }
          ]
        }
      }
    };
  }

  toggleExpand(finding: any): void {
    finding.expanded = !finding.expanded;
  }
}
