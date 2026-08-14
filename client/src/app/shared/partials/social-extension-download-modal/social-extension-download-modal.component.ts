import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input, OnDestroy, output, signal } from '@angular/core';

type ExtensionBrowser = 'chrome' | 'firefox';

@Component({
  selector: 'app-social-extension-download-modal',
  standalone: true,
  templateUrl: './social-extension-download-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialExtensionDownloadModalComponent implements AfterViewInit, OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  readonly visible = input(false);
  readonly closed = output<undefined>();
  readonly activeBrowser = signal<ExtensionBrowser>('chrome');

  ngAfterViewInit(): void {
    this.document.body.appendChild(this.host.nativeElement);
  }

  ngOnDestroy(): void {
    this.host.nativeElement.remove();
  }

  selectBrowser(browser: ExtensionBrowser): void {
    this.activeBrowser.set(browser);
  }

  close(): void {
    this.activeBrowser.set('chrome');
    this.closed.emit(undefined);
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
