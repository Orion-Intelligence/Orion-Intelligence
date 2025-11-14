import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModel } from '../../../../model/company-profile/company.profile.model';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../../../services/core/app/app.service';
import { search_filter_labels } from '../../../../constants/shared-enums';
import { ApiService } from '../../../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-custom-alert',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-custom-alert.component.html'
})
export class AddCustomAlertComponent implements OnInit {
  alert: AlertModel = {
    type: '',
    ioc_type: '',
    ioc_value: '',
    data_hash: '',
    first_seen: new Date(),
    last_seen: new Date(),
    status: 'active',
    title: '',
    description: '',
    url: '',
    source: '',
    all_ioc: [],
    content_types: [],
  };
  iocTypes: Record<string, string> = {};
  constructor(public appService: AppService, public apiService: ApiService, public router: Router) { }
  ngOnInit(): void {
    this.iocTypes = { ...search_filter_labels };
  }
  setLastSeen(date: Date) {
    this.alert.last_seen = date;
  }
  saveAlert() {
    if (this.alert.type === '' || this.alert.ioc_type === '' || this.alert.ioc_value === '' || this.alert.data_hash === '')
      return;
    this.apiService.post('add/alert', this.alert).subscribe({
      next: () => {
        this.router.navigate([`/dashboard/profile/alerts/${this.alert.type?.toLowerCase()}`]);
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.detail || 'add alert failed');
      },
    });
  }
}
