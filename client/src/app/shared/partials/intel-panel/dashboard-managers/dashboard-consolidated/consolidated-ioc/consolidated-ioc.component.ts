import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { RankedCallbackModel } from '../../../../../model/results/consolidated/ranked.callback.model';
import { CredentialComponent } from "../../../../../../pages/credentials/credential.component";
@Component({
    selector: 'app-consolidated-ioc',
    imports: [CredentialComponent],
    templateUrl: './consolidated-ioc.component.html'
})
export class ConsolidatedIocComponent implements OnInit {
    ngOnInit(): void {
    }
}
