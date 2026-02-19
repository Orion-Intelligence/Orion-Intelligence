import { Component } from '@angular/core';
import { Router } from '@angular/router';
@Component({
    selector: 'app-empty-ioc',
    imports: [],
    templateUrl: './empty-ioc.component.html'
})
export class EmptyIocComponent {
    constructor(public router: Router) { }
    goToIoc() {
        this.router.navigate(['/dashboard/profile/ioc']);
    }
}
