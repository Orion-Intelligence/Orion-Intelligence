import {Component} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {AppService} from '../../../services/core/app.service';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent {
  searchQuery: string = '';

  constructor(private router: Router, public appService:AppService) {
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

  protected readonly JSON = JSON;
}
