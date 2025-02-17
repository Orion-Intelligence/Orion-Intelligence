import { Component } from '@angular/core';
import {ToolbarComponent} from '../../shared/partials/toolbar/toolbar.component';
import {HomeSearchComponent} from '../../shared/partials/home/home-search/home-search.component';
import {HomeInsightComponent} from '../../shared/partials/home/home-insight/home-insight.component';
import {NgOptimizedImage} from '@angular/common';

@Component({
  selector: 'app-index',
  imports: [
    ToolbarComponent,
    HomeSearchComponent,
    HomeInsightComponent,
    NgOptimizedImage
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {

}
