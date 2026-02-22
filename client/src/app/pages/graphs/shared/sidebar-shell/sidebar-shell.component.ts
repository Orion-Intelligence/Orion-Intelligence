import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-graph-sidebar-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar-shell.component.html',
  host: {
    class: 'block h-[calc(100vh-3rem)] w-full min-h-0',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarShellComponent {
  isCollapsed = input.required<boolean>();
  logoSrc = input('/api/s/static/system/logo_wide_dark_default.png');
  logoAlt = input('Orion Intelligence');
  homeHref = input('/');
  toggleClicked = output<void>();
}
