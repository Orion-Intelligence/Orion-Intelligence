import {Component, EventEmitter, Output, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {AppService} from '../../../services/core/app.service';

@Component({
  selector: 'graph-sidebar', standalone: true, templateUrl: './sidebar.component.html', imports: [FormsModule, ReactiveFormsModule, NgForOf, NgIf, TitleCasePipe],
})
export class SidebarComponent implements OnInit {
  @Output() filtersApplied = new EventEmitter<{
    selectedType: string; singleInput: string; propertyType: string; propertyValue: string; maxEdge: number; maxDepth: number;
  }>();

  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  maxNodes: number = 50;
  maxDepth: number = 1;

  typeOptions = ['cluster', 'document', 'property'];
  clusterOptions = ['all', 'general', 'leak', 'defacement', 'chat'];
  allowedProperties = [
    { label: 'Emails', key: 'm_emails' },
    { label: 'Hashes', key: 'm_hashes' },
    { label: 'IOCs', key: 'm_iocs' },
    { label: 'IPs', key: 'm_ips' },
    { label: 'IPv4s', key: 'm_ipv4s' },
    { label: 'IPv6s', key: 'm_ipv6s' },
    { label: 'MD5 Hashes', key: 'm_md5_hashes' },
    { label: 'SHA1 Hashes', key: 'm_sha1_hashes' },
    { label: 'SHA256 Hashes', key: 'm_sha256_hashes' },
    { label: 'SHA512 Hashes', key: 'm_sha512_hashes' },
    { label: 'Telephone Numbers', key: 'm_telephone_nums' },
    { label: 'Unencoded URLs', key: 'm_unencoded_urls' },
    { label: 'URLs', key: 'm_urls' },
    { label: 'Complete Email Addresses', key: 'm_email_addresses_complete' },
    { label: 'Email Addresses', key: 'm_email_addresses' },
    { label: 'Domains', key: 'm_domains' },
    { label: 'SHA512', key: 'm_sha512s' },
    { label: 'SHA256', key: 'm_sha256s' },
    { label: 'SHA1', key: 'm_sha1s' },
    { label: 'MD5', key: 'm_md5s' },
    { label: 'SSDEEP', key: 'm_ssdeeps' },
    { label: 'CVEs', key: 'm_cves' },
    { label: 'Bitcoin Addresses', key: 'm_bitcoin_addresses' },
    { label: 'MAC Addresses', key: 'm_mac_addresses' },
    { label: 'API Key', key: 'm_api_key' },
    { label: 'AWS Secret', key: 'm_aws_secret' },
    { label: 'Azure Resource ID', key: 'm_azure_resource_id' },
    { label: 'Registry Key', key: 'm_registry_key' },
    { label: 'File Path', key: 'm_file_path' },
    { label: 'YARA Rule', key: 'm_yara_rule' },
    { label: 'Phone Number', key: 'm_phone_number' },
    { label: 'Country', key: 'm_country' },
    { label: 'Organization', key: 'm_org' },
    { label: 'Geopolitical Entity', key: 'm_gpe' },
    { label: 'NORP', key: 'm_norp' },
    { label: 'Product', key: 'm_product' },
    { label: 'Person', key: 'm_person' },
    { label: 'Location', key: 'm_loc' },
    { label: 'Law', key: 'm_law' },
    { label: 'Credit Card', key: 'm_credit_card' },
    { label: 'IBAN Code', key: 'm_iban_code' },
    { label: 'IN Aadhaar', key: 'm_in_aadhaar' },
    { label: 'AU ABN', key: 'm_au_abn' },
    { label: 'AU TFN', key: 'm_au_tfn' },
    { label: 'IN Vehicle Registration', key: 'm_in_vehicle_registration' },
    { label: 'IP Address', key: 'm_ip_address' },
    { label: 'IN PAN', key: 'm_in_pan' },
    { label: 'Location', key: 'm_location' },
    { label: 'NRP', key: 'm_nrp' },
    { label: 'SG NRIC/FIN', key: 'm_sg_nric_fin' },
    { label: 'US ITIN', key: 'm_us_itin' },
    { label: 'IN Voter', key: 'm_in_voter' },
    { label: 'US Driver License', key: 'm_us_driver_license' },
    { label: 'URL', key: 'm_url' },
    { label: 'US SSN', key: 'm_us_ssn' },
    { label: 'US Passport', key: 'm_us_passport' },
    { label: 'IN Passport', key: 'm_in_passport' },
    { label: 'US Bank Number', key: 'm_us_bank_number' },
    { label: 'Username', key: 'm_username' },
    { label: 'Password', key: 'm_password' },
    { label: 'Hashtag', key: 'm_hashtag' },
    { label: 'Mention', key: 'm_mention' },
    { label: 'MITRE TTP Type', key: 'm_mitre_ttp_type' }
  ];

  constructor(protected appService: AppService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedType = params['selectedType'] || 'cluster';
      this.singleInput = params['singleInput'] || 'all';
      this.propertyType = params['propertyType'] || 'all';
      this.propertyValue = params['propertyValue'] || '';

      this.filtersApplied.emit({
        selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue, maxEdge: this.maxNodes, maxDepth:this.maxDepth
      });
    });
  }

  applyFilters() {
    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue, maxEdge: this.maxNodes, maxDepth:this.maxDepth
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue, maxEdge: this.maxNodes, maxDepth:this.maxDepth
    });
  }

  resetFilters() {
    this.selectedType = 'cluster';
    this.singleInput = 'all';
    this.propertyType = 'all';
    this.propertyValue = '';

    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue, maxEdge: this.maxNodes, maxDepth:this.maxDepth
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue, maxEdge: this.maxNodes, maxDepth:this.maxDepth
    });
  }

  onFormatPropertyType(type: string) {
    return type.toLowerCase().replace("m_", "").replace("_", " ")
  }

  onTypeChange(type: string) {
    this.selectedType = type;
    if (type === 'cluster') {
      this.singleInput = 'all';
    } else if (type === 'document') {
      this.singleInput = '';
    } else if (type === 'property') {
      this.propertyType = 'all';
      this.propertyValue = '';
    }
  }
  validateMaxNodes() {
    if (!this.maxNodes || this.maxNodes < 20 || this.maxNodes > 500) {
      this.maxNodes = 50;
    }
  }

  validateMaxDepth() {
    if (!this.maxDepth || this.maxDepth < 1 || this.maxDepth > 5) {
      this.maxDepth = 2;
    }
  }
}
