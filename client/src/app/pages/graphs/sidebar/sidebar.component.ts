import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';
import {AppService} from '../../../services/core/app.service';

@Component({
  selector: 'graph-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  imports: [FormsModule, ReactiveFormsModule, NgForOf, NgIf, TitleCasePipe],
})
export class SidebarComponent implements OnInit {
  @Output() filtersApplied = new EventEmitter<{
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
  }>();

  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';
  maxNodes = 25;
  maxDepth = 1;

  typeOptions = ['cluster', 'document', 'property'];
  clusterOptions = ['all', 'general', 'leak', 'defacement', 'chat', 'exploit'];
  allowedProperties = [
    { label: 'Email', key: 'm_email' },
    { label: 'Bitcoin Addresses', key: 'm_bitcoin_addresses' },
    { label: 'Telephone Number', key: 'm_phone_number' },
    { label: 'URL', key: 'm_url' },
    { label: 'Domain', key: 'm_domain' },
    { label: 'CVE', key: 'm_cve' },
    { label: 'IP Address', key: 'm_ip' },
    { label: 'YARA Rule', key: 'm_yara_rule' },
    { label: 'AWS Secret', key: 'm_aws_secret' },
    { label: 'File Path', key: 'm_file_path' },
    { label: 'Credit Card', key: 'm_credit_card' },
    { label: 'Organization', key: 'm_org' },
    { label: 'Geopolitical Entity', key: 'm_gpe' },
    { label: 'NORP', key: 'm_norp' },
    { label: 'Product', key: 'm_product' },
    { label: 'Person', key: 'm_person' },
    { label: 'Location', key: 'm_location' },
    { label: 'Law', key: 'm_law' },
    { label: 'IN Aadhaar', key: 'm_in_aadhaar' },
    { label: 'AU ABN', key: 'm_au_abn' },
    { label: 'AU TFN', key: 'm_au_tfn' },
    { label: 'IN Vehicle Registration', key: 'm_in_vehicle_registration' },
    { label: 'IN PAN', key: 'm_in_pan' },
    { label: 'IN Voter', key: 'm_in_voter' },
    { label: 'IN Passport', key: 'm_in_passport' },
    { label: 'US ITIN', key: 'm_us_itin' },
    { label: 'US SSN', key: 'm_us_ssn' },
    { label: 'US Passport', key: 'm_us_passport' },
    { label: 'US Driver License', key: 'm_us_driver_license' },
    { label: 'US Bank Number', key: 'm_us_bank_number' },
    { label: 'Username', key: 'm_username' },
    { label: 'Password', key: 'm_password' },
    { label: 'Hashtag', key: 'm_hashtag' },
    { label: 'Mention', key: 'm_mention' },
    { label: 'MITRE TTP Type', key: 'm_mitre_ttp_type' },
    { label: 'Document ID', key: 'm_document_id' },
    { label: 'Medical License', key: 'm_medical_license' },
    { label: 'Company Name', key: 'm_company_name' },
    { label: 'Employee Count', key: 'm_employee_count' },
    { label: 'Team', key: 'm_team' },
    { label: 'Country', key: 'm_country' },
    { label: 'States', key: 'm_states' },
    { label: 'Language', key: 'm_language' },
    { label: 'Encoded URLs', key: 'm_encoded_urls' },
    { label: 'Dumplink', key: 'm_dumplink' },
    { label: 'User Agents', key: 'm_user_agents' },
    { label: 'ASN', key: 'm_asns' },
    { label: 'Attacker', key: 'm_attacker' },
    { label: 'MITRE TTP Name', key: 'm_mitre_ttp_name' },
    { label: 'CWEs', key: 'm_cwe' }
  ];

  constructor(protected appService: AppService, private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedType = params['selectedType'] || 'cluster';
      this.singleInput = params['singleInput'] || 'all';
      this.propertyType = params['propertyType'] || 'all';
      this.propertyValue = params['propertyValue'] || '';
      this.maxNodes = (+params['maxEdge'] > 800 || +params['maxEdge'] < 0) ? '25' : (params['maxEdge'] || '25');
      this.maxDepth = (+params['maxDepth'] > 5 || +params['maxDepth'] < 0) ? '1' : (params['maxDepth'] || '1');

      this.filtersApplied.emit({
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: this.maxNodes,
        maxDepth: this.maxDepth
      });
    });
  }

  applyFilters() {
    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: this.maxNodes,
        maxDepth: this.maxDepth
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: this.maxNodes,
      maxDepth: this.maxDepth
    });
  }

  resetFilters() {
    this.selectedType = 'cluster';
    this.singleInput = 'all';
    this.propertyType = 'all';
    this.propertyValue = '';

    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType,
        singleInput: this.singleInput,
        propertyType: this.propertyType,
        propertyValue: this.propertyValue,
        maxEdge: this.maxNodes,
        maxDepth: this.maxDepth
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType,
      singleInput: this.singleInput,
      propertyType: this.propertyType,
      propertyValue: this.propertyValue,
      maxEdge: this.maxNodes,
      maxDepth: this.maxDepth
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
    if (!this.maxNodes || this.maxNodes < 20 || this.maxNodes > 800) {
      this.maxNodes = 25;
    }
  }

  validateMaxDepth() {
    if (!this.maxDepth || this.maxDepth < 1 || this.maxDepth > 5) {
      this.maxDepth = 2;
    }
  }
}
