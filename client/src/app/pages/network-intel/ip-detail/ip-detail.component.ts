import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IpDetail } from '../../../shared/model/network-intel/network-intel.model';
import { ScanHelperMethodsService } from '../network-intel-service.service';

@Component({
  selector: 'app-ip-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ip-detail.component.html',
})
export class IpDetailComponent {
  @Input({ required: true }) detail!: IpDetail;

  constructor(public ui: ScanHelperMethodsService) {}
}
