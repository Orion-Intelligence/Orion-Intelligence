import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DefacementCallbackModel, DefacementResultItem} from '../../../../../model/results/defacement/defacement.callback.model';
import {TooltipDirective} from '../../../../../directive/tooltip-directive.directive';
import {HelperService} from '../../../../../services/helper.service';

@Component({
  selector: 'app-defacement-results',
  imports: [CommonModule, TooltipDirective],
  templateUrl: './defacement-results.component.html',
  styleUrl: './defacement-results.component.css'
})
export class DefacementResultsComponent implements OnInit, OnChanges {
  @Input() results!: DefacementCallbackModel | undefined;
  @Input() isExpandable = false;

  isResultsBarExpanded = false;
  threatTypeCounts: { [key: string]: number } = {};

  constructor(protected helperService:HelperService) {
  }

  ngOnInit(): void {
    if (this.results) {
      this.updateThreatTypeCounts(this.results.Result);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['results'] && changes['results'].currentValue) {
      this.updateThreatTypeCounts(this.results!.Result);
    }
  }

  updateThreatTypeCounts(results: DefacementResultItem[]) {
    this.threatTypeCounts = {};
    results.forEach(item => {
      const type = item.m_ioc_type?.[0] || 'Unknown';
      if (!this.threatTypeCounts[type]) {
        this.threatTypeCounts[type] = 0;
      }
      this.threatTypeCounts[type]++;
    });
  }

  explore(route: string, q:string) {
    let query = this.helperService.extractDomain(q)
    if(query.length>0){
      q = `"${query}"`;
    }
    if(route!=="phishing" && route!=="hacked"){
      route = "databases"
    }
    const url = `/dashboard/defacement/${route}?q=${encodeURIComponent(q)}`;
    window.open(url, '_blank');
  }

  toggleResultsBarCollapse(): void {
    this.isExpandable = !this.isExpandable;
  }
}
