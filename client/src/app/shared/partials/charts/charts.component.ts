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
  // public chartOptions: ChartOptions<any> = {
  //   responsive: true,
  //   maintainAspectRatio: false
  // };
  public chartLegend = true;
  public chartPlugins = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graphModel'] && this.graphModel) {
      this.updateChart();
    }
  }

  // updateChart(): void {
  //   if (!this.graphModel?.data?.length) return;

  //   this.chartLabels = this.graphModel.data.map(item => item.name);
  //   this.chartData = this.graphModel.data.map(item => item.value);
  //   this.chartType = this.graphModel.type;
  //   this.chartOptions = this.graphModel.type;
  // }

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







// import { Component, Input, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { GraphModel, GraphDataItem } from '../../model/charts/charts.model'

// @Component({
//   selector: 'app-graphs',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './charts.component.html',
//   styleUrls: ['./charts.component.css']
// })
// export class GraphsComponent implements AfterViewInit, OnDestroy {
//   @Input() graphModel!: GraphModel;

//   @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
//   private ctx!: CanvasRenderingContext2D;
//   private hoveredIndex: number | null = null;
//   private hoveredX: number | null = null;

//   // Chart dimensions and padding
//   private padding = { top: 60, right: 30, bottom: 60, left: 60 };
//   private barWidthRatio = 0.6; // Ratio of bar width to available space per bar
//   private maxChartValue = 40000; // Fixed max Y-axis value based on design

//   ngAfterViewInit(): void {
//     // Ensure the canvas context is available before drawing
//     if (this.canvasRef && this.canvasRef.nativeElement) {
//       this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
//       this.resizeCanvas(); // Initial resize and draw
//     }
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     // Redraw chart if graphModel input changes and context is ready
//     if (changes['graphModel'] && this.graphModel && this.ctx) {
//       this.drawChart();
//     }
//   }

//   ngOnDestroy(): void {
//     // No specific cleanup needed for canvas drawing, as it's not an ongoing animation loop
//   }

//   /**
//    * Helper function to draw a rounded rectangle on the canvas.
//    * @param ctx The 2D rendering context of the canvas.
//    * @param x The x-coordinate of the top-left corner.
//    * @param y The y-coordinate of the top-left corner.
//    * @param width The width of the rectangle.
//    * @param height The height of the rectangle.
//    * @param radius The border radius for the corners.
//    */
//   private drawRoundedRect(
//     ctx: CanvasRenderingContext2D,
//     x: number,
//     y: number,
//     width: number,
//     height: number,
//     radius: number
//   ): void {
//     ctx.beginPath();
//     ctx.moveTo(x + radius, y);
//     ctx.lineTo(x + width - radius, y);
//     ctx.arcTo(x + width, y, x + width, y + radius, radius);
//     ctx.lineTo(x + width, y + height - radius);
//     ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
//     ctx.lineTo(x + radius, y + height);
//     ctx.arcTo(x, y + height, x, y + height - radius, radius);
//     ctx.lineTo(x, y + radius);
//     ctx.arcTo(x, y, x + radius, y, radius);
//     ctx.closePath();
//     ctx.fill();
//   }

//   /**
//    * Main function to draw the custom bar chart.
//    * This function handles drawing bars, grid lines, labels, and hover effects.
//    */
//   private drawChart(): void {
//     if (!this.ctx || !this.graphModel?.data?.length) return;

//     const canvas = this.canvasRef.nativeElement;
//     // Clear the entire canvas before redrawing
//     this.ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Calculate chart area dimensions
//     const chartWidth = canvas.width - this.padding.left - this.padding.right;
//     const chartHeight = canvas.height - this.padding.top - this.padding.bottom;

//     // Calculate bar dimensions based on available chart width and data count
//     const barCount = this.graphModel.data.length;
//     const barSpacing = chartWidth / barCount; // Horizontal space allocated per bar
//     const actualBarWidth = barSpacing * this.barWidthRatio; // Actual width of the bar
//     const barOffset = (barSpacing - actualBarWidth) / 2; // Offset to center the bar in its allocated space

//     // Y-axis scaling factor
//     const yScale = chartHeight / this.maxChartValue;

//     // Draw Y-axis grid lines and labels
//     this.ctx.strokeStyle = '#374151'; // Darker gray for grid lines
//     this.ctx.fillStyle = '#9CA3AF'; // Light gray for text labels
//     this.ctx.font = '14px Inter, sans-serif'; // Set font for labels
//     this.ctx.textAlign = 'right'; // Align text to the right for Y-axis labels

//     const gridLines = [0, 10000, 20000, 30000, 40000]; // Y-axis values for grid lines
//     gridLines.forEach(value => {
//       const y = this.padding.top + chartHeight - (value * yScale); // Calculate Y-position on canvas
//       this.ctx.beginPath();
//       this.ctx.setLineDash([5, 5]); // Set dashed line pattern
//       this.ctx.moveTo(this.padding.left, y);
//       this.ctx.lineTo(this.padding.left + chartWidth, y);
//       this.ctx.stroke();
//       this.ctx.setLineDash([]); // Reset line dash to solid

//       // Draw Y-axis labels (e.g., "10k", "20k")
//       if (value > 0) {
//         this.ctx.fillText(`${value / 1000}k`, this.padding.left - 10, y + 5);
//       } else {
//         this.ctx.fillText(`0`, this.padding.left - 10, y + 5);
//       }
//     });

//     // Draw Bars
//     this.graphModel.data.forEach((item, index) => {
//       const x = this.padding.left + (index * barSpacing) + barOffset; // X-position for the current bar
//       const filledHeight = item.value * yScale; // Height of the filled portion
//       const unfilledHeight = (item.target - item.value) * yScale; // Height of the unfilled portion

//       const filledY = this.padding.top + chartHeight - filledHeight; // Y-position for the top of the filled part
//       const unfilledY = filledY - unfilledHeight; // Y-position for the top of the unfilled part (overall bar top)

//       const barRadius = actualBarWidth / 4; // Radius for rounded corners, relative to bar width

//       // Draw unfilled part (top white/light gray portion)
//       this.ctx.fillStyle = '#E5E7EB'; // Light gray/white color
//       // Draw the entire bar shape (filled + unfilled) with rounded top corners
//       this.drawRoundedRect(this.ctx, x, unfilledY, actualBarWidth, unfilledHeight + filledHeight, barRadius);

//       // Draw filled part (dark blue portion)
//       this.ctx.fillStyle = '#2A5784'; // Dark blue color
//       // Draw the filled portion with rounded bottom corners (and top if it's the only part)
//       this.drawRoundedRect(this.ctx, x, filledY, actualBarWidth, filledHeight, barRadius);

//       // Draw X-axis labels (e.g., "Mon", "Tue")
//       this.ctx.fillStyle = '#9CA3AF'; // Light gray for labels
//       this.ctx.textAlign = 'center'; // Center align text
//       this.ctx.fillText(item.name, x + actualBarWidth / 2, this.padding.top + chartHeight + 25);
//     });

//     // Draw hover effect if an item is currently hovered
//     if (this.hoveredIndex !== null && this.hoveredX !== null) {
//       const item = this.graphModel.data[this.hoveredIndex];
//       const barXCenter = this.padding.left + (this.hoveredIndex * barSpacing) + barOffset + actualBarWidth / 2;
//       const barTopY = this.padding.top + chartHeight - (item.value * yScale); // Y-position of the top of the filled bar

//       // Draw vertical dashed line for hover indicator
//       this.ctx.strokeStyle = '#60A5FA'; // Lighter blue for hover line
//       this.ctx.setLineDash([5, 5]); // Dashed line pattern
//       this.ctx.beginPath();
//       this.ctx.moveTo(barXCenter, this.padding.top);
//       this.ctx.lineTo(barXCenter, this.padding.top + chartHeight);
//       this.ctx.stroke();
//       this.ctx.setLineDash([]); // Reset line dash

//       // Draw circle indicator at the top of the hovered bar
//       this.ctx.beginPath();
//       this.ctx.arc(barXCenter, barTopY, 6, 0, Math.PI * 2); // Draw circle
//       this.ctx.fillStyle = '#60A5FA'; // Circle fill color
//       this.ctx.fill();
//       this.ctx.strokeStyle = '#1F2937'; // Dark border for the circle
//       this.ctx.lineWidth = 2; // Thicker border
//       this.ctx.stroke();
//       this.ctx.lineWidth = 1; // Reset line width

//       // Draw tooltip bubble with value
//       const tooltipText = `$${item.value.toLocaleString()}`; // Format value with commas
//       this.ctx.font = '16px Inter, sans-serif'; // Font for tooltip text
//       const textMetrics = this.ctx.measureText(tooltipText);
//       const textWidth = textMetrics.width;
//       const textHeight = 20; // Approximate height of the text
//       const tooltipPadding = 10;
//       const tooltipWidth = textWidth + tooltipPadding * 2;
//       const tooltipHeight = textHeight + tooltipPadding * 2;

//       const tooltipX = barXCenter - tooltipWidth / 2; // Center tooltip above the bar
//       const tooltipY = barTopY - tooltipHeight - 15; // Position above the circle indicator

//       // Draw tooltip background (rounded rectangle)
//       this.ctx.fillStyle = 'white';
//       this.ctx.beginPath();
//       const tooltipRadius = 8;
//       this.ctx.moveTo(tooltipX + tooltipRadius, tooltipY);
//       this.ctx.lineTo(tooltipX + tooltipWidth - tooltipRadius, tooltipY);
//       this.ctx.arcTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + tooltipRadius, tooltipRadius);
//       this.ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - tooltipRadius);
//       this.ctx.arcTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - tooltipRadius, tooltipY + tooltipHeight, tooltipRadius);
//       this.ctx.lineTo(tooltipX + tooltipRadius, tooltipY + tooltipHeight);
//       this.ctx.arcTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - tooltipRadius, tooltipRadius);
//       this.ctx.lineTo(tooltipX, tooltipY + tooltipRadius);
//       this.ctx.arcTo(tooltipX, tooltipY, tooltipX + tooltipRadius, tooltipY, tooltipRadius);
//       this.ctx.closePath();
//       this.ctx.fill();

//       // Draw tooltip arrow (small triangle pointing down from the bubble)
//       this.ctx.beginPath();
//       this.ctx.moveTo(barXCenter - 5, barTopY - 15);
//       this.ctx.lineTo(barXCenter + 5, barTopY - 15);
//       this.ctx.lineTo(barXCenter, barTopY - 5);
//       this.ctx.closePath();
//       this.ctx.fillStyle = 'white';
//       this.ctx.fill();

//       // Draw tooltip text
//       this.ctx.fillStyle = '#1F2937'; // Dark text color
//       this.ctx.textAlign = 'center'; // Center align text within the bubble
//       this.ctx.fillText(tooltipText, barXCenter, tooltipY + tooltipHeight / 2 + 5);
//     }
//   }

//   /**
//    * Resizes the canvas to fit its parent container and redraws the chart.
//    * This is called initially and on window resize events.
//    */
//   @HostListener('window:resize', ['$event'])
//   onResize(event?: Event): void {
//     this.resizeCanvas();
//   }

//   private resizeCanvas(): void {
//     const canvas = this.canvasRef.nativeElement;
//     const container = canvas.parentElement;
//     if (container) {
//       // Set canvas dimensions to match container, maintaining aspect ratio
//       canvas.width = container.clientWidth;
//       canvas.height = Math.min(container.clientWidth * 0.6, 400); // Max height 400px
//       // Redraw chart after resizing
//       this.drawChart();
//     }
//   }

//   /**
//    * Handles mouse movement over the canvas to detect bar hovers.
//    * @param event The mouse event object.
//    */
//   onMouseMove(event: MouseEvent): void {
//     const canvas = this.canvasRef.nativeElement;
//     const rect = canvas.getBoundingClientRect(); // Get canvas position relative to viewport
//     const mouseX = event.clientX - rect.left; // Mouse X relative to canvas
//     const mouseY = event.clientY - rect.top; // Mouse Y relative to canvas

//     const chartWidth = canvas.width - this.padding.left - this.padding.right;
//     const barCount = this.graphModel.data.length;
//     const barSpacing = chartWidth / barCount;
//     const actualBarWidth = barSpacing * this.barWidthRatio;
//     const barOffset = (barSpacing - actualBarWidth) / 2;

//     let newHoveredIndex: number | null = null;
//     // Iterate through bars to check for hover
//     for (let i = 0; i < barCount; i++) {
//       const barXStart = this.padding.left + (i * barSpacing) + barOffset;
//       const barXEnd = barXStart + actualBarWidth;

//       // Check if mouse is horizontally within a bar and vertically within the chart area
//       if (mouseX >= barXStart && mouseX <= barXEnd &&
//         mouseY >= this.padding.top && mouseY <= canvas.height - this.padding.bottom) {
//         newHoveredIndex = i;
//         break;
//       }
//     }

//     // Only redraw if the hovered bar or mouse X position has changed
//     if (newHoveredIndex !== this.hoveredIndex || mouseX !== this.hoveredX) {
//       this.hoveredIndex = newHoveredIndex;
//       this.hoveredX = mouseX;
//       this.drawChart();
//     }
//   }

//   /**
//    * Handles mouse leaving the canvas, clearing any hover effects.
//    */
//   onMouseLeave(): void {
//     // If a bar was hovered, clear the hover state and redraw
//     if (this.hoveredIndex !== null) {
//       this.hoveredIndex = null;
//       this.hoveredX = null;
//       this.drawChart();
//     }
//   }
// }