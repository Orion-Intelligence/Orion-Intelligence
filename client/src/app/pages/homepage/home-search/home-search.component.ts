import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent {
  searchQuery = '';

  constructor(private route: ActivatedRoute, private router: Router) {
  }

  onSearchSubmit(): void {
    const queryParams = {
      ...this.route.snapshot.queryParams,
      q: this.searchQuery || null
    };

    this.router.navigate(['/dashboard/breach/databases'], {
      queryParams,
      queryParamsHandling: 'merge'
    }).then();
  }
}
