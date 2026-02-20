import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-graph-sidebar-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-shell.component.html',
  styleUrl: './sidebar-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarShellComponent {
  isCollapsed = input.required<boolean>();
  logoSrc = input('/api/s/static/system/logo_wide_dark_default.png');
  logoAlt = input('Orion Intelligence');
  homeHref = input('/');
  toggleClicked = output<void>();
}
