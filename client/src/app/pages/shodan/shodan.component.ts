import {Component, Input, OnInit} from '@angular/core';
import { Category } from '../../shared/constants/pages';

@Component({
  selector: 'app-empty-result',
  templateUrl: './shodan.component.html',
  standalone: true,
  imports: [],
})
export class ShodanComponent implements OnInit {
  @Input() searchQuery!: string;
  query = '';
  protected readonly category = Category;

  ngOnInit(): void {
    this.query = this.searchQuery;
  }
}
