import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import {
  DefacementModel,
  GenericModel,
  InsightCallbackModel,
  LeakModel
} from '../../../shared/model/homepage/insight.model';
import { TooltipDirective } from '../../../shared/directive/tooltip-directive.directive';
import { ConsolidatedParamModel } from '../../../shared/model/results/consolidated/consolidated.param.model';
import { ConsolidatedCallbackModel } from '../../../shared/model/results/consolidated/consolidated.callback.model';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass, TooltipDirective],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  public consolidatedParamModel: ConsolidatedParamModel = new ConsolidatedParamModel();
  public consolidatedCallbackModel: ConsolidatedCallbackModel = new ConsolidatedCallbackModel();
  insights!: InsightCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];
  consolidatedModelKeys: string[] = [];
  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    // this.insights = this.route.snapshot.data['insights'];
    const data = this.route.snapshot.data['insights'];
    this.insights = data.insights;
    this.consolidatedCallbackModel = data.consolidated;

    this.consolidatedModelKeys = Object.keys(this.consolidatedCallbackModel).filter(key => {
      const model = (this.consolidatedCallbackModel as any)[key];
      return model?.Result?.length > 0;
    });
  }

  getKeys(obj: GenericModel | LeakModel | DefacementModel): string[] {
    return obj ? Object.keys(obj) : [];
  }

  getDisplayTitle(item: any): string {
    return item?.m_title || item?.m_name || item?.m_caption || item?.m_url || 'Untitled';
  }

  // Optional: format model key to readable title
  formatModelKey(key: string): string {
    return key
      .replace('_model', '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
  }
  getResultItems(modelKey: string): any[] {
    const model = (this.consolidatedCallbackModel as any)[modelKey];
    return model?.Result ?? [];
  }
}
