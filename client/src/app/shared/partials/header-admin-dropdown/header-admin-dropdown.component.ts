import {Component} from '@angular/core';
import {AsyncPipe, NgIf, NgOptimizedImage} from "@angular/common";
import {AuthService} from '../../../services/authetication/auth.service';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-header-admin-dropdown',
  imports: [
    AsyncPipe,
    NgIf,
    NgOptimizedImage
  ],
  templateUrl: './header-admin-dropdown.component.html',
  styleUrl: './header-admin-dropdown.component.css'
})
export class HeaderAdminDropdownComponent {
  username$: Observable<string | null>;
  dropdownOpen = false;

  constructor(protected authService: AuthService) {
    this.username$ = this.authService.getUsername$();
  }

  logout() {
    this.authService.logout();
    this.dropdownOpen = false;
  }
}
