import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DirectoryItem {
  id: number;
  url: string;
  content_type: string[];
  url_status_date: number;
  leak_status_date: number;
  network_type: string;
}

@Component({
  selector: 'app-directory-list',
  templateUrl: './directory-list.component.html',
  imports: [CommonModule],
  styleUrls: ['./directory-list.component.css']
})
export class DirectoryListComponent {
  @Input() directoryItems: DirectoryItem[] = [];
  @Input() page: number = 1;
  @Input() itemsPerPage: number = 10;

  get startId(): number {
    return (this.page - 1) * this.itemsPerPage + 1;
  }
}
