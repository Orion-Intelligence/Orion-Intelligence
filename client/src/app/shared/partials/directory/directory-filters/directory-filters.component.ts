import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {NgOptimizedImage} from '@angular/common';


@Component({
  selector: 'app-filters',
  templateUrl: './directory-filters.component.html',
  styleUrls: ['./directory-filters.component.css'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    NgOptimizedImage
  ],
})
export class FiltersComponent {
  filterForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      network: [''],
      index: [''],
      content_type: ['']
    });
  }

  onSubmit() {
    console.log('Filter applied:', this.filterForm.value);
  }

  resetFilters() {
    this.filterForm.reset({
      network: '',
      index: '',
      content_type: ''
    });
  }
}
