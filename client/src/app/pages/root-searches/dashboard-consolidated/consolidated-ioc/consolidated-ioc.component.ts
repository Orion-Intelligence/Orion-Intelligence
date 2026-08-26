import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CredentialComponent } from "../../credentials/credential.component";
@Component({
  selector: 'app-consolidated-ioc',
  imports: [CredentialComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './consolidated-ioc.component.html'
})
export class ConsolidatedIocComponent {
  readonly templateOnly = true;
}
