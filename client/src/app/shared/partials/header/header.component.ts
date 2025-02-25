import { Component } from '@angular/core';
import {AsyncPipe, NgIf, NgOptimizedImage} from '@angular/common';
import { AuthService } from '../../../services/authetication/auth.service';
import { HeaderAdminDropdownComponent } from '../header-admin-dropdown/header-admin-dropdown.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [
    HeaderAdminDropdownComponent,
    NgOptimizedImage,
    AsyncPipe,
    NgIf
  ],
  templateUrl: './header.component.html',
})
export class HeaderComponent {

}
