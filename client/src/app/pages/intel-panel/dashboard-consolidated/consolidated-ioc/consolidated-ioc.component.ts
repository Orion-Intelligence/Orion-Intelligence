import { Component, OnInit } from '@angular/core';
import { CredentialComponent } from "../../../credentials/credential.component";
@Component({
  selector: 'app-consolidated-ioc',
  imports: [CredentialComponent],
  templateUrl: './consolidated-ioc.component.html'
})
export class ConsolidatedIocComponent implements OnInit {
  ngOnInit(): void {
  }
}
