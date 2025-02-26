import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import { HeaderProfileDropdownComponent } from '../header-profile-dropdown/header-profile-dropdown.component';

@Component({
  selector: 'app-header',
  imports: [
    HeaderProfileDropdownComponent,
    NgOptimizedImage
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {

}
