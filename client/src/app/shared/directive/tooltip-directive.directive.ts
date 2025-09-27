import {Directive, ElementRef, HostListener, Input, OnDestroy, AfterViewInit, Renderer2, NgZone} from '@angular/core';

@Directive({
  selector: '[appTooltip]'
})
export class TooltipDirective implements AfterViewInit, OnDestroy {
  @Input('appTooltip') tooltipText = '';
  private tooltip: HTMLElement | null = null;
  private showTimeout: any = null;
  private removeContainerScroll?: () => void;
  private rafHideScheduled = false;

  constructor(private el: ElementRef, private renderer: Renderer2, private zone: NgZone) {}

  ngAfterViewInit(): void {
    const container = document.getElementById('dashboard-container');
    if (container) {
      this.zone.runOutsideAngular(() => {
        this.removeContainerScroll = this.renderer.listen(container, 'scroll', () => this.scheduleHide());
      });
    }
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    this.scheduleHide();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.tooltipText.trim()) {
      this.showTimeout = setTimeout(() => {
        this.createOrUpdateTooltip();
      }, 300);
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideNow();
  }

  ngOnDestroy(): void {
    if (this.removeContainerScroll) {
      this.removeContainerScroll();
      this.removeContainerScroll = undefined;
    }
    this.destroyTooltip();
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
  }

  private scheduleHide(): void {
    if (!this.tooltip || this.rafHideScheduled) return;
    this.rafHideScheduled = true;
    requestAnimationFrame(() => {
      this.hideNow();
      this.rafHideScheduled = false;
    });
  }

  private hideNow(): void {
    if (this.showTimeout) {
      clearTimeout(this.showTimeout);
      this.showTimeout = null;
    }
    if (this.tooltip) {
      this.renderer.setStyle(this.tooltip, 'opacity', '0');
      this.renderer.setStyle(this.tooltip, 'pointer-events', 'none');
      this.renderer.setStyle(this.tooltip, 'display', 'none');
    }
  }

  private createOrUpdateTooltip(): void {
    if (!this.tooltip) {
      this.tooltip = this.renderer.createElement('div');
      this.renderer.addClass(this.tooltip, 'custom-tooltip');
      this.renderer.setStyle(this.tooltip, 'position', 'fixed');
      this.renderer.setStyle(this.tooltip, 'opacity', '0');
      this.renderer.setStyle(this.tooltip, 'text-transform', 'capitalize');
      this.renderer.setStyle(this.tooltip, 'pointer-events', 'none');
      this.renderer.appendChild(document.body, this.tooltip);
    } else {
      this.renderer.setProperty(this.tooltip, 'textContent', '');
    }

    const textNode = this.renderer.createText(this.tooltipText);
    this.renderer.appendChild(this.tooltip, textNode);
    this.renderer.setStyle(this.tooltip, 'display', 'block');

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

      if (left < margin) left = margin;
      else if (left + tooltipRect.width > window.innerWidth - margin) {
        left = window.innerWidth - tooltipRect.width - margin;
      }

      if (top < margin) top = margin;
      else if (top + tooltipRect.height > window.innerHeight - margin) {
        top = window.innerHeight - tooltipRect.height - margin;
      }

      this.tooltip.style.top = `${top}px`;
      this.tooltip.style.left = `${left}px`;
      this.tooltip.style.opacity = '1';
    });
  }

  private destroyTooltip(): void {
    if (this.tooltip) {
      const t = this.tooltip;
      this.tooltip = null;
      if (document.body.contains(t)) {
        this.renderer.removeChild(document.body, t);
      }
    }
  }
}
