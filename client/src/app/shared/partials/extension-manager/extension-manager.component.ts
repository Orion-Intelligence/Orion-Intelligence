import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SocialExtensionService } from '../../services/social-extension.service';
import { ExtensionState } from '../../model/extension/extension.model';

@Component({
  selector: 'app-social-extension-manager',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extension-manager.component.html',
})
export class SocialExtensionManagerComponent {
  private readonly extensionService = inject(SocialExtensionService);

  readonly mode = input<ExtensionState>('install');
  readonly installSteps = ['Choose Firefox or Chromium and approve the browser installation prompt.', 'Orion keeps the installed extension updated automatically.', 'This profile loads automatically once the extension is installed.'];

  open(): void {
    this.extensionService.openExtension();
  }

  latestVersion(): string {
    return this.extensionService.latestVersion();
  }

  downloadUrl(browser: 'chrome' | 'firefox'): string {
    return this.extensionService.downloadUrl(browser);
  }

  browserUrl(browser: 'chromium' | 'firefox'): string {
    return browser === 'firefox' ? 'https://www.mozilla.org/firefox/new/' : 'https://www.chromium.org/getting-involved/download-chromium/';
  }
}
