import { Component, HostBinding, HostListener, OnDestroy, OnInit } from '@angular/core';
import { DemoTourService } from '../../../shared/services/demo.tour.service';
import { TourStep } from '../../../shared/model/demo-tour/demo.tour.model';

@Component({
  selector: 'app-demo-tour',
  imports: [],
  templateUrl: './demo-tour.component.html',
  styleUrls: ['./demo-tour.component.css']
})
export class DemoTourComponent implements OnInit, OnDestroy {
  private readonly fallbackPositions: Array<NonNullable<TourStep['position']>> = ['bottom', 'top', 'right', 'left'];
  private activeElement: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private activeElementResizeObserver: ResizeObserver | null = null;
  private activeElementMutationObserver: MutationObserver | null = null;
  private stepPreparationToken = 0;
  private activeInput: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;
  private activeInputWasDisabled = false;
  private disabledElements: Array<{ element: HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement; wasDisabled: boolean; }> = [];
  private nextTransitionInProgress = false;

  step: TourStep | null = null;
  visible = false;
  stepReady = false;
  positionStyle: Record<string, string> = {};
  spotlightStyle: Record<string, string> = {};
  additionalSpotlightStyles: Array<Record<string, string>> = [];
  cutoutRects: Array<{ top: number; left: number; width: number; height: number; rx: number; ry: number; }> = [];
  overlayStyle: Record<string, string> = {};
  currentIndex = 0;
  totalSteps = 0;
  @HostBinding('style.--tour-overlay-clip') overlayClipPath = 'none';
  @HostBinding('style.--tour-spotlight-top') spotlightTop = '0px';
  @HostBinding('style.--tour-spotlight-left') spotlightLeft = '0px';
  @HostBinding('style.--tour-spotlight-width') spotlightWidth = '0px';
  @HostBinding('style.--tour-spotlight-height') spotlightHeight = '0px';
  @HostBinding('style.--tour-tooltip-top') tooltipTop = '0px';
  @HostBinding('style.--tour-tooltip-left') tooltipLeft = '0px';

  constructor(private tourService: DemoTourService) {}

  ngOnInit() {
    void this.tourService.startTourForCurrentLicense();

    this.tourService.currentStep$.subscribe(index => {
      this.visible = index !== -1;
      this.stepReady = false;
      this.currentIndex = index;
      this.step = this.tourService.getCurrentStep();

      this.clearActiveElementStyles();

      if (this.visible && this.step) {
        this.totalSteps = this.tourService.getTotalSteps();
        void this.prepareStep(this.step);
        return;
      }

      this.positionStyle = {};
      this.spotlightStyle = {};
      this.additionalSpotlightStyles = [];
      this.cutoutRects = [];
      this.overlayStyle = {};
      this.resetHostStyles();
    });
  }

  ngOnDestroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.disconnectActiveElementObservers();
    this.clearActiveElementStyles();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.visible) {
      this.schedulePositionUpdate();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onDocumentKeydown(event: KeyboardEvent): void {
    if (!this.visible || !this.step || event.key !== 'Enter' || !this.activeElement) {
      return;
    }

    const target = event.target as Node | null;
    if (target && !this.activeElement.contains(target)) {
      return;
    }

    if (this.step.captureValueOnEnter) {
      const value = this.getStepValue(this.activeElement, this.step);
      this.tourService.setCapturedValue(this.step.elementId, value);
    }

    if (this.step.endOnEnter) {
      this.close();
    }
  }

  updatePosition(): void {
    if (!this.step) {
      return;
    }

    const el = this.getStepElement(this.step);
    if (!el) {
      return;
    }

    this.activeElement = el;
    this.applyActiveElementStyles(el);
    this.applyStepInputState(el, this.step);

    const basePadding = this.step.padding ?? 10;
    const paddingTop = this.step.paddingTop ?? basePadding;
    const paddingRight = this.step.paddingRight ?? basePadding;
    const paddingBottom = this.step.paddingBottom ?? basePadding;
    const paddingLeft = this.step.paddingLeft ?? basePadding;
    const rect = el.getBoundingClientRect();
    const top = Math.max(rect.top - paddingTop, 8);
    const left = Math.max(rect.left - paddingLeft, 8);
    const right = Math.min(rect.right + paddingRight, window.innerWidth - 8);
    const bottom = Math.min(rect.bottom + paddingBottom, window.innerHeight - 8);
    const width = Math.max(right - left, 0);
    const height = Math.max(bottom - top, 0);

    this.overlayStyle = {
      clipPath: this.buildOverlayClipPath(top, right, bottom, left)
    };

    this.spotlightStyle = {
      top: `${top}px`,
      left: `${left}px`,
      width: `${width}px`,
      height: `${height}px`
    };
    this.additionalSpotlightStyles = this.getAdditionalSpotlightStyles(this.step, {
      top: paddingTop,
      right: paddingRight,
      bottom: paddingBottom,
      left: paddingLeft
    });
    this.cutoutRects = [
      { top, left, width, height, rx: 16, ry: 16 },
      ...this.additionalSpotlightStyles.map(spotlight => ({
        top: Number.parseFloat(spotlight['top']),
        left: Number.parseFloat(spotlight['left']),
        width: Number.parseFloat(spotlight['width']),
        height: Number.parseFloat(spotlight['height']),
        rx: 16,
        ry: 16
      }))
    ];

    this.positionStyle = this.getTooltipPosition(rect, this.step.position);
    this.overlayClipPath = this.overlayStyle['clipPath'] || 'none';
    this.spotlightTop = this.spotlightStyle['top'] || '0px';
    this.spotlightLeft = this.spotlightStyle['left'] || '0px';
    this.spotlightWidth = this.spotlightStyle['width'] || '0px';
    this.spotlightHeight = this.spotlightStyle['height'] || '0px';
    this.tooltipTop = this.positionStyle['top'] || '0px';
    this.tooltipLeft = this.positionStyle['left'] || '0px';
  }

  private schedulePositionUpdate(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.updatePosition();
    });
  }

  private async prepareStep(step: TourStep): Promise<void> {
    const token = ++this.stepPreparationToken;

    if (step.activateSelector) {
      const trigger = document.querySelector(step.activateSelector);
      if (trigger instanceof HTMLElement) {
        trigger.click();
        await this.waitForStepTarget(step);
      }
    }

    if (token !== this.stepPreparationToken || this.step !== step) {
      return;
    }

    const element = this.getStepElement(step);
    if (element) {
      await this.waitForStepStability(step, element);
    }

    if (token !== this.stepPreparationToken || this.step !== step) {
      return;
    }

    if (element && step.scrollIntoView) {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
      await this.waitForStepStability(step, element);
    }

    if (element && step.triggerSubmitOnShow) {
      this.applyStepInputState(element, step);
      this.triggerStepSubmit(element, step);
      await this.waitForStepStability(step, element);
    }

    this.stepReady = true;
    this.schedulePositionUpdate();
  }

  private applyActiveElementStyles(element: HTMLElement): void {
    if (this.activeElement === element) {
      return;
    }

    this.clearActiveElementStyles();
    this.activeElement = element;
    this.activeElement.classList.add('demo-tour-active');
    this.observeActiveElement(element);
  }

  private clearActiveElementStyles(): void {
    this.restoreActiveInputState();
    this.restoreDisabledElements();
    this.disconnectActiveElementObservers();

    if (!this.activeElement) {
      return;
    }

    this.activeElement.classList.remove('demo-tour-active');
    this.activeElement = null;
  }

  private observeActiveElement(element: HTMLElement): void {
    this.disconnectActiveElementObservers();

    this.activeElementResizeObserver = new ResizeObserver(() => {
      if (this.visible) {
        this.schedulePositionUpdate();
      }
    });
    this.activeElementResizeObserver.observe(element);

    this.activeElementMutationObserver = new MutationObserver(() => {
      if (this.visible) {
        this.schedulePositionUpdate();
      }
    });
    this.activeElementMutationObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true
    });
  }

  private disconnectActiveElementObservers(): void {
    this.activeElementResizeObserver?.disconnect();
    this.activeElementResizeObserver = null;
    this.activeElementMutationObserver?.disconnect();
    this.activeElementMutationObserver = null;
  }

  private getTooltipPosition(rect: DOMRect, preferredPosition: TourStep['position'] = 'bottom'): Record<string, string> {
    const tooltipWidth = 320;
    const tooltipHeight = 220;
    const margin = 12;
    const primaryPosition: NonNullable<TourStep['position']> = preferredPosition ?? 'bottom';
    const positions: Array<NonNullable<TourStep['position']>> = [
      primaryPosition,
      ...this.fallbackPositions.filter(position => position !== primaryPosition)
    ];

    for (const position of positions) {
      const tooltip = this.calculateTooltipCoordinates(rect, position, tooltipWidth, tooltipHeight, margin);
      if (this.fitsInViewport(tooltip, tooltipWidth, tooltipHeight, margin)) {
        return tooltip;
      }
    }

    return this.clampTooltipToViewport(this.calculateTooltipCoordinates(rect, preferredPosition ?? 'bottom', tooltipWidth, tooltipHeight, margin),
      tooltipWidth,
      tooltipHeight,
      margin);
  }

  private calculateTooltipCoordinates( rect: DOMRect, position: NonNullable<TourStep['position']>, tooltipWidth: number, tooltipHeight: number, margin: number ): Record<string, string> {
    switch (position) {
      case 'top':
        return {
          top: `${rect.top - tooltipHeight - margin}px`,
          left: `${rect.left + rect.width / 2 - tooltipWidth / 2}px`
        };
      case 'left':
        return {
          top: `${rect.top + rect.height / 2 - tooltipHeight / 2}px`,
          left: `${rect.left - tooltipWidth - margin}px`
        };
      case 'right':
        return {
          top: `${rect.top + rect.height / 2 - tooltipHeight / 2}px`,
          left: `${rect.right + margin}px`
        };
      case 'bottom':
      default:
        return {
          top: `${rect.bottom + margin}px`,
          left: `${rect.left + rect.width / 2 - tooltipWidth / 2}px`
        };
    }
  }

  private fitsInViewport( tooltip: Record<string, string>, tooltipWidth: number, tooltipHeight: number, margin: number ): boolean {
    const top = Number.parseFloat(tooltip['top']);
    const left = Number.parseFloat(tooltip['left']);

    return top >= margin &&
      left >= margin &&
      top + tooltipHeight <= window.innerHeight - margin &&
      left + tooltipWidth <= window.innerWidth - margin;
  }

  private clampTooltipToViewport( tooltip: Record<string, string>, tooltipWidth: number, tooltipHeight: number, margin: number ): Record<string, string> {
    const top = Number.parseFloat(tooltip['top']);
    const left = Number.parseFloat(tooltip['left']);

    return {
      top: `${Math.min(Math.max(top, margin), Math.max(window.innerHeight - tooltipHeight - margin, margin))}px`,
      left: `${Math.min(Math.max(left, margin), Math.max(window.innerWidth - tooltipWidth - margin, margin))}px`
    };
  }

  private getStepElement(step: TourStep): HTMLElement | null {
    return document.getElementById(step.elementId);
  }

  private buildOverlayClipPath(top: number, right: number, bottom: number, left: number): string {
    return `polygon(
      0% 0%,
      0% 100%,
      ${left}px 100%,
      ${left}px ${top}px,
      ${right}px ${top}px,
      ${right}px ${bottom}px,
      ${left}px ${bottom}px,
      ${left}px 100%,
      100% 100%,
      100% 0%
    )`;
  }

  private getAdditionalSpotlightStyles( step: TourStep, padding: { top: number; right: number; bottom: number; left: number; } ): Array<Record<string, string>> {
    if (!step.additionalElementIds?.length) {
      return [];
    }

    const styles: Array<Record<string, string>> = [];
    for (const elementId of step.additionalElementIds) {
      const element = document.getElementById(elementId);
      if (!element) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      const top = Math.max(rect.top - padding.top, 8);
      const left = Math.max(rect.left - padding.left, 8);
      const right = Math.min(rect.right + padding.right, window.innerWidth - 8);
      const bottom = Math.min(rect.bottom + padding.bottom, window.innerHeight - 8);

      styles.push({
        top: `${top}px`,
        left: `${left}px`,
        width: `${Math.max(right - left, 0)}px`,
        height: `${Math.max(bottom - top, 0)}px`
      });
    }

    return styles;
  }

  private getStepValue(element: HTMLElement, step: TourStep): string {
    const input = step.inputSelector
      ? element.querySelector(step.inputSelector)
      : element.querySelector('input, textarea, select');

    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
      return input.value.trim();
    }

    if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
      return document.activeElement.value.trim();
    }

    return '';
  }

  private applyStepInputState(element: HTMLElement, step: TourStep): void {
    this.restoreActiveInputState();
    this.restoreDisabledElements();

    const input = this.getStepInput(element, step);
    if (!input) {
      this.applyDisabledSelectors(element, step);
      return;
    }

    this.activeInput = input;
    this.activeInputWasDisabled = input.disabled;

    if (typeof step.presetValue === 'string') {
      input.value = step.presetValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      this.tourService.setCapturedValue(step.elementId, step.presetValue);
    }

    if (step.disableInput) {
      input.disabled = true;
    }

    this.applyDisabledSelectors(element, step);
  }

  private restoreActiveInputState(): void {
    if (!this.activeInput) {
      return;
    }

    this.activeInput.disabled = this.activeInputWasDisabled;
    this.activeInput = null;
    this.activeInputWasDisabled = false;
  }

  private getStepInput(element: HTMLElement, step: TourStep): HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null {
    const input = step.inputSelector
      ? element.querySelector(step.inputSelector)
      : element.querySelector('input, textarea, select');

    if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) {
      return input;
    }

    return null;
  }

  private applyDisabledSelectors(element: HTMLElement, step: TourStep): void {
    if (!step.disableSelectors?.length) {
      return;
    }

    const elements = element.querySelectorAll(step.disableSelectors.join(', '));
    for (const item of elements) {
      if (
        item instanceof HTMLButtonElement ||
        item instanceof HTMLInputElement ||
        item instanceof HTMLSelectElement ||
        item instanceof HTMLTextAreaElement
      ) {
        this.disabledElements.push({
          element: item,
          wasDisabled: item.disabled
        });
        item.disabled = true;
      }
    }
  }

  private restoreDisabledElements(): void {
    if (!this.disabledElements.length) {
      return;
    }

    for (const item of this.disabledElements) {
      item.element.disabled = item.wasDisabled;
    }

    this.disabledElements = [];
  }

  private resetHostStyles(): void {
    this.overlayClipPath = 'none';
    this.spotlightTop = '0px';
    this.spotlightLeft = '0px';
    this.spotlightWidth = '0px';
    this.spotlightHeight = '0px';
    this.tooltipTop = '0px';
    this.tooltipLeft = '0px';
    this.cutoutRects = [];
  }

  async next() {
    if (this.nextTransitionInProgress) {
      return;
    }

    if (this.step?.triggerSubmitOnNext && this.activeElement) {
      this.nextTransitionInProgress = true;
      this.triggerStepSubmit(this.activeElement, this.step);

      const nextStep = this.tourService.getStep(this.currentIndex + 1);
      if (nextStep) {
        await this.waitForElement(nextStep.elementId);
      }

      this.nextTransitionInProgress = false;
    }

    this.tourService.next();
  }

  prev() {
    this.tourService.prev();
  }

  close() {
    this.clearActiveElementStyles();
    this.tourService.end();
  }

  private triggerStepSubmit(element: HTMLElement, step: TourStep): void {
    const input = this.getStepInput(element, step);
    const form = (input?.closest('form') ?? element.closest('form')) as HTMLFormElement | null;
    if (!form) {
      return;
    }

    form.requestSubmit();
  }

  private waitForStepTarget(step: TourStep): Promise<void> {
    return new Promise(resolve => {
      const hasStepTarget = () => {
        const element = this.getStepElement(step);
        if (!element) {
          return false;
        }
        if (step.waitForSelector) {
          const nestedElement = document.querySelector(step.waitForSelector);
          if (!(nestedElement instanceof HTMLElement) || !this.isElementRendered(nestedElement)) {
            return false;
          }
        }
        if (!step.inputSelector) {
          return true;
        }
        return !!this.getStepInput(element, step);
      };

      if (hasStepTarget()) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {
        if (!hasStepTarget()) {
          return;
        }

        observer.disconnect();
        resolve();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      window.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1500);
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      window.setTimeout(resolve, ms);
    });
  }

  private waitForStepStability(step: TourStep, element: HTMLElement): Promise<void> {
    return new Promise(resolve => {
      let settleTimer: number | null = null;
      const stableAfterMs = 180;

      const observedElements = new Set<HTMLElement>([element]);
      if (step.waitForSelector) {
        const nested = document.querySelector(step.waitForSelector);
        if (nested instanceof HTMLElement) {
          observedElements.add(nested);
        }
      }
      if (step.inputSelector) {
        const input = this.getStepInput(element, step);
        if (input instanceof HTMLElement) {
          observedElements.add(input);
        }
      }

      const finish = () => {
        if (settleTimer !== null) {
          window.clearTimeout(settleTimer);
          settleTimer = null;
        }
        resizeObserver.disconnect();
        mutationObserver.disconnect();
        resolve();
      };

      const scheduleSettle = () => {
        if (settleTimer !== null) {
          window.clearTimeout(settleTimer);
        }
        settleTimer = window.setTimeout(() => finish(), stableAfterMs);
      };

      const resizeObserver = new ResizeObserver(() => {
        scheduleSettle();
      });
      for (const observedElement of observedElements) {
        resizeObserver.observe(observedElement);
      }

      const mutationObserver = new MutationObserver(() => {
        scheduleSettle();
      });
      mutationObserver.observe(element, {
        childList: true,
        subtree: true,
        attributes: true
      });

      scheduleSettle();
    });
  }

  private isElementRendered(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  private waitForElement(elementId: string): Promise<void> {
    return new Promise(resolve => {
      if (document.getElementById(elementId)) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {
        if (!document.getElementById(elementId)) {
          return;
        }

        observer.disconnect();
        resolve();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      window.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 100);
    });
  }
}
