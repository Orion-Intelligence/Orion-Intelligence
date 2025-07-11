import { Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartOptions, ChartType, ChartDataset } from 'chart.js';
import { GraphModel } from '../../model/charts/charts.model'
@Component({
  selector: 'app-customize-bar-chart',
  imports: [NgChartsModule, NgIf],
  templateUrl: './customize-bar-chart.component.html'
})
export class CustomizeBarChartComponent {
  @Input() graphModel!: GraphModel;

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private hoveredIndex: number | null = null;
  private hoveredX: number | null = null;

  // Chart dimensions and padding
  private padding = { top: 40, right: 30, bottom: 30, left: 60 };
  private barWidthRatio = 0.6; // Ratio of bar width to available space per bar
  private maxChartValue = 40000; // Fixed max Y-axis value based on design

  ngAfterViewInit(): void {
    if (this.canvasRef && this.canvasRef.nativeElement) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d')!;
      this.resizeCanvas();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['graphModel'] && this.graphModel && this.ctx) {
      this.drawChart();
    }
  }

  ngOnDestroy(): void {
    // No specific cleanup needed beyond what HostListener handles for window resize
  }

  /**
   * Helper function to draw a rounded rectangle on the canvas.
   * @param ctx The 2D rendering context of the canvas.
   * @param x The x-coordinate of the top-left corner.
   * @param y The y-coordinate of the top-left corner.
   * @param width The width of the rectangle.
   * @param height The height of the rectangle.
   * @param radius The border radius for the corners.
   */
  // private drawRoundedRect(
  //   ctx: CanvasRenderingContext2D,
  //   x: number,
  //   y: number,
  //   width: number,
  //   height: number,
  //   radius: number
  // ): void {
  //   ctx.beginPath();
  //   ctx.moveTo(x + radius, y);
  //   ctx.lineTo(x + width - radius, y);
  //   ctx.arcTo(x + width, y, x + width, y + radius, radius);
  //   ctx.lineTo(x + width, y + height - radius);
  //   ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  //   ctx.lineTo(x + radius, y + height);
  //   ctx.arcTo(x, y + height, x, y + height - radius, radius);
  //   ctx.lineTo(x, y + radius);
  //   ctx.arcTo(x, y, x + radius, y, radius);
  //   ctx.closePath();
  //   ctx.fill();
  // }
  private drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    roundTopLeft: boolean = true,
    roundTopRight: boolean = true,
    roundBottomLeft: boolean = true,
    roundBottomRight: boolean = true
  ): void {
    ctx.beginPath();

    // Move to the starting point (top-left or after radius if rounded)
    ctx.moveTo(x + (roundTopLeft ? radius : 0), y);

    // Draw top line and top-right corner
    ctx.lineTo(x + width - (roundTopRight ? radius : 0), y);
    if (roundTopRight) {
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
    } else {
      ctx.lineTo(x + width, y); // Straight line to corner
    }

    // Draw right line and bottom-right corner
    ctx.lineTo(x + width, y + height - (roundBottomRight ? radius : 0));
    if (roundBottomRight) {
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    } else {
      ctx.lineTo(x + width, y + height); // Straight line to corner
    }

    // Draw bottom line and bottom-left corner
    ctx.lineTo(x + (roundBottomLeft ? radius : 0), y + height);
    if (roundBottomLeft) {
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
    } else {
      ctx.lineTo(x, y + height); // Straight line to corner
    }

    // Draw left line and top-left corner
    ctx.lineTo(x, y + (roundTopLeft ? radius : 0));
    if (roundTopLeft) {
      ctx.arcTo(x, y, x + radius, y, radius);
    } else {
      ctx.lineTo(x, y); // Straight line to corner
    }

    ctx.closePath();
    ctx.fill();
  }

  /**
   * Main function to draw the custom bar chart.
   * This function handles drawing bars, grid lines, labels, and hover effects.
   */
  private drawChart(): void {
    if (!this.ctx || !this.graphModel?.data?.length) return;

    const canvas = this.canvasRef.nativeElement;
    // Clear the entire canvas before redrawing
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate chart area dimensions
    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;

    // Calculate bar dimensions based on available chart width and data count
    const barCount = this.graphModel.data.length;
    const barSpacing = chartWidth / barCount; // Horizontal space allocated per bar
    const actualBarWidth = barSpacing * this.barWidthRatio; // Actual width of the bar
    const barOffset = (barSpacing - actualBarWidth) / 2; // Offset to center the bar in its allocated space

    // Y-axis scaling factor
    this.maxChartValue = Math.max(...this.graphModel.data.map(item => item.value));
    const yScale = chartHeight / this.maxChartValue;

    // Draw Y-axis grid lines and labels
    this.ctx.strokeStyle = '#374151'; // Darker gray for grid lines
    this.ctx.fillStyle = '#9CA3AF'; // Light gray for text labels
    this.ctx.font = '14px Inter, sans-serif'; // Set font for labels
    this.ctx.textAlign = 'right'; // Align text to the right for Y-axis labels

    // const gridLines = [0, 10000, 20000, 30000, 40000]; // Y-axis values for grid lines
    // --- Dynamic Grid Line Calculation ---
    const dataMax = Math.max(...this.graphModel.data.map(item => item.value));
    this.graphModel.data.map(item => item.target = dataMax);
    let dynamicMaxChartValue = 0;
    let stepSize = 0;

    if (dataMax === 0) {
      dynamicMaxChartValue = 100; // Default for all zero data
      stepSize = 25;
    } else {
      // Aim for 4 to 5 intervals
      const minIntervals = 4;

      // Find a raw step size
      const rawStep = dataMax / minIntervals;

      // Find the order of magnitude of the raw step
      const power = Math.floor(Math.log10(rawStep));
      const magnitude = Math.pow(10, power);

      // Try "nice" factors: 1, 2, 5
      let niceFactor = 1;
      if (rawStep / magnitude > 5) niceFactor = 10;
      else if (rawStep / magnitude > 2) niceFactor = 5;
      else if (rawStep / magnitude > 1) niceFactor = 2;

      stepSize = niceFactor * magnitude;

      // Calculate the dynamicMaxChartValue
      dynamicMaxChartValue = Math.ceil(dataMax / stepSize) * stepSize;
      // Ensure dynamicMaxChartValue is at least dataMax (and not 0 if dataMax > 0)
      if (dynamicMaxChartValue < dataMax) {
        dynamicMaxChartValue += stepSize;
      }
      if (dynamicMaxChartValue === 0 && dataMax > 0) {
        dynamicMaxChartValue = stepSize;
      }
    }

    this.maxChartValue = dynamicMaxChartValue; // Update the component property

    const gridLines: number[] = [];
    for (let i = 0; i <= this.maxChartValue; i += stepSize) {
      gridLines.push(i);
    }
    // Ensure the last grid line is exactly maxChartValue if not already added due to floating point
    if (gridLines[gridLines.length - 1] !== this.maxChartValue) {
      gridLines.push(this.maxChartValue);
    }
    // --- End Dynamic Grid Line Calculation ---
    gridLines.forEach(value => {
      const y = this.padding.top + chartHeight - (value * yScale); // Calculate Y-position on canvas
      this.ctx.beginPath();
      this.ctx.setLineDash([5, 5]); // Set dashed line pattern
      this.ctx.moveTo(this.padding.left, y);
      this.ctx.lineTo(this.padding.left + chartWidth, y);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset line dash to solid

      // Draw Y-axis labels (e.g., "10k", "20k")
      if (value > 0) {
        this.ctx.fillText(`${value}`, this.padding.left - 10, y + 5);
      } else {
        this.ctx.fillText(`0`, this.padding.left - 10, y + 5);
      }
    });

    // Draw Bars
    this.graphModel.data.forEach((item, index) => {
      const x = this.padding.left + (index * barSpacing) + barOffset; // X-position for the current bar
      const filledHeight = item.value * yScale; // Height of the filled portion
      const unfilledHeight = (item.target - item.value) * yScale; // Height of the unfilled portion

      const filledY = this.padding.top + chartHeight - filledHeight; // Y-position for the top of the filled part
      const unfilledY = filledY - unfilledHeight; // Y-position for the top of the unfilled part (overall bar top)

      const barRadius = 11; // Fixed bar border radius as per new design

      // Draw unfilled part (white background) - all corners rounded
      this.ctx.fillStyle = 'white';
      this.drawRoundedRect(this.ctx, x, unfilledY, actualBarWidth, unfilledHeight + filledHeight, barRadius, true, true, true, true);

      // Draw filled part (#2A5784) - bottom corners rounded, top corners NOT rounded
      this.ctx.fillStyle = '#2A5784';
      this.drawRoundedRect(this.ctx, x, filledY, actualBarWidth, filledHeight, barRadius, false, false, true, true);

      // Draw X-axis labels
      this.ctx.fillStyle = '#9CA3AF';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.name, x + actualBarWidth / 2, this.padding.top + chartHeight + 25);

      // Draw horizontal small line on top of filled bar (always present)
      const smallLineLength = actualBarWidth * 1.2; // 40% of bar width
      const smallLineX = x + actualBarWidth / 2 - smallLineLength / 2; // Center it on the bar
      const smallLineY = filledY - 2; // Position slightly above the top of the filled bar
      const smallLineRadius = 2; // Radius for the small line

      this.ctx.fillStyle = '#2A7DCF'; // Color for the small line
      this.drawRoundedRect(this.ctx, smallLineX, smallLineY, smallLineLength, 4, smallLineRadius, true, true, true, true); // Small line has all corners rounded
    });

    // Draw hover effect if an item is hovered
    if (this.hoveredIndex !== null && this.hoveredX !== null) {
      const item = this.graphModel.data[this.hoveredIndex];
      const barXCenter = this.padding.left + (this.hoveredIndex * barSpacing) + barOffset + actualBarWidth / 2;
      const barTopY = this.padding.top + chartHeight - (item.value * yScale); // Y-position of the top of the filled bar

      // Draw vertical dashed line for hover indicator
      this.ctx.strokeStyle = '#60A5FA'; // Lighter blue for hover line
      this.ctx.setLineDash([5, 5]); // Dashed line pattern
      this.ctx.beginPath();
      this.ctx.moveTo(barXCenter, this.padding.top);
      this.ctx.lineTo(barXCenter, this.padding.top + chartHeight);
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset line dash

      // Draw circle indicator at the top of the hovered bar
      this.ctx.beginPath();
      this.ctx.arc(barXCenter, barTopY, 6, 0, Math.PI * 2); // Draw circle
      this.ctx.fillStyle = '#60A5FA'; // Circle fill color
      this.ctx.fill();
      this.ctx.strokeStyle = '#1F2937'; // Dark border for the circle
      this.ctx.lineWidth = 2; // Thicker border
      this.ctx.stroke();
      this.ctx.lineWidth = 1; // Reset line width

      // Draw tooltip bubble with value
      const tooltipText = `${item.value.toLocaleString()}`; // Format value with commas
      this.ctx.font = '16px Inter, sans-serif'; // Font for tooltip text
      const textMetrics = this.ctx.measureText(tooltipText);
      const textWidth = textMetrics.width;
      const textHeight = 20;
      const tooltipPadding = 10;
      const tooltipWidth = textWidth + tooltipPadding * 2;
      const tooltipHeight = textHeight + tooltipPadding * 2;

      const tooltipX = barXCenter - tooltipWidth / 2; // Center tooltip above the bar
      const tooltipY = barTopY - tooltipHeight - 15; // Position above the circle indicator

      // Draw tooltip background (rounded rectangle)
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      const tooltipRadius = 8;
      this.ctx.moveTo(tooltipX + tooltipRadius, tooltipY);
      this.ctx.lineTo(tooltipX + tooltipWidth - tooltipRadius, tooltipY);
      this.ctx.arcTo(tooltipX + tooltipWidth, tooltipY, tooltipX + tooltipWidth, tooltipY + tooltipRadius, tooltipRadius);
      this.ctx.lineTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight - tooltipRadius);
      this.ctx.arcTo(tooltipX + tooltipWidth, tooltipY + tooltipHeight, tooltipX + tooltipWidth - tooltipRadius, tooltipY + tooltipHeight, tooltipRadius);
      this.ctx.lineTo(tooltipX + tooltipRadius, tooltipY + tooltipHeight);
      this.ctx.arcTo(tooltipX, tooltipY + tooltipHeight, tooltipX, tooltipY + tooltipHeight - tooltipRadius, tooltipRadius);
      this.ctx.lineTo(tooltipX, tooltipY + tooltipRadius);
      this.ctx.arcTo(tooltipX, tooltipY, tooltipX + tooltipRadius, tooltipY, tooltipRadius); // Corrected: tooltipX, tooltipY, tooltipX + radius, tooltipY, radius
      this.ctx.closePath();
      this.ctx.fill();

      // Draw tooltip arrow (small triangle pointing down from the bubble)
      this.ctx.beginPath();
      this.ctx.moveTo(barXCenter - 5, barTopY - 15);
      this.ctx.lineTo(barXCenter + 5, barTopY - 15);
      this.ctx.lineTo(barXCenter, barTopY - 5);
      this.ctx.closePath();
      this.ctx.fillStyle = 'white';
      this.ctx.fill();

      // Draw tooltip text
      this.ctx.fillStyle = '#1F2937'; // Dark text color
      this.ctx.textAlign = 'center'; // Center align text within the bubble
      this.ctx.fillText(tooltipText, barXCenter, tooltipY + tooltipHeight / 2 + 5);
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event?: Event): void {
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement;
    if (container) {
      // Set canvas dimensions to match container, but respect max-width/height
      // The CSS will handle the max-width/height of the container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight - (this.graphModel?.title ? 40 : 0) - 30; // Adjust for title and separator line
      this.drawChart();
    }
  }

  onMouseMove(event: MouseEvent): void {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const barCount = this.graphModel.data.length;
    const barSpacing = chartWidth / barCount;
    const actualBarWidth = barSpacing * this.barWidthRatio;
    const barOffset = (barSpacing - actualBarWidth) / 2;

    let newHoveredIndex: number | null = null;
    for (let i = 0; i < barCount; i++) {
      const barXStart = this.padding.left + (i * barSpacing) + barOffset;
      const barXEnd = barXStart + actualBarWidth;

      if (mouseX >= barXStart && mouseX <= barXEnd &&
        mouseY >= this.padding.top && mouseY <= canvas.height - this.padding.bottom) {
        newHoveredIndex = i;
        break;
      }
    }

    if (newHoveredIndex !== this.hoveredIndex || mouseX !== this.hoveredX) {
      this.hoveredIndex = newHoveredIndex;
      this.hoveredX = mouseX;
      this.drawChart();
    }
  }

  onMouseLeave(): void {
    if (this.hoveredIndex !== null) {
      this.hoveredIndex = null;
      this.hoveredX = null;
      this.drawChart();
    }
  }
}
