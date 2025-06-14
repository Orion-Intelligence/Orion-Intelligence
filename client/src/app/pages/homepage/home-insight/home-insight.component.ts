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
  tooltipMap: Record<string, string> = {
    document_count: 'Total Docs Fetched',
    most_recent: 'Latest Data Update',
    oldest_update: 'Oldest Fetch Date',
    updated_5_days_ago: 'Recent 5-Day Data',
    updated_9_days_ago: 'Last 9 Days update',
    average_score: 'Relevance Score Avg',
    url_document_count: 'Total URLs Found',
    archive_document_count: 'Legacy Content Insight',
    email_document_count: 'Email Discovery Rate',
    phone_document_count: 'Phone Numbers Found',
    clearnet_document_count: 'Clearnet Link Count',
    common_types: 'Content Classification',
    unique_base_urls: 'Unique base URLs found',
    dumps_document_count: 'Documents from dumps',
    top_team: 'Top defacement team',
    common_server: 'Most commonly defaced server',
  };

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.insights = this.route.snapshot.data['insights'];
  }

  getKeys(obj: GenericModel | LeakModel | DefacementModel): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
