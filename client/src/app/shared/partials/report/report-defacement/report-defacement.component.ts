import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DefacementResultItem} from '../../../model/results/defacement/defacement.param.model';
import {CommonModule, DatePipe, NgOptimizedImage} from '@angular/common';
import {HelperService} from '../../../services/helper.service';
import {AppService} from '../../../../services/core/app.service';
import {TooltipDirective} from '../../../directive/tooltip-directive.directive';
import {JsonApiViewerComponent} from '../../json-api-viewer/json-api-viewer.component';
import {ReportMappingListComponent} from "../report-mapping-list/report-mapping-list.component";

@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html',
  imports: [CommonModule, NgOptimizedImage, DatePipe, TooltipDirective, JsonApiViewerComponent, ReportMappingListComponent]
})
export class ReportDefacementComponent implements OnInit {
  defacementData: DefacementResultItem | null = null;
  lang = "en";

  constructor(private route: ActivatedRoute, private helperService: HelperService, appService: AppService) {
    this.lang = appService.getConfig().language_allowed
  }

  downloadCSV() {
    this.helperService.downloadAsCSV(this.defacementData);
  }

  printPage() {
    this.helperService.printPage();
  }

  shareResult() {
    this.helperService.shareResult(this.defacementData?.m_url || '');
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
