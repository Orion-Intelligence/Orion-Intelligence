import {AfterViewInit, Component, Input, OnInit} from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {ChatResultItem} from '../../../../model/results/chat/chat.callback.model';
import {DatePipe, NgForOf, NgIf, SlicePipe} from '@angular/common';
import {ScrollService} from '../../../../services/scroll.service';

@Component({
  selector: 'app-dashboard-result-chat',
  imports: [
    NgForOf,
    DatePipe,
    NgIf,
    SlicePipe,
    RouterLink
  ],
  templateUrl: './dashboard-result-chat.component.html',
  styleUrl: './dashboard-result-chat.component.css'
})
export class DashboardResultChatComponent implements OnInit, AfterViewInit {
  @Input() searchResults: ChatResultItem[] = [];
  currentUrl: string = '';
  queryParams: any = {};

  constructor(private router: Router, private route: ActivatedRoute, protected scrollService: ScrollService) {
  }

  ngAfterViewInit() {
    this.scrollService.scrollToSavedPosition();
  }

  ngOnInit() {
    console.log(this.searchResults)
    this.currentUrl = this.router.url.split('?')[0];
    this.route.queryParams.subscribe(params => {
      this.queryParams = params;
    });
  }
}
