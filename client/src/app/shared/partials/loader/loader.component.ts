import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { LoadingService } from '../../services/loading.service';
import { AsyncPipe } from '@angular/common';
@Component({
    selector: 'app-loader',
    standalone: true,
    templateUrl: './loader.component.html',
    imports: [
        AsyncPipe
    ],
})
export class LoaderComponent {
    isLoading$: Observable<boolean>;
    constructor(private loadingService: LoadingService) {
        this.isLoading$ = this.loadingService.loading$;
    }
}
