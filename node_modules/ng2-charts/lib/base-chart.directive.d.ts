import { ElementRef, EventEmitter, NgZone, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { Chart, ChartConfiguration, ChartEvent, ChartType, DefaultDataPoint, Plugin, UpdateMode } from 'chart.js';
import { ThemeService } from './theme.service';
import { NgChartsConfiguration } from './ng-charts.provider';
import * as i0 from "@angular/core";
export declare class BaseChartDirective<TType extends ChartType = ChartType, TData = DefaultDataPoint<TType>, TLabel = unknown> implements OnDestroy, OnChanges {
    private zone;
    private themeService;
    type: ChartConfiguration<TType, TData, TLabel>['type'];
    legend?: boolean;
    data?: ChartConfiguration<TType, TData, TLabel>['data'];
    options: ChartConfiguration<TType, TData, TLabel>['options'];
    plugins: Plugin<TType>[];
    labels?: ChartConfiguration<TType, TData, TLabel>['data']['labels'];
    datasets?: ChartConfiguration<TType, TData, TLabel>['data']['datasets'];
    chartClick: EventEmitter<{
        event?: ChartEvent;
        active?: object[];
    }>;
    chartHover: EventEmitter<{
        event: ChartEvent;
        active: object[];
    }>;
    ctx: string;
    chart?: Chart<TType, TData, TLabel>;
    private subs;
    private themeOverrides;
    constructor(element: ElementRef, zone: NgZone, themeService: ThemeService, config?: NgChartsConfiguration);
    ngOnChanges(changes: SimpleChanges): void;
    ngOnDestroy(): void;
    render(): Chart<TType, TData, TLabel>;
    update(mode?: UpdateMode): void;
    hideDataset(index: number, hidden: boolean): void;
    isDatasetHidden(index: number): boolean | undefined;
    toBase64Image(): string | undefined;
    private themeChanged;
    private getChartOptions;
    private getChartConfiguration;
    private getChartData;
    static ɵfac: i0.ɵɵFactoryDeclaration<BaseChartDirective<any, any, any>, [null, null, null, { optional: true; }]>;
    static ɵdir: i0.ɵɵDirectiveDeclaration<BaseChartDirective<any, any, any>, "canvas[baseChart]", ["base-chart"], { "type": { "alias": "type"; "required": false; }; "legend": { "alias": "legend"; "required": false; }; "data": { "alias": "data"; "required": false; }; "options": { "alias": "options"; "required": false; }; "plugins": { "alias": "plugins"; "required": false; }; "labels": { "alias": "labels"; "required": false; }; "datasets": { "alias": "datasets"; "required": false; }; }, { "chartClick": "chartClick"; "chartHover": "chartHover"; }, never, never, true, never>;
}
