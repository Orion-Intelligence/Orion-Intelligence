import {
  Directive,
  ElementRef,
  Renderer2,
  Input,
  HostListener,
  OnDestroy
} from '@angular/core';

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements OnDestroy {
  @Input('appTooltip') tooltipText: string = '';
  private tooltip: HTMLElement | null = null;
  private showTimeout: any = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.tooltipText.trim()) {
      this.showTimeout = setTimeout(() => {
        this.createTooltip();
      }, 600);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    this.removeTooltip();
  }

  private createTooltip(): void {
    this.removeTooltip();

    this.tooltip = this.renderer.createElement('div');
    const text = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltip, text);
    this.renderer.addClass(this.tooltip, 'custom-tooltip');
    this.renderer.setStyle(this.tooltip, 'position', 'absolute');
    this.renderer.setStyle(this.tooltip, 'opacity', '0');
    this.renderer.setStyle(this.tooltip, 'text-transform', 'capitalize');
    this.renderer.appendChild(document.body, this.tooltip);

    requestAnimationFrame(() => {
      if (!this.tooltip) return;

      const hostRect = (this.el.nativeElement as HTMLElement).getBoundingClientRect();
      const tooltipRect = this.tooltip.getBoundingClientRect();
      const margin = 8;

      let top = hostRect.top - tooltipRect.height - margin;
      let left = hostRect.left + (hostRect.width - tooltipRect.width) / 2;

      const isTopOverflow = top < margin;
      const isLeftOverflow = left < margin;
      const isRightOverflow = left + tooltipRect.width > window.innerWidth - margin;

      if (isTopOverflow && isLeftOverflow) {
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.right + margin;
      } else if (isTopOverflow && isRightOverflow) {
        top = hostRect.top + (hostRect.height - tooltipRect.height) / 2;
        left = hostRect.left - tooltipRect.width - margin;
      } else if (isTopOverflow) {
        top = hostRect.bottom + margin;
      }

      if (left < margin) {
        left = margin;
      } else if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
      }

      if (top < margin) {
        top = margin;
      } else if (top + tooltipRect.height > window.innerHeight - margin) {
        top = window.innerHeight - tooltipRect.height - margin;
      }

      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${left}px`;
      this.tooltip.style.opacity = '1';
    });
  }

  private removeTooltip(): void {
    if (this.tooltip) {
      const tooltipRef = this.tooltip;
      tooltipRef.style.opacity = '0';
      setTimeout(() => {
        if (tooltipRef && document.body.contains(tooltipRef)) {
          this.renderer.removeChild(document.body, tooltipRef);
        }
      }, 200);
      this.tooltip = null;
    }
  }

  ngOnDestroy(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
    }
    this.removeTooltip();
  }
}
