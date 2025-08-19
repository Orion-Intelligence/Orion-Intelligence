import { Component } from '@angular/core';
import { TenantListComponent } from "./tenant-list/tenant-list.component";

@Component({
  selector: 'app-view-tenant',
  imports: [TenantListComponent],
  templateUrl: './view-tenant.component.html',
})
export class ViewTenantComponent {

}
