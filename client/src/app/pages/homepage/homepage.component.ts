import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HomeSearchComponent } from './home-search/home-search.component';
import { HomeInsightComponent } from "./home-insight/home-insight.component";
import { AuthService } from '../../services/authetication/auth.service';
import { LicenseService } from '../../services/licenses/licenses.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [NgIf, HomeSearchComponent, HomeInsightComponent],
  templateUrl: './homepage.component.html',
})
export class HomepageComponent implements OnInit, AfterViewInit {
  constructor(private router: Router, protected authService: AuthService, protected licenseService: LicenseService) {
  }

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => this.router.url.includes('#') && this.scrollToElement());
  }

  ngAfterViewInit() {
    this.router.url.includes('#') && this.scrollToElement();
  }

  scrollToElement() {
    document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
