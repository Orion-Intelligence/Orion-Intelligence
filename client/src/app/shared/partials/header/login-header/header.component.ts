import { Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ProfileComponent } from '../../profile/profile.component';
@Component({
    selector: 'app-header',
    imports: [
        ProfileComponent,
        NgOptimizedImage
    ],
    templateUrl: './header.component.html',
})
export class HeaderComponent {
}
