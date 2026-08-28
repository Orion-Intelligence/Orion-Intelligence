import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MessagePopupComponent } from '../message-popup/message-popup.component';
import { SocialExtensionService } from '../../services/social-extension.service';
import { ExtensionState } from '../../model/extension/extension.model';

@Component({
  selector: 'app-social-extension-manager',
  standalone: true,
  imports: [TranslatePipe, MessagePopupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extension-manager.component.html',
})
export class SocialExtensionManagerComponent {
  private readonly extensionService = inject(SocialExtensionService);

  readonly mode = input<ExtensionState>('install');
  readonly chromeNotice = signal(false);
  readonly firefoxSteps = ['Click Install for Firefox.', 'Approve the browser prompt to add it.', 'Open the popup and sign in to Orion.'];
  readonly chromeSteps = ['Click Download for Chromium and unzip it.', 'Open chrome://extensions, allow Developer mode.', 'Choose Load unpacked, pick the folder, sign in.'];

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
