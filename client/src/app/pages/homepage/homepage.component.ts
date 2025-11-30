import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { HomeSearchComponent } from './home-search/home-search.component';
import {AuthService} from '../../services/authetication/auth.service';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [HomeSearchComponent,],
  templateUrl: './homepage.component.html',
})
export class HomepageComponent implements OnInit, AfterViewInit {
  constructor(private router: Router, private authService:AuthService) {
  }

  ngOnInit() {

    const role = this.authService.getRole();
    if (role == "profile")
      this.router.navigate(['dashboard/profile/homepage']).then();


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
