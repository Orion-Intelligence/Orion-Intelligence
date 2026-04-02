import { Component, ChangeDetectionStrategy, input, output, inject } from '@angular/core';
import { AppService } from '../../../../services/core/app/app.service';

@Component({
  selector: 'app-graph-sidebar-shell',
  standalone: true,
  imports: [],
  templateUrl: './sidebar-shell.component.html',
  host: {
    class: 'block h-[calc(100vh-3rem)] w-full min-h-0',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarShellComponent {
  protected appService = inject(AppService);

  isCollapsed = input.required<boolean>();
  logoAlt = input('Orion Intelligence');
  homeHref = input('/');
  toggleClicked = output<undefined>();

  get logoSrc(): string {
    const settings = this.appService.getConfig().appSettings;
    const isLightTheme = this.appService.userSessionData()?.user?.theme === 'light-theme';
    if (isLightTheme) {
      return settings.logo_wide_light || settings.logo_wide_dark || '/api/s/static/system/logo_wide_light_default.png';
    }
    return settings.logo_wide_dark || settings.logo_wide_light || '/api/s/static/system/logo_wide_dark_default.png';
  }
}
