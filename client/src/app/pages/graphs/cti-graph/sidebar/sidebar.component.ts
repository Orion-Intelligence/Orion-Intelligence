import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgForOf, NgIf, TitleCasePipe } from '@angular/common';
import { GraphClusterType, GraphType, search_filter_labels } from '../../../../shared/constants/shared-enums';
import { SidebarShellComponent } from '../../shared/sidebar-shell/sidebar-shell.component';
@Component({
    selector: 'graph-sidebar',
    standalone: true,
    templateUrl: './sidebar.component.html',
    imports: [FormsModule, ReactiveFormsModule, NgForOf, NgIf, TitleCasePipe, SidebarShellComponent],
})
export class SidebarComponent implements OnInit {
    @Output()
    filtersApplied = new EventEmitter<{
        selectedType: string;
        singleInput: string;
        propertyType: string;
        propertyValue: string;
        maxEdge: number;
        maxDepth: number;
    }>();
    @Output()
    collapsedChange = new EventEmitter<boolean>();
    isCollapsed = false;
    isMobile = false;
    selectedType = 'cluster';
    singleInput = 'all';
    propertyType = 'all';
    propertyValue = '';
    maxNodes = 25;
    maxDepth = 1;
    graphTypeOptions = Object.values(GraphType);
    graphClusterOptions = Object.values(GraphClusterType);
    graphAllowedProperties = Object.entries(search_filter_labels).map(([key, label]) => ({
        label,
        key
    }));
    constructor(private router: Router, private route: ActivatedRoute) {
    }
    private buildFilterPayload() {
        return {
            selectedType: this.selectedType,
            singleInput: this.singleInput,
            propertyType: this.propertyType,
            propertyValue: this.propertyValue,
            maxEdge: this.maxNodes,
            maxDepth: this.maxDepth
        };
    }
    private navigateWithFilters() {
        this.router.navigate([], { queryParams: this.buildFilterPayload() }).then();
    }
    private emitFilters() {
        this.filtersApplied.emit(this.buildFilterPayload());
    }
    ngOnInit(): void {
        this.updateViewportState();
        this.route.queryParams.subscribe(params => {
            this.selectedType = params['selectedType'] || 'cluster';
            this.singleInput = params['singleInput'] || 'all';
            this.propertyType = params['propertyType'] || 'all';
            this.propertyValue = params['propertyValue'] || '';
            this.maxNodes = (+params['maxEdge'] > 800 || +params['maxEdge'] < 0) ? '25' : (params['maxEdge'] || '25');
            this.maxDepth = (+params['maxDepth'] > 5 || +params['maxDepth'] < 0) ? '1' : (params['maxDepth'] || '1');
            this.emitFilters();
        });
    }
    private updateViewportState(): void {
        if (typeof window === 'undefined') {
            return;
        }
        const nextIsMobile = window.innerWidth < 768;
        if (nextIsMobile !== this.isMobile) {
            this.isMobile = nextIsMobile;
            if (this.isMobile) {
                this.isCollapsed = true;
                this.collapsedChange.emit(this.isCollapsed);
            }
        }
    }
    @HostListener('window:resize')
    onWindowResize(): void {
        this.updateViewportState();
    }
    applyFilters() {
        this.navigateWithFilters();
        this.emitFilters();
    }
    toggleCollapsed() {
        this.isCollapsed = !this.isCollapsed;
        this.collapsedChange.emit(this.isCollapsed);
    }
    onMobileBackdropClick(): void {
        if (!this.isMobile) {
            return;
        }
        this.isCollapsed = true;
        this.collapsedChange.emit(this.isCollapsed);
    }
    resetFilters() {
        this.selectedType = 'cluster';
        this.singleInput = 'all';
        this.propertyType = 'all';
        this.propertyValue = '';
        this.navigateWithFilters();
        this.emitFilters();
    }
    onFormatPropertyType(type: string) {
        return type.toLowerCase().replace("m_", "").replace("_", " ");
    }
    onTypeChange(type: string) {
        this.selectedType = type;
        if (type === 'cluster') {
            this.singleInput = 'all';
        }
        else if (type === 'document') {
            this.singleInput = '';
        }
        else if (type === 'property') {
            this.propertyType = 'all';
            this.propertyValue = '';
        }
    }
    validateMaxNodes() {
        if (!this.maxNodes || this.maxNodes < 20 || this.maxNodes > 800) {
            this.maxNodes = 25;
        }
    }
    validateMaxDepth() {
        if (!this.maxDepth || this.maxDepth < 1 || this.maxDepth > 5) {
            this.maxDepth = 2;
        }
    }
}
