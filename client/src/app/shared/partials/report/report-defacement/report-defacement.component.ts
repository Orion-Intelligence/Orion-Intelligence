import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DefacementResultItem } from '../../../model/results/defacement/defacement.param.model';
import { DatePipe, NgOptimizedImage } from '@angular/common';
import { HelperService } from '../../../services/helper.service';
import { AppService } from '../../../../services/core/app.service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html', imports: [NgOptimizedImage, DatePipe, MatTooltipModule],
  styleUrls: ['./report-defacement.component.css']
})
export class ReportDefacementComponent implements OnInit {
  defacementData: DefacementResultItem | null = null;
  lang: string = "en";

  constructor(private route: ActivatedRoute, private resultHelperService: HelperService, appService: AppService) {
    this.lang = appService.getConfig().language_allowed
  }

  downloadCSV() {
    this.resultHelperService.downloadAsCSV(this.defacementData);
  }

  langUpdate() {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', this.lang);
    window.location.href = currentUrl.toString();
  }

  printPage() {
    this.resultHelperService.printPage();
  }

  shareResult() {
    this.resultHelperService.shareResult(this.defacementData?.m_url || '');
  }

  redirectToUrl() {
    if (this.defacementData && this.defacementData.m_web_url) {
      window.open(this.defacementData.m_url, '_blank');
    }
  }

  open_graph() {
    const baseUrl = `${window.location.origin}/dashboard/ctigraph`;
    const parts = window.location.pathname.split('/');
    const singleInput = parts[parts.length - 1];

    const params = new URLSearchParams({
      selectedType: 'document', singleInput: singleInput
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;
    window.open(fullUrl, '_blank');
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'];
      }
    });
  }
}
