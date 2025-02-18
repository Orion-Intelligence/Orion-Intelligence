import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import {AsyncPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  templateUrl: './loader.component.html',
  imports: [
    AsyncPipe
  ],
  styleUrl: './loader.component.css'
})
export class LoaderComponent {
  isLoading$: Observable<boolean>;

  constructor(private loadingService: LoadingService) {
    this.isLoading$ = this.loadingService.loading$;
  }
}
