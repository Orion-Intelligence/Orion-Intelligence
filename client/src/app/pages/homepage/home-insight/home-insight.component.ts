import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import {
  DefacementModel,
  GenericModel,
  InsightCallbackModel,
  LeakModel
} from '../../../shared/model/homepage/insight.model';
import {TooltipDirective} from '../../../shared/directive/tooltip-directive.directive';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass, TooltipDirective],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  insights!: InsightCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.insights = this.route.snapshot.data['insights'];
  }

  getKeys(obj: GenericModel | LeakModel | DefacementModel): string[] {
    return obj ? Object.keys(obj) : [];
  }

  protected readonly String = String;
}
