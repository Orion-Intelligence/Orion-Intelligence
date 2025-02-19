import { Component } from '@angular/core';
import {AsyncPipe, NgOptimizedImage} from '@angular/common';
import {AuthService} from '../../../services/authetication/auth.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [
    NgOptimizedImage,
    AsyncPipe
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  username$: Observable<string | null>;

  constructor(private authService: AuthService) {
    this.username$ = this.authService.getUsername$();
  }
}
