import { Component, ElementRef, HostListener, Input, SimpleChanges, ViewChild } from '@angular/core';
import { NgIf } from '@angular/common';
import { GraphModel } from '../../model/charts/charts.model'
@Component({
  selector: 'app-customize-bar-chart',
  imports: [NgIf],
  templateUrl: './customize-bar-chart.component.html'
})
export class CustomizeBarChartComponent {
  @Input() graphModel!: GraphModel;

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private hoveredIndex: number | null = null;
  private hoveredX: number | null = null;

  private padding = { top: 40, right: 30, bottom: 30, left: 60 };
  private barWidthRatio = 0.5;
  private maxChartValue = 40000;

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

    ctx.moveTo(x + (roundTopLeft ? radius : 0), y);

    ctx.lineTo(x + width - (roundTopRight ? radius : 0), y);
    if (roundTopRight) {
      ctx.arcTo(x + width, y, x + width, y + radius, radius);
    } else {
      ctx.lineTo(x + width, y);
    }

    ctx.lineTo(x + width, y + height - (roundBottomRight ? radius : 0));
    if (roundBottomRight) {
      ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    } else {
      ctx.lineTo(x + width, y + height);
    }

    ctx.lineTo(x + (roundBottomLeft ? radius : 0), y + height);
    if (roundBottomLeft) {
      ctx.arcTo(x, y + height, x, y + height - radius, radius);
    } else {
      ctx.lineTo(x, y + height);
    }

    ctx.lineTo(x, y + (roundTopLeft ? radius : 0));
    if (roundTopLeft) {
      ctx.arcTo(x, y, x + radius, y, radius);
    } else {
      ctx.lineTo(x, y);
    }

    ctx.closePath();
    ctx.fill();
  }

  private drawChart(): void {
    if (!this.ctx || !this.graphModel?.data?.length) return;

    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chartWidth = canvas.width - this.padding.left - this.padding.right;
    const chartHeight = canvas.height - this.padding.top - this.padding.bottom;

    const barCount = this.graphModel.data.length;
    const barSpacing = chartWidth / barCount;
    // const actualBarWidth = barSpacing * this.barWidthRatio; 
    const actualBarWidth = 30;
    const barOffset = (barSpacing - actualBarWidth) / 2;

    this.maxChartValue = Math.max(...this.graphModel.data.map(item => item.value));
    const yScale = chartHeight / this.maxChartValue;

    this.ctx.strokeStyle = '#374151';
    this.ctx.fillStyle = '#9CA3AF';
    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.textAlign = 'right';

    const dataMax = Math.max(...this.graphModel.data.map(item => item.value));
    this.graphModel.data.map(item => item.target = dataMax);
    let dynamicMaxChartValue = 0;
    let stepSize = 0;

    if (dataMax === 0) {
      dynamicMaxChartValue = 100;
      stepSize = 25;
    } else {
      const minIntervals = 4;

      const rawStep = dataMax / minIntervals;

      const power = Math.floor(Math.log10(rawStep));
      const magnitude = Math.pow(10, power);

      let niceFactor = 1;
      if (rawStep / magnitude > 5) niceFactor = 10;
      else if (rawStep / magnitude > 2) niceFactor = 5;
      else if (rawStep / magnitude > 1) niceFactor = 2;

      stepSize = niceFactor * magnitude;

      dynamicMaxChartValue = Math.ceil(dataMax / stepSize) * stepSize;
      if (dynamicMaxChartValue < dataMax) {
        dynamicMaxChartValue += stepSize;
      }
      if (dynamicMaxChartValue === 0 && dataMax > 0) {
        dynamicMaxChartValue = stepSize;
      }
    }

    this.maxChartValue = Math.max(...this.graphModel.data.map(item => item.value));
    // this.maxChartValue = dynamicMaxChartValue; 

    const gridLines: number[] = [];
    for (let i = 0; i <= this.maxChartValue; i += stepSize) {
      gridLines.push(i);
    }
    if (gridLines[gridLines.length - 1] !== this.maxChartValue) {
      gridLines.push(this.maxChartValue);
    }
    gridLines.forEach(value => {
      const y = this.padding.top + chartHeight - (value * yScale);
      this.ctx.beginPath();
      this.ctx.setLineDash([5, 5]);
      this.ctx.moveTo(this.padding.left, y);
      this.ctx.lineTo(this.padding.left + chartWidth, y);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      if (value > 0) {
        this.ctx.fillText(`${value}`, this.padding.left - 10, y + 5);
      } else {
        this.ctx.fillText(`0`, this.padding.left - 10, y + 5);
      }
    });

    this.graphModel.data.forEach((item, index) => {
      const x = this.padding.left + (index * barSpacing) + barOffset;
      const filledHeight = item.value * yScale;
      const unfilledHeight = (item.target - item.value) * yScale;

      const filledY = this.padding.top + chartHeight - filledHeight;
      const unfilledY = filledY - unfilledHeight;

      const barRadius = 11;

      this.ctx.fillStyle = 'white';
      this.drawRoundedRect(this.ctx, x, unfilledY, actualBarWidth, unfilledHeight + filledHeight, barRadius, true, true, true, true);

      this.ctx.fillStyle = '#2A5784';
      this.drawRoundedRect(this.ctx, x, filledY, actualBarWidth, filledHeight, barRadius, false, false, true, true);

      this.ctx.fillStyle = '#9CA3AF';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(item.name, x + actualBarWidth / 2, this.padding.top + chartHeight + 25);

      const smallLineLength = actualBarWidth * 1.2;
      const smallLineX = x + actualBarWidth / 2 - smallLineLength / 2;
      const smallLineY = filledY - 2;
      const smallLineRadius = 2;
      this.ctx.fillStyle = '#2A7DCF';
      this.drawRoundedRect(this.ctx, smallLineX, smallLineY, smallLineLength, 4, smallLineRadius, true, true, true, true);
    });

    if (this.hoveredIndex !== null && this.hoveredX !== null) {
      const item = this.graphModel.data[this.hoveredIndex];
      const barXCenter = this.padding.left + (this.hoveredIndex * barSpacing) + barOffset + actualBarWidth / 2;
      const barTopY = this.padding.top + chartHeight - (item.value * yScale);

      this.ctx.strokeStyle = '#60A5FA';
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.moveTo(barXCenter, this.padding.top);
      this.ctx.lineTo(barXCenter, this.padding.top + chartHeight);
      this.ctx.stroke();
      this.ctx.setLineDash([]);

      this.ctx.beginPath();
      this.ctx.arc(barXCenter, barTopY, 6, 0, Math.PI * 2);
      this.ctx.fillStyle = '#60A5FA';
      this.ctx.fill();
      this.ctx.strokeStyle = '#1F2937';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.lineWidth = 1;

      const tooltipText = `${item.value.toLocaleString()}`;
      this.ctx.font = '16px Inter, sans-serif';
      const textMetrics = this.ctx.measureText(tooltipText);
      const textWidth = textMetrics.width;
      const textHeight = 20;
      const tooltipPadding = 10;
      const tooltipWidth = textWidth + tooltipPadding * 2;
      const tooltipHeight = textHeight + tooltipPadding * 2;

      const tooltipX = barXCenter - tooltipWidth / 2;
      const tooltipY = barTopY - tooltipHeight - 15;

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
      this.ctx.arcTo(tooltipX, tooltipY, tooltipX + tooltipRadius, tooltipY, tooltipRadius);
      this.ctx.closePath();
      this.ctx.fill();

      this.ctx.beginPath();
      this.ctx.moveTo(barXCenter - 5, barTopY - 15);
      this.ctx.lineTo(barXCenter + 5, barTopY - 15);
      this.ctx.lineTo(barXCenter, barTopY - 5);
      this.ctx.closePath();
      this.ctx.fillStyle = 'white';
      this.ctx.fill();

      this.ctx.fillStyle = '#1F2937';
      this.ctx.textAlign = 'center';
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
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight - (this.graphModel?.title ? 40 : 0) - 30;
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