import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from "@angular/common";

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent {
  searchQuery: string = '';
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
