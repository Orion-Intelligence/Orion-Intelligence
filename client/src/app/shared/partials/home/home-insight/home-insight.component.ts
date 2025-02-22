import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import { InsightCallbackModel, GenericModel, LeakModel } from '../../../model/callback/insight';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass],
})
export class HomeInsightComponent implements OnInit {
  insights!: InsightCallbackModel;
  models: ("general" | "leak")[] = ["general", "leak"];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.insights = this.route.snapshot.data['insights'];
  }

  getKeys(obj: GenericModel | LeakModel): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
