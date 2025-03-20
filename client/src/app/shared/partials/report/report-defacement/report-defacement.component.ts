import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {DefacementResultItem} from '../../../model/results/defacement/defacement.param.model';
import {NgOptimizedImage} from '@angular/common';
import {HelperService} from '../../../services/helper.service';

@Component({
  selector: 'app-report-defacement',
  templateUrl: './report-defacement.component.html',
  imports: [NgOptimizedImage],
  styleUrls: ['./report-defacement.component.css']
})
export class ReportDefacementComponent implements OnInit {
  defacementData: DefacementResultItem | null = null;
  safeUrl: SafeResourceUrl;

  constructor(private sanitizer: DomSanitizer, private route: ActivatedRoute, private resultHelperService: HelperService) {
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl('');
  }

  downloadCSV() {
    this.resultHelperService.downloadAsCSV(this.defacementData);
  }

  langUpdate() {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('lang', "en");
    window.location.href = currentUrl.toString();
  }

  printPage() {
    this.resultHelperService.printPage();
  }

  shareResult() {
    this.resultHelperService.shareResult(this.defacementData?.m_mirror_links[0] || '');
  }

  redirectToUrl() {
    if (this.defacementData && this.defacementData.m_web_url) {
      window.open(this.defacementData.m_mirror_links[0], '_blank');
    }
  }

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['reportdata']) {
        this.defacementData = data['reportdata'];
        if (this.defacementData) {
          this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.defacementData.m_mirror_links[0]);
        }
      }
    });
  }
}
