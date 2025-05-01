import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgOptimizedImage } from "@angular/common";

import { TestService } from '../../../services/test/test.service';

@Component({
  selector: 'app-home-search',
  standalone: true,
  imports: [FormsModule, NgOptimizedImage, CommonModule],
  templateUrl: './home-search.component.html',
})
export class HomeSearchComponent {
  searchQuery: string = '';

  responseMessage: string = '';
  saveResult: any;
  searchResult: any;

  constructor(private route: ActivatedRoute, private router: Router, private testService: TestService) {
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



  // my test code 

  // saveData() {
  //   const sampleData = { message: 'Hello from Angular!' };
  //   this.testService.saveMessage(sampleData).subscribe({
  //     next: res => {
  //       this.saveResult = res;
  //       console.log('Saved!', res);
  //     },
  //     error: err => {
  //       console.error('Save failed', err);
  //       this.saveResult = 'Save failed';
  //     }
  //   });
  // }

  // searchData() {
  //   this.testService.searchMessages().subscribe({
  //     next: res => {
  //       this.searchResult = res;
  //       console.log('Search result', res);
  //     },
  //     error: err => {
  //       console.error('Search failed', err);
  //       this.searchResult = 'Search failed';
  //     }
  //   });
  // }

  // callHelloWorld() {
  //   this.testService.getHelloWorld().subscribe({
  //     next: (data) => {
  //       this.responseMessage = data.message;
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.responseMessage = 'API call failed!';
  //     }
  //   });
  // }
}
