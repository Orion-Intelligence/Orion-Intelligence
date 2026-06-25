import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-case-details-skeleton',
  imports: [CommonModule],
  host: { class: 'block' },
  templateUrl: './case-details-skeleton.html'
})
export class CaseDetailsSkeletonComponent { }
