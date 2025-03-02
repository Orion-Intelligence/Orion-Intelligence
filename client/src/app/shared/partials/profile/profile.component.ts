import { Component, HostListener } from '@angular/core';
import {AsyncPipe, NgIf, NgOptimizedImage} from "@angular/common";
import { AuthService } from '../../../services/authetication/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    NgOptimizedImage,
    NgIf
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent {
  username$: Observable<string | null>;
  dropdownOpen = false;

  constructor(protected authService: AuthService) {
    this.username$ = this.authService.getUsername$();
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
  }

  logout() {
    this.authService.logout();
    this.dropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.header_form-user--logout')) {
      this.dropdownOpen = false;
    }
  }
}
