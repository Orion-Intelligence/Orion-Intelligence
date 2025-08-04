import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {AppService} from '../../../services/core/app/app.service';
import {GraphAllowedPropertyKey, GraphClusterType, GraphType} from '../../../shared/constants/shared-enums';

@Component({
  selector: 'graph-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [FormsModule, ReactiveFormsModule, NgForOf, NgIf, TitleCasePipe],
})
export class SidebarComponent implements OnInit {
  @Output() filtersApplied = new EventEmitter<{
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
  }>();

  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  maxNodes = 25;
  maxDepth = 1;

  graphTypeOptions = Object.values(GraphType);
  graphClusterOptions = Object.values(GraphClusterType);
  graphAllowedProperties = Object.entries(GraphAllowedPropertyKey).map(([label, key]) => ({
    label,
    key
  }));

  constructor(protected appService: AppService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedType = params['selectedType'] || 'cluster';
      this.singleInput = params['singleInput'] || 'all';
      this.propertyType = params['propertyType'] || 'all';
      this.propertyValue = params['propertyValue'] || '';
      this.maxNodes = (+params['maxEdge'] > 800 || +params['maxEdge'] < 0) ? '25' : (params['maxEdge'] || '25');
      this.maxDepth = (+params['maxDepth'] > 5 || +params['maxDepth'] < 0) ? '1' : (params['maxDepth'] || '1');

      this.filtersApplied.emit({
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: this.maxNodes,
        maxDepth: this.maxDepth
      });
    });
  }

  applyFilters() {
    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: this.maxNodes,
        maxDepth: this.maxDepth
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: this.maxNodes,
      maxDepth: this.maxDepth
    });
  }

  resetFilters() {
    this.selectedType = 'cluster';
    this.singleInput = 'all';
    this.propertyType = 'all';
    this.propertyValue = '';

    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: this.maxNodes,
        maxDepth: this.maxDepth
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: this.maxNodes,
      maxDepth: this.maxDepth
    });
  }

  onFormatPropertyType(type: string) {
    return type.toLowerCase().replace("m_", "").replace("_", " ")
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    if (type === 'cluster') {
      this.singleInput = 'all';
    } else if (type === 'document') {
      this.singleInput = '';
    } else if (type === 'property') {
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
