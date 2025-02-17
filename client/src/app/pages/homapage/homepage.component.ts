import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {ToolbarComponent} from '../../shared/partials/toolbar/toolbar.component';
import {HomeSearchComponent} from '../../shared/partials/home/home-search/home-search.component';
import {HomeInsightComponent} from '../../shared/partials/home/home-insight/home-insight.component';

@Component({
  selector: 'app-index',
  imports: [
    NgOptimizedImage,
    ToolbarComponent,
    HomeSearchComponent,
    HomeInsightComponent
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.css'
})
export class HomepageComponent {

}
