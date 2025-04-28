import {Component, EventEmitter, Output, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NgForOf, NgIf, TitleCasePipe} from '@angular/common';

@Component({
  selector: 'graph-sidebar', standalone: true, templateUrl: './sidebar.component.html', styleUrl: './sidebar.component.css', imports: [FormsModule, ReactiveFormsModule, NgForOf, NgIf, TitleCasePipe],
})
export class SidebarComponent implements OnInit {
  @Output() filtersApplied = new EventEmitter<{
    selectedType: string; singleInput: string; propertyType: string; propertyValue: string;
  }>();

  selectedType = 'cluster';
  singleInput = 'all';
  propertyType = 'all';
  propertyValue = '';

  typeOptions = ['cluster', 'document', 'property'];
  clusterOptions = ['all', 'general', 'leak', 'defacement'];
  allowedProperties = [
    { label: 'All', key: 'all' },
    { label: 'Email Addresses', key: 'm_email_addresses' },
    { label: 'Phone Numbers', key: 'm_phone_numbers' },
    { label: 'States', key: 'm_states' },
    { label: 'Location Info', key: 'm_location_info' },
    { label: 'Social Media Profiles', key: 'm_social_media_profiles' },
    { label: 'Name', key: 'm_name' },
    { label: 'Industry', key: 'm_industry' },
    { label: 'Company Name', key: 'm_company_name' },
    { label: 'Country Name', key: 'm_country_name' },
    { label: 'IP', key: 'm_ip' },
    { label: 'Team', key: 'm_team' },
    { label: 'Attacker', key: 'm_attacker' },
    { label: 'AU ABN', key: 'm_au_abn' },
    { label: 'AU ACN', key: 'm_au_acn' },
    { label: 'AU Medicare', key: 'm_au_medicare' },
    { label: 'AU TFN', key: 'm_au_tfn' },
    { label: 'Credit Cards', key: 'm_credit_cards' },
    { label: 'Crypto Addresses', key: 'm_crypto_addresses' },
    { label: 'Crypto BTC Addresses', key: 'm_crypto_btc_addresses' },
    { label: 'IBAN Codes', key: 'm_iban_codes' },
    { label: 'IN Aadhaar Numbers', key: 'm_in_aadhaar_numbers' },
    { label: 'IN PAN Numbers', key: 'm_in_pan_numbers' },
    { label: 'IN Passport Numbers', key: 'm_in_passport_numbers' },
    { label: 'IN Vehicle Registrations', key: 'm_in_vehicle_registrations' },
    { label: 'IN Voter IDs', key: 'm_in_voter_ids' },
    { label: 'Medical Licenses', key: 'm_medical_licenses' },
    { label: 'NRP Numbers', key: 'm_nrp_numbers' },
    { label: 'Persons', key: 'm_persons' },
    { label: 'SG NRIC/FIN Numbers', key: 'm_sg_nric_fin_numbers' },
    { label: 'UK NHS Numbers', key: 'm_uk_nhs_numbers' },
    { label: 'UK NINO Numbers', key: 'm_uk_nino_numbers' },
    { label: 'URLs', key: 'm_urls' },
    { label: 'US Bank Numbers', key: 'm_us_bank_numbers' },
    { label: 'US Driver Licenses', key: 'm_us_driver_licenses' },
    { label: 'US ITIN Numbers', key: 'm_us_itin_numbers' },
    { label: 'US Passport Numbers', key: 'm_us_passport_numbers' },
    { label: 'US SSN Numbers', key: 'm_us_ssn_numbers' },
    { label: 'Title', key: 'm_title' },
    { label: 'URL', key: 'm_url' },
    { label: 'Weblink', key: 'm_weblink' },
    { label: 'Dumplink', key: 'm_dumplink' },
    { label: 'Websites', key: 'm_websites' }
  ];

  constructor(private router: Router, private route: ActivatedRoute) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.selectedType = params['selectedType'] || 'cluster';
      this.singleInput = params['singleInput'] || 'all';
      this.propertyType = params['propertyType'] || 'all';
      this.propertyValue = params['propertyValue'] || '';

      this.filtersApplied.emit({
        selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue
      });
    });
  }

  applyFilters() {
    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue
    });
  }

  resetFilters() {
    this.selectedType = 'cluster';
    this.singleInput = 'all';
    this.propertyType = 'all';
    this.propertyValue = '';

    this.router.navigate([], {
      queryParams: {
        selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue
      }
    }).then();

    this.filtersApplied.emit({
      selectedType: this.selectedType, singleInput: this.singleInput, propertyType: this.propertyType, propertyValue: this.propertyValue
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

}
