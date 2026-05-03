import { AfterViewInit, ChangeDetectorRef, Component, HostBinding, HostListener, NgZone, OnDestroy, OnInit } from '@angular/core';
import { DemoTourService } from '../../../shared/services/demo.tour.service';
import { RenderedGeometry } from '../../../shared/model/demo-tour/modal/rendered-geometry.interface';
import { TourStep } from '../../../shared/model/demo-tour/demo.tour.model';

@Component({
  selector: 'app-demo-tour',
  imports: [],
  templateUrl: './demo-tour.component.html'
})
export class DemoTourComponent implements OnInit, AfterViewInit, OnDestroy {
  private static readonly hostRuntimeSelector = 'app-demo-tour.demo-tour-runtime';
  private static readonly bodyRuntimeSelector = 'body.demo-tour-scroll-locked';
  private readonly fallbackPositions: NonNullable<TourStep['position']>[] = ['bottom', 'top', 'right', 'left'];
  private readonly minimumLoadingMs = 350;
  private readonly geometryTolerancePx = 1.5;
  private readonly geometryTrackingWindowMs = 100;
  private readonly cutoutTransitionMs = 220;
  private activeElement: HTMLElement | null = null;
  private animationFrameId: number | null = null;
  private geometryTrackingFrameId: number | null = null;
  private cutoutAnimationFrameId: number | null = null;
  private activeElementResizeObserver: ResizeObserver | null = null;
  private activeElementMutationObserver: MutationObserver | null = null;
  private stepPreparationToken = 0;
  private activeInput: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null = null;
  private activeInputWasDisabled = false;
  private disabledElements: { element: HTMLButtonElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement; wasDisabled: boolean; }[] = [];
  private nextTransitionInProgress = false;
  private scrollLockY = 0;
  private preparingStep = false;
  private loadingStartedAt = 0;
  private geometryFrozen = false;
  private lastRenderedGeometry: RenderedGeometry | null = null;
  private readonly spotlightCornerRadius = 10;
  private runtimeStyleSheet: CSSStyleSheet | null = null;
  private stepIndexTimerId: number | null = null;
  private startTourTimerId: number | null = null;

  step: TourStep | null = null;
  visible = false;
  stepReady = false;
  loadingVisible = false;
  positionStyle: Record<string, string> = {};
  cutoutRects: { top: number; left: number; width: number; height: number; rx: number; ry: number; }[] = [];
  currentIndex = 0;
  totalSteps = 0;
  spotlightRevealVariant = 0;
  tourAccent = '#34d399';
  tourAccentStrong = '#10b981';
  spotlightTop = '0px';
  spotlightLeft = '0px';
  spotlightWidth = '0px';
  spotlightHeight = '0px';
  tooltipTop = '0px';
  tooltipLeft = '0px';
  tooltipBottom = 'auto';
  tooltipWidth = '320px';
  progressWidth = '0%';
  @HostBinding('class.demo-tour-runtime') readonly runtimeClass = true;
  @HostBinding('class.tour-loading') readonly tourLoadingClass = true;

  @HostBinding('class.tour-tooltip-positioned') get isTooltipPositioned(): boolean {
    return this.tooltipTop !== '0px' || this.tooltipLeft !== '0px' || this.tooltipBottom !== 'auto';
  }

  constructor(private tourService: DemoTourService, private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit() {
    this.tourService.currentStep$.subscribe(index => {
      if (this.stepIndexTimerId !== null) {
        window.clearTimeout(this.stepIndexTimerId);
      }

      this.stepIndexTimerId = window.setTimeout(() => {
        this.stepIndexTimerId = null;
        this.ngZone.run(() => {
          this.applyStepIndex(index);
        });
      }, 0);
    });
  }

  ngAfterViewInit(): void {
    this.startTourTimerId = window.setTimeout(() => {
      this.startTourTimerId = null;
      void this.tourService.startTourForCurrentLicense();
    }, 0);
  }

  private applyStepIndex(index: number): void {
    this.visible = index !== -1;
    this.stepReady = false;
    this.lastRenderedGeometry = null;
    this.geometryFrozen = false;
    this.currentIndex = index;
    this.step = this.tourService.getCurrentStep();
    this.updateAccentTheme(this.step);
    this.syncRuntimeStyles();

    if (this.visible && this.step) {
      this.preparingStep = true;
      this.loadingVisible = true;
      this.lockPageScroll();
      this.totalSteps = this.tourService.getTotalSteps();
      void this.prepareStep(this.step);
      return;
    }

    this.unlockPageScroll();
    this.resetHostStyles();
  }

  private updateAccentTheme(_step: TourStep | null): void {
    this.tourAccent = '#34d399';
    this.tourAccentStrong = '#10b981';
  }

  ngOnDestroy(): void {
    if (this.startTourTimerId !== null) {
      window.clearTimeout(this.startTourTimerId);
    }
    if (this.stepIndexTimerId !== null) {
      window.clearTimeout(this.stepIndexTimerId);
    }
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.geometryTrackingFrameId !== null) {
      cancelAnimationFrame(this.geometryTrackingFrameId);
    }
    if (this.cutoutAnimationFrameId !== null) {
      cancelAnimationFrame(this.cutoutAnimationFrameId);
    }
    this.clearRuntimeStyles();
    this.disconnectActiveElementObservers();
    this.clearActiveElementStyles();
    this.unlockPageScroll();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.visible) {
      this.geometryFrozen = false;
      this.schedulePositionUpdate(true);
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
      this.clearActiveElementStyles();
      this.tourService.end();
    }
  }

  updatePosition(): void {
    if (!this.step) {
      return;
    }

    const spotlightElement = this.getStepElement(this.step);
    const tooltipElement = this.preparingStep
      ? this.getTooltipAnchorElement(this.step) ?? spotlightElement
      : spotlightElement;

    if (!spotlightElement && !tooltipElement) {
      return;
    }

    if (spotlightElement) {
      this.activeElement = spotlightElement;
      this.applyActiveElementStyles(spotlightElement);
      this.applyStepInputState(spotlightElement, this.step);
    }

    const basePadding = this.step.padding ?? 10;
    const paddingTop = this.step.paddingTop ?? basePadding;
    const paddingRight = this.step.paddingRight ?? basePadding;
    const paddingBottom = this.step.paddingBottom ?? basePadding;
    const paddingLeft = this.step.paddingLeft ?? basePadding;
    let top = this.lastRenderedGeometry?.spotlightTop ?? 0;
    let left = this.lastRenderedGeometry?.spotlightLeft ?? 0;
    let width = this.lastRenderedGeometry?.spotlightWidth ?? 0;
    let height = this.lastRenderedGeometry?.spotlightHeight ?? 0;
    let right = left + width;
    let bottom = top + height;

    let nextCutoutRects = this.cutoutRects;
    if (spotlightElement) {
      const spotlightRect = this.step.elementId === 'dashboard-consolidated'
        ? this.getRenderedContentBounds(spotlightElement)
        : spotlightElement.getBoundingClientRect();
      top = Math.max(spotlightRect.top - paddingTop, 8);
      left = Math.max(spotlightRect.left - paddingLeft, 8);
      right = Math.min(spotlightRect.right + paddingRight, window.innerWidth - 8);
      bottom = Math.min(spotlightRect.bottom + paddingBottom, window.innerHeight - 8);
      width = Math.max(right - left, 0);
      height = Math.max(bottom - top, 0);

      if (this.isCompactViewport() && this.step?.elementId === 'dashboard-consolidated') {
        const dashboardBody = document.querySelector('[data-testid="dashboard-body"]');
        if (dashboardBody instanceof HTMLElement && this.isElementRendered(dashboardBody)) {
          const dashboardRect = dashboardBody.getBoundingClientRect();
          const compactSpotlightInset = 10;
          top = Math.max(top, this.getCompactTooltipReservedTop());
          left = Math.max(dashboardRect.left + compactSpotlightInset, compactSpotlightInset);
          right = Math.min(dashboardRect.right - compactSpotlightInset, window.innerWidth - compactSpotlightInset);
          bottom = Math.min(dashboardRect.bottom - compactSpotlightInset, window.innerHeight - compactSpotlightInset);
          width = Math.max(right - left, 0);
          height = Math.max(bottom - top, 0);
        }
      }

      if (this.isCompactViewport() && this.isSidebarRelatedStep(this.step)) {
        const compactSidebarTopLimit = this.getCompactTooltipReservedTop();
        top = Math.max(top, compactSidebarTopLimit);
        height = Math.max(bottom - top, 0);
      }

      const additionalSpotlightStyles = this.getAdditionalSpotlightStyles(this.step, {
        top: paddingTop,
        right: paddingRight,
        bottom: paddingBottom,
        left: paddingLeft
      });
      nextCutoutRects = [
        { top, left, width, height, rx: this.spotlightCornerRadius, ry: this.spotlightCornerRadius },
        ...additionalSpotlightStyles.map(spotlight => ({
          top: Number.parseFloat(spotlight['top']),
          left: Number.parseFloat(spotlight['left']),
          width: Number.parseFloat(spotlight['width']),
          height: Number.parseFloat(spotlight['height']),
          rx: this.spotlightCornerRadius,
          ry: this.spotlightCornerRadius
        }))
      ];
    }

    const tooltipRect = (tooltipElement ?? spotlightElement)?.getBoundingClientRect();
    if (!tooltipRect) {
      return;
    }

    this.positionStyle = this.getTooltipPosition(tooltipRect, this.step.position, {
      top,
      left,
      right,
      bottom,
      width,
      height
    });

    const nextGeometry = {
      spotlightTop: top,
      spotlightLeft: left,
      spotlightWidth: width,
      spotlightHeight: height,
      tooltipTop: Number.parseFloat(this.positionStyle['top'] || '0'),
      tooltipLeft: Number.parseFloat(this.positionStyle['left'] || '0')
    };

    if (this.shouldSkipGeometryUpdate(nextGeometry)) {
      this.progressWidth = `${this.totalSteps > 0 ? ((this.currentIndex + 1) / this.totalSteps) * 100 : 0}%`;
      return;
    }

    this.lastRenderedGeometry = nextGeometry;
    this.animateCutoutRects(nextCutoutRects);
    this.spotlightTop = `${top}px`;
    this.spotlightLeft = `${left}px`;
    this.spotlightWidth = `${width}px`;
    this.spotlightHeight = `${height}px`;
    this.tooltipTop = this.positionStyle['top'] || '0px';
    this.tooltipLeft = this.positionStyle['left'] || '0px';
    this.tooltipBottom = this.positionStyle['bottom'] || 'auto';
    this.progressWidth = `${this.totalSteps > 0 ? ((this.currentIndex + 1) / this.totalSteps) * 100 : 0}%`;
    this.syncRuntimeStyles();
  }

  private shouldSkipGeometryUpdate(nextGeometry: RenderedGeometry): boolean {
    if (!this.lastRenderedGeometry) {
      return false;
    }

    return this.isWithinTolerance(this.lastRenderedGeometry.spotlightTop, nextGeometry.spotlightTop) &&
      this.isWithinTolerance(this.lastRenderedGeometry.spotlightLeft, nextGeometry.spotlightLeft) &&
      this.isWithinTolerance(this.lastRenderedGeometry.spotlightWidth, nextGeometry.spotlightWidth) &&
      this.isWithinTolerance(this.lastRenderedGeometry.spotlightHeight, nextGeometry.spotlightHeight) &&
      this.isWithinTolerance(this.lastRenderedGeometry.tooltipTop, nextGeometry.tooltipTop) &&
      this.isWithinTolerance(this.lastRenderedGeometry.tooltipLeft, nextGeometry.tooltipLeft);
  }

  private isWithinTolerance(previousValue: number, nextValue: number): boolean {
    return Math.abs(previousValue - nextValue) < this.geometryTolerancePx;
  }

  private schedulePositionUpdate(force = false): void {
    if (!force && this.geometryFrozen) {
      return;
    }

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      this.updatePosition();
      this.cdr.markForCheck();
    });
  }

  private async prepareStep(step: TourStep): Promise<void> {
    const token = ++this.stepPreparationToken;
    this.preparingStep = true;
    this.loadingVisible = true;
    this.loadingStartedAt = performance.now();
    this.cdr.markForCheck();

    await this.ensureMobileViewportState(step);

    if (token !== this.stepPreparationToken || this.step !== step) {
      this.preparingStep = false;
      return;
    }

    this.schedulePositionUpdate(true);

    if (step.activateSelector) {
      const trigger = document.querySelector(step.activateSelector);
      if (trigger instanceof HTMLElement) {
        trigger.click();
        await this.waitForAnimationFrames(2);
        this.schedulePositionUpdate(true);
        await this.waitForStepTarget(step);
        await this.waitForAnimationFrames(2);
        this.schedulePositionUpdate(true);
      }
    }

    if (token !== this.stepPreparationToken || this.step !== step) {
      this.preparingStep = false;
      return;
    }

    const element = this.getStepElement(step);
    if (element && step.scrollIntoView) {
      element.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      await this.waitForAnimationFrames(1);
      this.schedulePositionUpdate(true);
    }

    if (token !== this.stepPreparationToken || this.step !== step) {
      this.preparingStep = false;
      return;
    }

    if (element) {
      this.triggerSpotlightReveal();
      this.updatePosition();
      this.cdr.markForCheck();
      await this.trackGeometryForWindow(step, this.geometryTrackingWindowMs);
    }

    if (element) {
      await this.waitForStepStability(step, element);
      await this.waitForSidebarRectStability(step, element);
    }

    if (element && step.triggerSubmitOnShow) {
      this.applyStepInputState(element, step);
      this.triggerStepSubmit(element, step);
      await this.waitForStepStability(step, element);
    }

    const tooltipAnchor = this.getTooltipAnchorElement(step);
    if (!element && !tooltipAnchor) {
      this.preparingStep = false;
      this.loadingVisible = false;
      this.cdr.markForCheck();
      window.setTimeout(() => this.tourService.next(), 0);
      return;
    }

    if (token !== this.stepPreparationToken || this.step !== step) {
      this.preparingStep = false;
      return;
    }

    const elapsedLoadingMs = performance.now() - this.loadingStartedAt;
    if (elapsedLoadingMs < this.minimumLoadingMs) {
      await this.wait(this.minimumLoadingMs - elapsedLoadingMs);
    }

    if (token !== this.stepPreparationToken || this.step !== step) {
      this.preparingStep = false;
      return;
    }

    this.stepReady = true;
    this.loadingVisible = false;
    this.preparingStep = false;
    this.cdr.markForCheck();
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
      if (this.visible && !this.preparingStep && !this.geometryFrozen) {
        this.schedulePositionUpdate();
      }
    });
    this.activeElementResizeObserver.observe(element);

    this.activeElementMutationObserver = new MutationObserver(() => {
      if (this.visible && !this.preparingStep && !this.geometryFrozen) {
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

  private getTooltipPosition(rect: DOMRect, preferredPosition: TourStep['position'] = 'bottom', spotlightBounds?: { top: number; left: number; right: number; bottom: number; width: number; height: number; }): Record<string, string> {
    const { width: tooltipWidth, height: tooltipHeight, margin, compact } = this.getTooltipMetrics();
    if (compact) {
      const isSidebarRelatedStep = !!this.step && this.isSidebarRelatedStep(this.step);
      const isDashboardStep = this.step?.elementId === 'dashboard-consolidated';
      const isFinalSidebarStep = this.currentIndex >= Math.max(this.totalSteps - 2, 0);
      return {
        top: (isSidebarRelatedStep || isDashboardStep || isFinalSidebarStep) ? '10px' : 'auto',
        left: '10px',
        bottom: (isSidebarRelatedStep || isDashboardStep || isFinalSidebarStep) ? 'auto' : '10px'
      };
    }

    const effectivePreferredPosition = compact && (preferredPosition === 'left' || preferredPosition === 'right')
      ? 'bottom'
      : preferredPosition;

    if (effectivePreferredPosition === 'bottom' && this.step?.elementId === 'homeSearch' && spotlightBounds) {
      const homeSearchAlignedTooltip = this.getBelowLeftAlignedTooltipPosition(spotlightBounds, tooltipWidth, tooltipHeight, 20);
      if (this.fitsInViewport(homeSearchAlignedTooltip, tooltipWidth, tooltipHeight, margin)) {
        return homeSearchAlignedTooltip;
      }

      return this.clampTooltipToViewport(homeSearchAlignedTooltip, tooltipWidth, tooltipHeight, margin);
    }

    if (effectivePreferredPosition === 'bottom' && this.step?.elementId === 'free-user-statistics') {
      const freeDashboardAlignedTooltip = this.getDashboardAlignedTooltipPosition(tooltipWidth, tooltipHeight, spotlightBounds);
      if (this.fitsInViewport(freeDashboardAlignedTooltip, tooltipWidth, tooltipHeight, margin)) {
        return freeDashboardAlignedTooltip;
      }

      return this.clampTooltipToViewport(freeDashboardAlignedTooltip, tooltipWidth, tooltipHeight, margin);
    }

    if (effectivePreferredPosition === 'bottom' && this.step?.elementId === 'alert-summery' && spotlightBounds) {
      const alertSummaryAlignedTooltip = this.getAlertSummaryAlignedTooltipPosition(spotlightBounds, tooltipWidth, tooltipHeight);
      if (this.fitsInViewport(alertSummaryAlignedTooltip, tooltipWidth, tooltipHeight, margin)) {
        return alertSummaryAlignedTooltip;
      }

      return this.clampTooltipToViewport(alertSummaryAlignedTooltip, tooltipWidth, tooltipHeight, margin);
    }

    if (effectivePreferredPosition === 'right' && this.step?.elementId.startsWith('sidebar-') && spotlightBounds) {
      const sidebarAlignedTooltip = this.getSidebarAlignedTooltipPosition(spotlightBounds, tooltipWidth, tooltipHeight, 20);
      if (this.fitsInViewport(sidebarAlignedTooltip, tooltipWidth, tooltipHeight, margin)) {
        return sidebarAlignedTooltip;
      }

      return this.clampTooltipToViewport(sidebarAlignedTooltip, tooltipWidth, tooltipHeight, margin);
    }

    if (effectivePreferredPosition === 'left' && this.step?.elementId === 'dashboard-consolidated') {
      const dashboardAlignedTooltip = this.getDashboardAlignedTooltipPosition(tooltipWidth, tooltipHeight, spotlightBounds);
      if (this.fitsInViewport(dashboardAlignedTooltip, tooltipWidth, tooltipHeight, margin)) {
        return dashboardAlignedTooltip;
      }

      return this.clampTooltipToViewport(dashboardAlignedTooltip, tooltipWidth, tooltipHeight, margin);
    }

    if (effectivePreferredPosition === 'left' && this.step?.elementId === 'report-detail') {
      const sidebarElement = document.getElementById('sidebar-general');
      if (sidebarElement) {
        const sidebarRect = sidebarElement.getBoundingClientRect();
        const sidebarAlignedTooltip = this.getSidebarAlignedTooltipPosition({
          top: sidebarRect.top,
          left: sidebarRect.left,
          right: sidebarRect.right,
          bottom: sidebarRect.bottom,
          width: sidebarRect.width,
          height: sidebarRect.height
        }, tooltipWidth, tooltipHeight, 20);

        if (this.fitsInViewport(sidebarAlignedTooltip, tooltipWidth, tooltipHeight, margin)) {
          return sidebarAlignedTooltip;
        }

        return this.clampTooltipToViewport(sidebarAlignedTooltip, tooltipWidth, tooltipHeight, margin);
      }
    }

    const primaryPosition: NonNullable<TourStep['position']> = effectivePreferredPosition ?? 'bottom';
    const positions: NonNullable<TourStep['position']>[] = [
      primaryPosition,
      ...this.fallbackPositions.filter(position => position !== primaryPosition)
    ];

    for (const position of positions) {
      const tooltip = this.calculateTooltipCoordinates(rect, position, tooltipWidth, tooltipHeight, margin);
      if (this.fitsInViewport(tooltip, tooltipWidth, tooltipHeight, margin)) {
        return tooltip;
      }
    }

    return this.clampTooltipToViewport(this.calculateTooltipCoordinates(rect, effectivePreferredPosition ?? 'bottom', tooltipWidth, tooltipHeight, margin),
      tooltipWidth,
      tooltipHeight,
      margin);
  }

  private getTooltipMetrics(): { width: number; height: number; margin: number; compact: boolean } {
    const viewportWidth = window.innerWidth;
    const compact = viewportWidth <= 640;
    const margin = compact ? 10 : 12;
    const width = compact
      ? Math.max(viewportWidth - 20, 240)
      : 320;
    const height = compact ? 260 : 220;

    this.tooltipWidth = `${width}px`;

    return { width, height, margin, compact };
  }

  private getCompactTooltipReservedTop(): number {
    const { height: tooltipHeight, margin } = this.getTooltipMetrics();
    const tooltipTopOffset = 10;
    const spotlightGap = 16;

    return Math.max(tooltipTopOffset + tooltipHeight + spotlightGap + margin, 8);
  }

  private getSidebarAlignedTooltipPosition(spotlightBounds: { top: number; left: number; right: number; bottom: number; width: number; height: number; }, tooltipWidth: number, tooltipHeight: number, gap: number): Record<string, string> {
    return this.clampTooltipToViewport({ top: `${spotlightBounds.top}px`, left: `${spotlightBounds.right + gap}px` }, tooltipWidth, tooltipHeight, 12);
  }

  private getBelowLeftAlignedTooltipPosition(spotlightBounds: { top: number; left: number; right: number; bottom: number; width: number; height: number; }, tooltipWidth: number, tooltipHeight: number, gap: number): Record<string, string> {
    return this.clampTooltipToViewport({ top: `${spotlightBounds.bottom + gap}px`, left: `${spotlightBounds.left}px` }, tooltipWidth, tooltipHeight, 12);
  }

  private getDashboardAlignedTooltipPosition(tooltipWidth: number, tooltipHeight: number, spotlightBounds?: { top: number; left: number; right: number; bottom: number; width: number; height: number; }): Record<string, string> {
    if (spotlightBounds) {
      return this.clampTooltipToViewport({ top: `${spotlightBounds.top + 15}px`, left: `${spotlightBounds.left + 15}px` }, tooltipWidth, tooltipHeight, 12);
    }

    return { top: '12px', left: '12px' };
  }

  private getAlertSummaryAlignedTooltipPosition(spotlightBounds: { top: number; left: number; right: number; bottom: number; width: number; height: number; }, tooltipWidth: number, tooltipHeight: number): Record<string, string> {
    return this.getSidebarAlignedTooltipPosition(spotlightBounds, tooltipWidth, tooltipHeight, 20);
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
    const primaryElement = document.getElementById(step.elementId);
    if (primaryElement) {
      return primaryElement;
    }

    return this.getStepFallbackElement(step);
  }

  private getStepFallbackElement(step: TourStep): HTMLElement | null {
    if (step.elementId !== 'alert-summery') {
      return null;
    }

    const additionalFallback = step.additionalElementIds
      ?.map(elementId => document.getElementById(elementId))
      .find((element): element is HTMLElement => !!element && this.isElementRendered(element));

    if (additionalFallback) {
      return additionalFallback;
    }

    const sidebarProfile = document.getElementById('sidebar-profile');
    return sidebarProfile && this.isElementRendered(sidebarProfile) ? sidebarProfile : null;
  }

  private getRenderedContentBounds(element: HTMLElement): DOMRect {
    const baseRect = element.getBoundingClientRect();
    const descendants = Array.from(element.querySelectorAll<HTMLElement>('*'))
      .filter(candidate => this.isElementRendered(candidate));

    if (!descendants.length) {
      return baseRect;
    }

    let top = baseRect.top;
    let left = baseRect.left;
    let right = baseRect.right;
    let bottom = baseRect.top;

    for (const candidate of descendants) {
      const rect = candidate.getBoundingClientRect();
      top = Math.min(top, rect.top);
      left = Math.min(left, rect.left);
      right = Math.max(right, rect.right);
      bottom = Math.max(bottom, rect.bottom);
    }

    return new DOMRect(left, top, Math.max(right - left, 0), Math.max(bottom - top, 0));
  }

  private isCompactViewport(): boolean {
    return window.innerWidth <= 900;
  }

  private isSidebarStep(step: TourStep): boolean {
    return step.elementId.startsWith('sidebar-');
  }

  private isSidebarRelatedStep(step: TourStep): boolean {
    return this.isSidebarStep(step) ||
      step.elementId === 'alert-summery' ||
      !!step.additionalElementIds?.some(elementId => elementId.startsWith('sidebar-'));
  }

  private async ensureMobileViewportState(step: TourStep): Promise<void> {
    if (!this.isCompactViewport()) {
      return;
    }

    if (this.isSidebarStep(step)) {
      await this.ensureMobileSidebarExpanded();
      return;
    }

    await this.ensureMobileSidebarCollapsed();
  }

  private async ensureMobileSidebarExpanded(): Promise<void> {
    if (this.isExpandedSidebarVisible()) {
      return;
    }

    const expandButton = document.querySelector('[data-testid="sidebar-expand-button"]');
    if (expandButton instanceof HTMLElement) {
      expandButton.click();
      await this.waitForCompactSidebarState(true);
      await this.waitForAnimationFrames(2);
    }
  }

  private async ensureMobileSidebarCollapsed(): Promise<void> {
    if (!this.isExpandedSidebarVisible()) {
      return;
    }

    const collapseButton = document.querySelector('[data-testid="sidebar-collapse-button"]');
    if (collapseButton instanceof HTMLElement) {
      collapseButton.click();
      await this.waitForCompactSidebarState(false);
      await this.waitForAnimationFrames(2);
    }
  }

  private isExpandedSidebarVisible(): boolean {
    const expandButton = document.querySelector('[data-testid="sidebar-expand-button"]');
    return !(expandButton instanceof HTMLElement);
  }

  private waitForCompactSidebarState(expanded: boolean): Promise<void> {
    return new Promise(resolve => {
      const isReady = () => {
        const shell = document.querySelector('[data-testid="dashboard-shell"]');
        const collapseButton = document.querySelector('[data-testid="sidebar-collapse-button"]');
        const expandButton = document.querySelector('[data-testid="sidebar-expand-button"]');

        if (!(shell instanceof HTMLElement)) {
          return false;
        }

        const shellVisible = shell.offsetParent !== null;

        if (expanded) {
          return collapseButton instanceof HTMLElement && !shellVisible;
        }

        return expandButton instanceof HTMLElement && shellVisible;
      };

      if (isReady()) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {
        if (!isReady()) {
          return;
        }

        observer.disconnect();
        resolve();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      window.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1500);
    });
  }

  private getAdditionalSpotlightStyles(step: TourStep, padding: { top: number; right: number; bottom: number; left: number; }): Record<string, string>[] {
    if (!step.additionalElementIds?.length) {
      return [];
    }

    const minimumPadding = step.padding ?? 10;
    const additionalPadding = {
      top: Math.max(padding.top, minimumPadding),
      right: Math.max(padding.right, minimumPadding),
      bottom: Math.max(padding.bottom, minimumPadding),
      left: Math.max(padding.left, minimumPadding)
    };

    const styles: Record<string, string>[] = [];
    for (const elementId of step.additionalElementIds) {
      const element = document.getElementById(elementId);
      if (!element) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      const top = Math.max(rect.top - additionalPadding.top, 8);
      const left = Math.max(rect.left - additionalPadding.left, 8);
      const right = Math.min(rect.right + additionalPadding.right, window.innerWidth - 8);
      const bottom = Math.min(rect.bottom + additionalPadding.bottom, window.innerHeight - 8);
      const adjustedTop = this.isCompactViewport() && elementId.startsWith('sidebar-')
        ? Math.max(top, this.getCompactTooltipReservedTop())
        : top;

      styles.push({
        top: `${adjustedTop}px`,
        left: `${left}px`,
        width: `${Math.max(right - left, 0)}px`,
        height: `${Math.max(bottom - adjustedTop, 0)}px`
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

  private lockPageScroll(): void {
    const html = document.documentElement;
    const body = document.body;

    if (body.classList.contains('demo-tour-scroll-locked')) {
      return;
    }

    this.scrollLockY = window.scrollY;
    html.classList.add('no-scroll');
    html.classList.add('demo-tour-scroll-locked');
    body.classList.add('no-scroll');
    body.classList.add('demo-tour-scroll-locked');
    body.classList.add('demo-tour-active');
    this.syncRuntimeStyles();
  }

  private unlockPageScroll(): void {
    const html = document.documentElement;
    const body = document.body;

    if (!body.classList.contains('demo-tour-scroll-locked')) {
      html.classList.remove('no-scroll');
      html.classList.remove('demo-tour-scroll-locked');
      body.classList.remove('no-scroll');
      body.classList.remove('demo-tour-active');
      return;
    }

    html.classList.remove('no-scroll');
    html.classList.remove('demo-tour-scroll-locked');
    body.classList.remove('no-scroll');
    body.classList.remove('demo-tour-scroll-locked');
    body.classList.remove('demo-tour-active');
    this.syncRuntimeStyles();

    window.scrollTo(0, this.scrollLockY);
  }

  private resetHostStyles(): void {
    this.spotlightTop = '0px';
    this.spotlightLeft = '0px';
    this.spotlightWidth = '0px';
    this.spotlightHeight = '0px';
    this.tooltipTop = '0px';
    this.tooltipLeft = '0px';
    this.tooltipBottom = 'auto';
    this.progressWidth = '0%';
    this.cutoutRects = [];
    this.loadingVisible = false;
    this.preparingStep = false;
    this.geometryFrozen = false;
    this.lastRenderedGeometry = null;
    if (this.cutoutAnimationFrameId !== null) {
      cancelAnimationFrame(this.cutoutAnimationFrameId);
      this.cutoutAnimationFrameId = null;
    }
    if (this.geometryTrackingFrameId !== null) {
      cancelAnimationFrame(this.geometryTrackingFrameId);
      this.geometryTrackingFrameId = null;
    }
    this.syncRuntimeStyles();
  }

  private animateCutoutRects(nextCutoutRects: { top: number; left: number; width: number; height: number; rx: number; ry: number; }[]): void {
    if (this.cutoutAnimationFrameId !== null) {
      cancelAnimationFrame(this.cutoutAnimationFrameId);
      this.cutoutAnimationFrameId = null;
    }

    if (!this.cutoutRects.length || this.cutoutRects.length !== nextCutoutRects.length) {
      this.cutoutRects = nextCutoutRects;
      return;
    }

    const startRects = this.cutoutRects.map(rect => ({ ...rect }));
    const startedAt = performance.now();

    const tick = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(elapsed / this.cutoutTransitionMs, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 2);

      this.cutoutRects = nextCutoutRects.map((targetRect, index) => {
        const startRect = startRects[index];
        return {
          top: this.interpolateNumber(startRect.top, targetRect.top, easedProgress),
          left: this.interpolateNumber(startRect.left, targetRect.left, easedProgress),
          width: this.interpolateNumber(startRect.width, targetRect.width, easedProgress),
          height: this.interpolateNumber(startRect.height, targetRect.height, easedProgress),
          rx: this.interpolateNumber(startRect.rx, targetRect.rx, easedProgress),
          ry: this.interpolateNumber(startRect.ry, targetRect.ry, easedProgress)
        };
      });
      this.cdr.markForCheck();

      if (progress >= 1) {
        this.cutoutAnimationFrameId = null;
        return;
      }

      this.cutoutAnimationFrameId = requestAnimationFrame(tick);
    };

    this.cutoutAnimationFrameId = requestAnimationFrame(tick);
  }

  private interpolateNumber(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private syncRuntimeStyles(): void {
    const styleSheet = this.getRuntimeStyleSheet();
    if (!styleSheet) {
      return;
    }

    this.upsertRuntimeRule(styleSheet, DemoTourComponent.hostRuntimeSelector, [
      `--tour-accent: ${this.tourAccent}`,
      `--tour-accent-strong: ${this.tourAccentStrong}`,
      `--tour-spotlight-top: ${this.spotlightTop}`,
      `--tour-spotlight-left: ${this.spotlightLeft}`,
      `--tour-spotlight-width: ${this.spotlightWidth}`,
      `--tour-spotlight-height: ${this.spotlightHeight}`,
      `--tour-tooltip-top: ${this.tooltipTop}`,
      `--tour-tooltip-left: ${this.tooltipLeft}`,
      `--tour-tooltip-bottom: ${this.tooltipBottom}`,
      `--tour-tooltip-width: ${this.tooltipWidth}`,
      `--tour-progress-width: ${this.progressWidth}`
    ]);

    if (document.body.classList.contains('demo-tour-scroll-locked')) {
      this.upsertRuntimeRule(styleSheet, DemoTourComponent.bodyRuntimeSelector, [`top: -${this.scrollLockY}px`]);
      return;
    }

    this.removeRuntimeRule(styleSheet, DemoTourComponent.bodyRuntimeSelector);
  }

  private clearRuntimeStyles(): void {
    const styleSheet = this.getRuntimeStyleSheet();
    if (!styleSheet) {
      return;
    }

    this.removeRuntimeRule(styleSheet, DemoTourComponent.hostRuntimeSelector);
    this.removeRuntimeRule(styleSheet, DemoTourComponent.bodyRuntimeSelector);
  }

  private getRuntimeStyleSheet(): CSSStyleSheet | null {
    if (this.runtimeStyleSheet) {
      return this.runtimeStyleSheet;
    }

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const styleSheet = sheet;
        void styleSheet.cssRules;
        this.runtimeStyleSheet = styleSheet;
        return styleSheet;
      }
      catch {
        continue;
      }
    }

    return null;
  }

  private upsertRuntimeRule(styleSheet: CSSStyleSheet, selector: string, declarations: string[]): void {
    this.removeRuntimeRule(styleSheet, selector);
    styleSheet.insertRule(`${selector} { ${declarations.join('; ')}; }`, styleSheet.cssRules.length);
  }

  private removeRuntimeRule(styleSheet: CSSStyleSheet, selector: string): void {
    for (let index = styleSheet.cssRules.length - 1; index >= 0; index -= 1) {
      const rule = styleSheet.cssRules[index];
      if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
        styleSheet.deleteRule(index);
      }
    }
  }

  private triggerSpotlightReveal(): void {
    this.spotlightRevealVariant = this.spotlightRevealVariant === 0 ? 1 : 0;
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

  private triggerStepSubmit(element: HTMLElement, step: TourStep): void {
    const input = this.getStepInput(element, step);
    const form = input?.closest('form') ?? element.closest('form');
    if (!form) {
      return;
    }

    form.requestSubmit();
  }

  private waitForStepTarget(step: TourStep): Promise<void> {
    return new Promise(resolve => {
      if (this.hasStepTarget(step)) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {
        if (!this.hasStepTarget(step)) {
          return;
        }

        observer.disconnect();
        resolve();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      });

      window.setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 1500);
    });
  }

  private hasStepTarget(step: TourStep): boolean {
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
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      window.setTimeout(resolve, ms);
    });
  }

  private waitForAnimationFrames(count: number): Promise<void> {
    return new Promise(resolve => {
      const stepFrame = (remaining: number) => {
        if (remaining <= 0) {
          resolve();
          return;
        }

        requestAnimationFrame(() => stepFrame(remaining - 1));
      };

      stepFrame(count);
    });
  }

  private getTooltipAnchorElement(step: TourStep): HTMLElement | null {
    const finalElement = this.getStepElement(step);
    if (finalElement && this.isElementRendered(finalElement)) {
      return finalElement;
    }

    if (!step.activateSelector) {
      return finalElement;
    }

    const trigger = document.querySelector(step.activateSelector);
    if (!(trigger instanceof HTMLElement)) {
      return finalElement;
    }

    const triggerContainer = trigger.closest('[id]');
    if (triggerContainer instanceof HTMLElement && this.isElementRendered(triggerContainer)) {
      return triggerContainer;
    }

    return this.isElementRendered(trigger) ? trigger : finalElement;
  }

  private trackGeometryForWindow(step: TourStep, durationMs: number): Promise<void> {
    this.geometryFrozen = false;

    return new Promise(resolve => {
      const startedAt = performance.now();

      const tick = () => {
        if (this.step !== step || !this.visible || this.preparingStep) {
          this.geometryTrackingFrameId = null;
          resolve();
          return;
        }

        this.updatePosition();
        this.cdr.markForCheck();

        if (performance.now() - startedAt >= durationMs) {
          this.geometryFrozen = true;
          this.geometryTrackingFrameId = null;
          resolve();
          return;
        }

        this.geometryTrackingFrameId = requestAnimationFrame(tick);
      };

      if (this.geometryTrackingFrameId !== null) {
        cancelAnimationFrame(this.geometryTrackingFrameId);
      }

      this.geometryTrackingFrameId = requestAnimationFrame(tick);
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

  private waitForSidebarRectStability(step: TourStep, element: HTMLElement): Promise<void> {
    if (!step.elementId.startsWith('sidebar-')) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      let previousRect = element.getBoundingClientRect();
      let stableFrames = 0;
      let frameId = 0;
      let timeoutId = 0;
      const requiredStableFrames = 4;
      const tolerance = 1;

      const finish = () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
        }
        if (timeoutId) {
          window.clearTimeout(timeoutId);
        }
        resolve();
      };

      const tick = () => {
        const nextRect = element.getBoundingClientRect();
        const heightStable = Math.abs(nextRect.height - previousRect.height) <= tolerance;
        const topStable = Math.abs(nextRect.top - previousRect.top) <= tolerance;
        const widthStable = Math.abs(nextRect.width - previousRect.width) <= tolerance;

        if (heightStable && topStable && widthStable) {
          stableFrames += 1;
        }
        else {
          stableFrames = 0;
        }

        previousRect = nextRect;

        if (stableFrames >= requiredStableFrames) {
          finish();
          return;
        }

        frameId = requestAnimationFrame(tick);
      };

      timeoutId = window.setTimeout(() => finish(), 700);
      frameId = requestAnimationFrame(tick);
    });
  }

  private isElementRendered(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  private waitForElement(elementId: string): Promise<void> {
    return new Promise(resolve => {
      const existingElement = document.getElementById(elementId);
      if (existingElement instanceof HTMLElement && this.isElementRendered(existingElement)) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.getElementById(elementId);
        if (!(element instanceof HTMLElement) || !this.isElementRendered(element)) {
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
}
