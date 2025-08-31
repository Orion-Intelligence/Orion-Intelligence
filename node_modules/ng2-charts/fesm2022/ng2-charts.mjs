import * as i0 from '@angular/core';
import { InjectionToken, Injectable, EventEmitter, Directive, Optional, Inject, Input, Output } from '@angular/core';
import { registerables, Chart, defaults } from 'chart.js';
import { merge } from 'lodash-es';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

const NG_CHARTS_CONFIGURATION = new InjectionToken('Configuration for ngCharts');
/**
 * Provide all the default registerable as defined by Chart.js
 */
function withDefaultRegisterables(...registerables$1) {
    return { registerables: [...registerables, ...registerables$1] };
}
/**
 * Provide configuration for ngCharts. In most cases, you have to pass it some registerables. So either
 * `withDefaultRegisterables()`, or a custom list of registerables tailored to your needs to reduce bundle size.
 */
function provideCharts(...configurations) {
    const config = merge({}, ...configurations);
    return { provide: NG_CHARTS_CONFIGURATION, useValue: config };
}

class ThemeService {
    constructor() {
        this.colorschemesOptions = new BehaviorSubject(undefined);
    }
    setColorschemesOptions(options) {
        this.pColorschemesOptions = options;
        this.colorschemesOptions.next(options);
    }
    getColorschemesOptions() {
        return this.pColorschemesOptions;
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.0.5", ngImport: i0, type: ThemeService, deps: [], target: i0.ɵɵFactoryTarget.Injectable }); }
    static { this.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "19.0.5", ngImport: i0, type: ThemeService, providedIn: 'root' }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.0.5", ngImport: i0, type: ThemeService, decorators: [{
            type: Injectable,
            args: [{
                    providedIn: 'root',
                }]
        }] });

class BaseChartDirective {
    constructor(element, zone, themeService, config) {
        this.zone = zone;
        this.themeService = themeService;
        this.type = 'bar';
        this.plugins = [];
        this.chartClick = new EventEmitter();
        this.chartHover = new EventEmitter();
        this.subs = [];
        this.themeOverrides = {};
        if (config?.registerables) {
            Chart.register(...config.registerables);
        }
        if (config?.defaults) {
            defaults.set(config.defaults);
        }
        this.ctx = element.nativeElement.getContext('2d');
        this.subs.push(this.themeService.colorschemesOptions
            .pipe(distinctUntilChanged())
            .subscribe((r) => this.themeChanged(r)));
    }
    ngOnChanges(changes) {
        const requireRender = ['type'];
        const propertyNames = Object.getOwnPropertyNames(changes);
        if (propertyNames.some((key) => requireRender.includes(key)) ||
            propertyNames.every((key) => changes[key].isFirstChange())) {
            this.render();
        }
        else {
            const config = this.getChartConfiguration();
            // Using assign to avoid changing the original object reference
            if (this.chart) {
                Object.assign(this.chart.config.data, config.data);
                if (this.chart.config.plugins) {
                    Object.assign(this.chart.config.plugins, config.plugins);
                }
                if (this.chart.config.options) {
                    Object.assign(this.chart.config.options, config.options);
                }
            }
            this.update();
        }
    }
    ngOnDestroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = void 0;
        }
        this.subs.forEach((s) => s.unsubscribe());
    }
    render() {
        if (this.chart) {
            this.chart.destroy();
        }
        return this.zone.runOutsideAngular(() => (this.chart = new Chart(this.ctx, this.getChartConfiguration())));
    }
    update(mode) {
        if (this.chart) {
            this.zone.runOutsideAngular(() => this.chart?.update(mode));
        }
    }
    hideDataset(index, hidden) {
        if (this.chart) {
            this.chart.getDatasetMeta(index).hidden = hidden;
            this.update();
        }
    }
    isDatasetHidden(index) {
        return this.chart?.getDatasetMeta(index)?.hidden;
    }
    toBase64Image() {
        return this.chart?.toBase64Image();
    }
    themeChanged(options) {
        this.themeOverrides = options;
        if (this.chart) {
            if (this.chart.config.options) {
                Object.assign(this.chart.config.options, this.getChartOptions());
            }
            this.update();
        }
    }
    getChartOptions() {
        return merge({
            onHover: (event, active) => {
                if (!this.chartHover.observed && !this.chartHover.observers?.length) {
                    return;
                }
                this.zone.run(() => this.chartHover.emit({ event, active }));
            },
            onClick: (event, active) => {
                if (!this.chartClick.observed && !this.chartClick.observers?.length) {
                    return;
                }
                this.zone.run(() => this.chartClick.emit({ event, active }));
            },
        }, this.themeOverrides, this.options, {
            plugins: {
                legend: {
                    display: this.legend,
                },
            },
        });
    }
    getChartConfiguration() {
        return {
            type: this.type,
            data: this.getChartData(),
            options: this.getChartOptions(),
            plugins: this.plugins,
        };
    }
    getChartData() {
        return this.data
            ? this.data
            : {
                labels: this.labels || [],
                datasets: this.datasets || [],
            };
    }
    static { this.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "19.0.5", ngImport: i0, type: BaseChartDirective, deps: [{ token: i0.ElementRef }, { token: i0.NgZone }, { token: ThemeService }, { token: NG_CHARTS_CONFIGURATION, optional: true }], target: i0.ɵɵFactoryTarget.Directive }); }
    static { this.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "19.0.5", type: BaseChartDirective, isStandalone: true, selector: "canvas[baseChart]", inputs: { type: "type", legend: "legend", data: "data", options: "options", plugins: "plugins", labels: "labels", datasets: "datasets" }, outputs: { chartClick: "chartClick", chartHover: "chartHover" }, exportAs: ["base-chart"], usesOnChanges: true, ngImport: i0 }); }
}
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "19.0.5", ngImport: i0, type: BaseChartDirective, decorators: [{
            type: Directive,
            args: [{
                    // eslint-disable-next-line @angular-eslint/directive-selector
                    selector: 'canvas[baseChart]',
                    exportAs: 'base-chart',
                    standalone: true,
                }]
        }], ctorParameters: () => [{ type: i0.ElementRef }, { type: i0.NgZone }, { type: ThemeService }, { type: undefined, decorators: [{
                    type: Optional
                }, {
                    type: Inject,
                    args: [NG_CHARTS_CONFIGURATION]
                }] }], propDecorators: { type: [{
                type: Input
            }], legend: [{
                type: Input
            }], data: [{
                type: Input
            }], options: [{
                type: Input
            }], plugins: [{
                type: Input
            }], labels: [{
                type: Input
            }], datasets: [{
                type: Input
            }], chartClick: [{
                type: Output
            }], chartHover: [{
                type: Output
            }] } });

/*
 * Public API Surface of ng2-charts
 */

/**
 * Generated bundle index. Do not edit.
 */

export { BaseChartDirective, NG_CHARTS_CONFIGURATION, ThemeService, provideCharts, withDefaultRegisterables };
//# sourceMappingURL=ng2-charts.mjs.map
