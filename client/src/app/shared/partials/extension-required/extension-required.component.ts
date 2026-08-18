import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-extension-required',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './extension-required.component.html',
})
export class ExtensionRequiredComponent {
  readonly mode = input<string>('install');
  readonly installSteps = ['Download the signed package for your browser.', 'Open the downloaded package and approve the installation prompt.', 'This section loads automatically once the extension is installed.'];

  open(): void {
    window.postMessage({ source: 'orion-app', type: 'open' }, '*');
  }

  downloadUrl(browser: 'chrome' | 'firefox'): string {
    return `/api/social/extensions/download/${browser}`;
  }
}
