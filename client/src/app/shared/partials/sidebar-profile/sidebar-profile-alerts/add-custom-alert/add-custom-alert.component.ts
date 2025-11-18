import { Component, EventEmitter, input, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertModel } from '../../../../model/company-profile/company.profile.model';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../../../services/core/app/app.service';
import { search_filter_labels } from '../../../../constants/shared-enums';
import { ApiService } from '../../../../services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { MessageNotificationService } from '../../../../../services/message_notification/message-notification.service';

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
  alertTypes = [
    { key: 'general', label: 'General' },
    { key: 'breach', label: 'Breach' },
    { key: 'exploit', label: 'Exploit' },
    { key: 'social', label: 'Social' },
    { key: 'defacement', label: 'Defacement' }
  ];

  iocTypes: Record<string, string> = {};
  @Input() heading: string = ''
  @Input() description: string = ''
  @Input() edit: boolean = false
  @Input() editAlertData!: AlertModel

  @Output() cancle = new EventEmitter<boolean>();

  constructor(public appService: AppService, public apiService: ApiService, public router: Router, public route: ActivatedRoute, private messageNotificationService: MessageNotificationService) { }
  ngOnInit(): void {
    this.iocTypes = { ...search_filter_labels };
    if (this.edit) {
      this.alert = this.editAlertData;
    }
    else {
      this.route.url.pipe(
        map(segments => {
          if (segments && segments.length > 0) {
            return segments[segments.length - 1].path;
          }
          return '';
        })
      ).subscribe(lastSegment => {
        this.alert.type = lastSegment;
      });
    }
  }
  setLastSeen(date: Date) {
    this.alert.last_seen = date;
  }
  saveAlert() {
    if (this.alert.type === '' || this.alert.ioc_type === '' || this.alert.ioc_value === '' || this.alert.data_hash === '')
      return;
    if (this.edit) {
      this.apiService.post('alert/update', this.alert).subscribe({
        next: () => {
          this.cancleAlert(true);
          this.messageNotificationService.show('Update alert successfully!')
        },
        error: (err) => {
          const mess = err?.error?.detail || 'update alert failed'
          this.messageNotificationService.show(mess)
        },
      });
    }
    else {
      this.apiService.post('alert/add', this.alert).subscribe({
        next: () => {
          this.cancleAlert(true);
          this.messageNotificationService.show('Add alert successfully!')
        },
        error: (err) => {
          const mess = err?.error?.detail || 'add alert failed'
          this.messageNotificationService.show(mess)
        },
      });
    }
  }
  cancleAlert(refresh: boolean) {
    this.cancle.emit(refresh);
  }
  getIOCTypeLabel(selectedKey: string): string {
    if (!selectedKey) return 'Select IOC Type';

    const entry = Object.entries(this.iocTypes).find(([key]) => key === selectedKey);
    return entry ? entry[1] : 'Select IOC Type';
  }

  onIOCTypeChange(newValue: string) {
    this.alert.ioc_type = newValue;
  }
  getAlertTypeLabel(selectedKey: string): string {
    if (!selectedKey) return 'Select Type';
    const type = this.alertTypes.find(t => t.key === selectedKey);
    return type ? type.label : 'Select Type';
  }

  onAlertTypeChange(value: string) {
    this.alert.type = value;
  }

}
