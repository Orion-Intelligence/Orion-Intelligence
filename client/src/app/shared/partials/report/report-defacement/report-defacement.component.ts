import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {DefacementResultItem} from '../../../model/results/defacement/defacement.param.model';

@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html',
  styleUrls: ['./report-defacement.component.css']
})
export class ReportDefacementComponent implements OnInit {
  defacementData: DefacementResultItem | null = null;
  safeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer, private route: ActivatedRoute) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'];
        if(this.defacementData){
          this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.defacementData.m_web_server[0]);
        }
      }
    });
  }
}
