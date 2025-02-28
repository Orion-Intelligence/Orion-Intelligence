import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {DashboardService} from '../../../../services/dashboard/dashboard.service';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [NgOptimizedImage, FormsModule],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent {
  searchQuery: string = '';

  constructor(private router: Router) {
  }

  onSearchSubmit(event: Event) {
    event.preventDefault();
    if (this.searchQuery.trim()) {
      this.router.navigate(['/dashboard'], {
        queryParams: {q: this.searchQuery},
        queryParamsHandling: 'merge'
      }).then();
    }
  }
}
