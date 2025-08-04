import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CommonModule, DatePipe} from '@angular/common';
import {AppService} from '../../../../services/core/app/app.service';
import {JsonApiViewerComponent} from '../../json-api-viewer/json-api-viewer.component';
import {ReportMappingComponent} from "../../report-mapping/report-mapping.component";
import {DefacementResultItem} from '../../../model/results/defacement/defacement.callback.model';
import {ReportHeaderComponent} from "../../report-header/report-header.component";

@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html',
  imports: [CommonModule, DatePipe, JsonApiViewerComponent, ReportMappingComponent, ReportHeaderComponent]
})
export class ReportDefacementComponent implements OnInit {
  defacementData: DefacementResultItem | null = null;
  lang = "en";

  constructor(private route: ActivatedRoute, private appService: AppService) {
    this.lang = appService.getConfig().appSettings.language_allowed
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'];
      }
    });
  }
}
