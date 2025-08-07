import { InjectionToken } from '@angular/core';
import { ChartComponentLike, Defaults } from 'chart.js';
import { DeepPartial } from 'chart.js/dist/types/utils';
export declare const NG_CHARTS_CONFIGURATION: InjectionToken<NgChartsConfiguration>;
export type NgChartsConfiguration = {
    /**
     * Any registerable that can be used with `Chart.register()`, such as plugins, controllers, scales, and elements.
     */
    registerables?: readonly ChartComponentLike[];
    /**
     * Default configuration that can be used with `defaults.set()`.
     */
    defaults?: DeepPartial<Defaults>;
};
/**
 * Provide all the default registerable as defined by Chart.js
 */
export declare function withDefaultRegisterables(...registerables: ChartComponentLike[]): NgChartsConfiguration;
/**
 * Provide configuration for ngCharts. In most cases, you have to pass it some registerables. So either
 * `withDefaultRegisterables()`, or a custom list of registerables tailored to your needs to reduce bundle size.
 */
export declare function provideCharts(...configurations: readonly NgChartsConfiguration[]): {
    provide: InjectionToken<NgChartsConfiguration>;
    useValue: NgChartsConfiguration;
};
