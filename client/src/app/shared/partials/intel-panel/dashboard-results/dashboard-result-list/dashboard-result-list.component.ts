import {Component, Input, OnInit} from '@angular/core';
import {NgForOf, NgIf} from '@angular/common';
import {DefacementResultItem} from '../../../../model/results/defacement/defacement.param.model';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';

@Component({
  selector: 'app-dashboard-result-list',
  standalone: true, imports: [NgIf, NgForOf, RouterLink],
  templateUrl: './dashboard-result-list.component.html'
})
export class DashboardResultListComponent implements OnInit {
  @Input() searchResults: (DefacementResultItem)[] = [];
  currentUrl: string = '';

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(_ => {});
  }
}
