import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ManageProfilesExtensionState, ManageProfilesService } from './manage-profiles.service';
import { PlatformEntry, SessionEntry } from './model/manage-profiles.model';
import { ExtensionRequiredComponent } from '../../shared/partials/extension-required/extension-required.component';
import { SocialIconComponent } from '../../shared/partials/social-icon/social-icon.component';

@Component({
  selector: 'app-manage-profiles',
  standalone: true,
  imports: [DatePipe, TranslatePipe, ExtensionRequiredComponent, SocialIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-profiles.component.html',
})
export class ManageProfilesComponent {
  private readonly service = inject(ManageProfilesService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<ManageProfilesExtensionState | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly platforms = signal<PlatformEntry[]>([]);
  readonly shimmerRows = [1, 2, 3, 4, 5];
  readonly maxSessions = 10;
  readonly sessionFetching = signal<Set<string>>(new Set<string>());
  readonly sessions = signal<Record<string, SessionEntry[]>>({});
  readonly expanded = signal<Set<string>>(new Set<string>());

  constructor() {
    this.service.detectExtension().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      this.state.set(state);
      if (state === 'ready') {
        this.loadPlatforms();
        this.loadCapturedSessions();
      }
    });
  }

  fetchSession(entry: PlatformEntry): void {
    if (this.sessionFetching().has(entry.platform)) {
      return;
    }
    if (this.sessionCount(entry.platform) >= this.maxSessions) {
      window.alert(`Maximum of ${this.maxSessions} sessions reached for ${entry.platform}. Delete one to capture a new session.`);
      return;
    }
    this.sessionFetching.update(current => new Set(current).add(entry.platform));
    this.service.fetchSession(entry.platform, entry.base).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.sessionFetching.update(current => {
        const next = new Set(current);
        next.delete(entry.platform);
        return next;
      });
      if (result.error === 'session_limit') {
        window.alert(`Maximum of ${this.maxSessions} sessions reached for ${entry.platform}. Delete one to capture a new session.`);
        this.loadCapturedSessions();
        return;
      }
      if (result.error) {
        window.alert(`Session fetch failed for ${entry.platform}.`);
        return;
      }
      this.expanded.update(current => new Set(current).add(this.safePlatform(entry.platform)));
      this.loadCapturedSessions();
      window.alert(`Session data for ${entry.platform} was fetched successfully.`);
    });
  }

  safePlatform(platform: string): string {
    return platform.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  sessionsFor(platform: string): SessionEntry[] {
    return this.sessions()[this.safePlatform(platform)] ?? [];
  }

  sessionCount(platform: string): number {
    return this.sessionsFor(platform).length;
  }

  isExpanded(platform: string): boolean {
    return this.expanded().has(this.safePlatform(platform));
  }

  toggleExpand(platform: string): void {
    const key = this.safePlatform(platform);
    this.expanded.update(current => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      }
      else {
        next.add(key);
      }
      return next;
    });
  }

  downloadSession(platform: string, sessionId: string): void {
    const anchor = document.createElement('a');
    anchor.href = this.service.sessionDownloadUrl(platform, sessionId);
    anchor.rel = 'noopener';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  deleteSession(platform: string, sessionId: string): void {
    this.service.deleteSession(platform, sessionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.loadCapturedSessions());
  }

  private loadCapturedSessions(): void {
    this.service.loadCapturedSessions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(sessions => {
      this.sessions.set(sessions);
    });
  }

  private loadPlatforms(): void {
    if (this.loading() || this.platforms().length > 0) {
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.service.fetchPlatforms().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.loading.set(false);
      if (result.error) {
        this.error.set(result.error);
        return;
      }
      this.platforms.set(result.items);
    });
  }
}
