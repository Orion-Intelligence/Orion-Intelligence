import { Component } from '@angular/core';
import {AsyncPipe, NgIf, NgOptimizedImage} from '@angular/common';
import { AuthService } from '../../../services/authetication/auth.service';
import { HeaderProfileDropdownComponent } from '../header-profile-dropdown/header-profile-dropdown.component';
import { Observable } from 'rxjs';

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
