import {Component, HostListener, OnInit, signal} from '@angular/core';
import {AsyncPipe, NgIf, NgOptimizedImage} from "@angular/common";
import {AuthService} from '../../../services/authetication/auth.service';
import {Observable} from 'rxjs';
import {TooltipDirective} from '../../directive/tooltip-directive.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    AsyncPipe,
    NgOptimizedImage,
    NgIf,
    TooltipDirective
  ],
  templateUrl: './profile.component.html'
})
export class ProfileComponent implements OnInit{
  username$: Observable<string | null>;
  role$: Observable<string | null>;

  dropdownOpen = signal(false);
  isDarkTheme = true;

  constructor(protected authService: AuthService) {
    this.username$ = this.authService.getUsername$();
    this.role$ = this.authService.getRole$();
  }

  ngOnInit(): void {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark-theme') {
      this.isDarkTheme = true;
    } else if (storedTheme === 'light-theme') {
      this.isDarkTheme = false;
    }
    this.applyTheme();
  }

  toggleThemeByClick() {
    this.isDarkTheme = !this.isDarkTheme;
    const theme = this.isDarkTheme ? 'dark-theme' : 'light-theme';
    localStorage.setItem('theme', theme);
    this.applyTheme();
  }

  applyTheme() {
    const body = document.body;
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(this.isDarkTheme ? 'dark-theme' : 'light-theme');
    this.dropdownOpen.set(false);
  }

  isAdmin(): boolean {
    const currentRole = this.authService.getRole();
    return currentRole === 'admin';
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.dropdownOpen.set(true);
  }

  logout() {
    this.authService.logout();
    this.dropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  closeDropdown(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile')) {
      this.dropdownOpen.set(false);
    }
  }
}
