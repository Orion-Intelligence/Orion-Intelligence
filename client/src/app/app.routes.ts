import { Routes } from '@angular/router';
import {LoginComponent} from './pages/login/login.component';
import {HomepageComponent} from './pages/homapage/homepage.component';
import {ErrorHandlerComponent} from './pages/error-handler/error-handler.component';
import {AuthGuard} from './shared/guards/auth-guard.guard';
import {DashboardComponent} from './pages/dashboard/dashboard.component';
import {DirectoryComponent} from './pages/directory/directory.component';
import {InsightResolver} from './shared/resolvers/insight.resolver';
import {DirectoryResolver} from './shared/resolvers/directory.resolver';

export const routes: Routes = [
  { path: '', component: HomepageComponent , canActivate: [AuthGuard], resolve: { insights: InsightResolver } },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent , canActivate: [AuthGuard]},
  { path: 'directory', component: DirectoryComponent , canActivate: [AuthGuard], resolve: { directory: DirectoryResolver }},
  { path: '**', component: ErrorHandlerComponent }
];
