import { Component, HostListener, OnInit, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertAllIoc, AlertModel } from '../../../../../../shared/model/company-profile/node.model';
import { FormsModule } from '@angular/forms';
import { AppService } from '../../../../../../services/core/app/app.service';
import { ApiService } from '../../../../../../shared/services/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { MessageNotificationService } from '../../../../../../services/message_notification/message-notification.service';
import { overlayAnimation, popupAnimation } from '../../../../../../shared/animations/popup.animations';
@Component({
  selector: 'app-add-custom-alert',
  imports: [CommonModule, FormsModule],
  templateUrl: './add-custom-alert.component.html',
  animations: [overlayAnimation, popupAnimation],
})
export class AddCustomAlertComponent implements OnInit {
  protected readonly decodeURIComponent = decodeURIComponent;

  iocDropdownOpen = false;
  alert: AlertModel = { type: '', status: 'active', title: '', description: '', url: '', source: '', all_ioc: [], content_types: [], first_seen: new Date(), last_seen: new Date(), ioc_type: '', ioc_value: '' };
  formError: string = '';
  alertTypes = [ { key: 'general', label: 'General' }, { key: 'breach', label: 'Breach' }, { key: 'exploit', label: 'Exploit' }, { key: 'social', label: 'Social' }, { key: 'defacement', label: 'Defacement' } ];
  allowedIocTypes = [ { title: 'Phone Numbers', key: 'm_phone_number' }, { title: 'Emails', key: 'm_email' }, { title: 'Domains', key: 'm_domain' }, { title: 'Country', key: 'm_country' }, { title: 'URLs', key: 'm_url' }, { title: 'CVE & CWE', key: 'm_cve' }, { title: 'IP Addresses', key: 'm_ip' }, { title: 'YARA Rules', key: 'm_yara_rule' }, { title: 'Encoded URLs', key: 'm_encoded_urls' }, { title: 'File Paths', key: 'm_file_paths' }, { title: 'Credit Cards', key: 'm_credit_card' }, { title: 'Organizations', key: 'm_org' }, { title: 'Company Names', key: 'm_company_name' }, { title: 'Persons', key: 'm_person' }, { title: 'Locations', key: 'm_location' }, { title: 'Languages', key: 'm_language' }, { title: 'User Agents', key: 'm_user_agents' }, { title: 'ASNs', key: 'm_asns' }, { title: 'Teams', key: 'm_team' }, { title: 'Hashtags', key: 'm_hashtag' }, { title: 'Mentions', key: 'm_mention' }, { title: 'Social Media Profiles', key: 'm_social_media_profiles' }, { title: 'Currencies', key: 'm_currencies' }, { title: 'Crypto Addresses', key: 'm_crypto_address' }, { title: 'XMPP Addresses', key: 'm_xmpp_addresses' }, { title: 'Enterprise ATT&CK Tactics', key: 'm_enterprise_attack_tactics' }, { title: 'Enterprise ATT&CK Techniques', key: 'm_enterprise_attack_techniques' }, { title: 'Document IDs', key: 'm_document_id' }, { title: 'Australian IDs', key: 'm_au_abn' }, { title: 'US IDs', key: 'm_us_passport' }, { title: 'US Bank Numbers', key: 'm_us_bank_number' }, { title: 'Platform', key: 'm_platform' }, { title: 'Author', key: 'm_author' }, { title: 'Industry', key: 'm_industry' }, { title: 'Scrap Script', key: 'm_scrap_file' } ];
  readonly heading = input<string>('');
  readonly description = input<string>('');
  readonly edit = input<boolean>(false);
  readonly editAlertData = input<AlertModel | null>(null);
  readonly cancle = output<boolean>();

  constructor(public appService: AppService, public apiService: ApiService, public router: Router, public route: ActivatedRoute, private messageNotificationService: MessageNotificationService) { }

  ngOnInit(): void {
    if (this.edit()) {
      const editAlertData = this.editAlertData();
      if (!editAlertData) {
        return;
      }
      this.alert = {
        ...editAlertData,
        all_ioc: editAlertData.all_ioc ?? [],
        ioc_type: editAlertData.ioc_type ??
                      editAlertData.all_ioc?.[0]?.name ??
                      '',
        ioc_value: editAlertData.ioc_value ?? ''
      };
      const existingBucket = this.alert.all_ioc?.[0];
      if (!this.alert.ioc_value && existingBucket?.values?.length) {
        this.alert.ioc_value = existingBucket.values[0];
      }
    }
    else {
      this.route.url
        .pipe(map(segments => segments && segments.length > 0 ? segments[segments.length - 1].path : ''))
        .subscribe(lastSegment => {
          this.alert.type = lastSegment;
        });
    }
    if (!this.alert.all_ioc) {
      this.alert.all_ioc = [];
    }
    this.syncAllIoc();
  }

  onIOCTypeChange(newValue: string) {
    this.alert.ioc_type = newValue;
    this.formError = '';
    this.syncAllIoc();
    this.iocDropdownOpen = false;
  }

  onIocValueChange(newValue: string) {
    this.alert.ioc_value = newValue;
    this.formError = '';
    this.syncAllIoc();
  }

  private syncAllIoc() {
    const name = this.alert.ioc_type || '';
    const value = (this.alert.ioc_value || '').trim();
    if (!name || !value) {
      this.alert.all_ioc = [];
      return;
    }
    const bucket: AlertAllIoc = { name, values: [value] };
    this.alert.all_ioc = [bucket];
  }

  private isValidUrl(u: string): boolean {
    try {
      const url = new URL(u);
      return url.protocol === 'http:' || url.protocol === 'https:';
    }
    catch {
      return false;
    }
  }

  private validateForm(): string {
    const title = (this.alert.title || '').trim();
    const desc = (this.alert.description || '').trim();
    const source = (this.alert.source || '').trim();
    const url = (this.alert.url || '').trim();
    if (!this.alert.type) {
      return 'Please select an alert type.';
    }
    if (!title) {
      return 'Please enter a title for the alert.';
    }
    if (title.length < 3) {
      return 'The title must be at least 3 characters long.';
    }
    if (!desc) {
      return 'Please provide a description for the alert.';
    }
    if (desc.length < 5) {
      return 'The description must be at least 5 characters long.';
    }
    if (!source) {
      return 'Please specify the source of this alert.';
    }
    if (source.length < 2) {
      return 'The source must be at least 2 characters long.';
    }
    if (!url) {
      return 'Please enter a reference URL.';
    }
    if (!this.isValidUrl(url)) {
      return 'Please enter a valid URL starting with http:// or https://.';
    }
    return '';
  }

  saveAlert() {
    this.formError = this.validateForm();
    if (this.formError) {
      return;
    }
    const endpoint = this.edit() ? 'alert/update' : 'alert/add';
    this.apiService.post(endpoint, this.alert).subscribe({
      next: () => {
        this.cancleAlert(true);
      },
      error: err => {
        this.messageNotificationService.show(err?.error?.detail || 'alert operation failed');
      }
    });
  }

  toggleIocDropdown(event: Event) {
    event.stopPropagation();
    this.iocDropdownOpen = !this.iocDropdownOpen;
  }

  @HostListener('document:click')
  onDocumentClick() {
    this.iocDropdownOpen = false;
  }

  cancleAlert(refresh: boolean) {
    this.cancle.emit(refresh);
  }

  getAlertTypeLabel(selectedKey: string): string {
    if (!selectedKey) {
      return 'Select Type';
    }
    const type = this.alertTypes.find(t => t.key === selectedKey);
    return type ? type.label : 'Select Type';
  }

  getIOCTypeLabel(selectedKey: string): string {
    if (!selectedKey) {
      return 'Select IOC Type';
    }
    const item = this.allowedIocTypes.find(x => x.key === selectedKey);
    return item ? item.title : 'Select IOC Type';
  }
}
