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
  readonly installSteps = ['Add the Orion extension to Firefox or Chrome from the browser add-on store.', 'Your browser keeps the extension updated automatically.', 'This profile loads automatically once the extension is installed and signed in.'];

  open(): void {
    this.extensionService.openExtension();
  }

  latestVersion(): string {
    return this.extensionService.latestVersion();
  }

  storeUrl(browser: 'chrome' | 'firefox'): string {
    return this.extensionService.storeUrl(browser);
  }

  browserUrl(browser: 'chromium' | 'firefox'): string {
    return browser === 'firefox' ? 'https://www.mozilla.org/firefox/new/' : 'https://www.chromium.org/getting-involved/download-chromium/';
  }
}
