import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgClass, NgForOf, NgIf, NgOptimizedImage } from '@angular/common';
import { InsightCallbackModel, GenericModel, LeakModel, DefacementModel } from '../../../shared/model/homepage/insight.model';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass],
  standalone: true
})
export class HomeInsightComponent implements OnInit {
  insights!: InsightCallbackModel;
  models: ("general" | "leak" | "defacement")[] = ["general", "leak", "defacement"];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.insights = this.route.snapshot.data['insights'];
  }

  getKeys(obj: GenericModel | LeakModel | DefacementModel): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
