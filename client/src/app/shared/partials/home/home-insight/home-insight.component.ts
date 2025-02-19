import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {NgClass, NgForOf, NgIf, NgOptimizedImage} from '@angular/common';
import { InsightData, GenericModel, LeakModel } from '../../../model/insight';

@Component({
  selector: 'app-home-insight',
  templateUrl: './home-insight.component.html',
  imports: [NgForOf, NgIf, NgOptimizedImage, NgClass],
})
export class HomeInsightComponent implements OnInit {
  insights!: InsightData;
  models: ("general" | "leak")[] = ["general", "leak"];

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.insights = this.route.snapshot.data['insights'];
  }

  getKeys(obj: GenericModel | LeakModel): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
