import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';
import { exhaustMap } from 'rxjs/operators';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ManageProfilesExtensionState, ManageProfilesService } from './manage-profiles.service';
import { PlatformEntry, SessionEntry } from './model/manage-profiles.model';
import { SocialExtensionManagerComponent } from '../../shared/partials/extension-manager/extension-manager.component';
import { SocialIconComponent } from '../../shared/partials/social-icon/social-icon.component';
import { ConfirmationPopupComponent } from '../../shared/partials/confirmation-popup/confirmation-popup.component';

interface PendingSessionDelete {
  platform: string;
  sessionId: string;
}

@Component({
  selector: 'app-manage-profiles',
  standalone: true,
  imports: [DatePipe, NgClass, TranslatePipe, SocialExtensionManagerComponent, SocialIconComponent, ConfirmationPopupComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './manage-profiles.component.html',
  styleUrls: ['./manage-profiles.component.scss'],
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
  readonly sessionVerifying = signal<Set<string>>(new Set<string>());
  readonly sessions = signal<Record<string, SessionEntry[]>>({});
  readonly expanded = signal<Set<string>>(new Set<string>());
  readonly sessionPendingDelete = signal<PendingSessionDelete | null>(null);

  constructor() {
    timer(0, 3000).pipe(exhaustMap(() => this.service.detectExtension()), takeUntilDestroyed(this.destroyRef)).subscribe(state => {
      const previous = this.state();
      this.state.set(state);
      if (state === 'ready' && previous !== 'ready') {
        this.loadPlatforms();
        this.loadCapturedSessions();
      }
    });
  }

  editSession(entry: PlatformEntry, sessionId: string): void {
    this.fetchSession(entry, sessionId);
  }

  fetchSession(entry: PlatformEntry, sessionId = ''): void {
    if (this.sessionFetching().has(entry.platform)) {
      return;
    }
    if (!sessionId && this.sessionCount(entry.platform) >= this.maxSessions) {
      return;
    }
    this.sessionFetching.update(current => new Set(current).add(entry.platform));
    this.service.fetchSession(entry.platform, entry.base, sessionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(result => {
      this.sessionFetching.update(current => {
        const next = new Set(current);
        next.delete(entry.platform);
        return next;
      });
      if (result.error === 'session_limit') {
        this.loadCapturedSessions();
        return;
      }
      if (result.error) {
        return;
      }
      this.expanded.update(current => new Set(current).add(this.safePlatform(entry.platform)));
      this.loadCapturedSessions();
    });
  }

  isVerifying(sessionId: string): boolean {
    return this.sessionVerifying().has(sessionId);
  }

  verifySession(entry: PlatformEntry, sessionId: string): void {
    if (this.sessionVerifying().has(sessionId)) {
      return;
    }
    this.sessionVerifying.update(current => new Set(current).add(sessionId));
    this.service.verifySession(entry.platform, entry.base, sessionId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.sessionVerifying.update(current => {
        const next = new Set(current);
        next.delete(sessionId);
        return next;
      });
      this.loadCapturedSessions();
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

  sessionStatus(session: SessionEntry): 'verified' | 'failed' | 'pending' {
    if (session.verified) {
      return 'verified';
    }
    return session.verifiedAt ? 'failed' : 'pending';
  }

  platformStatus(platform: string): 'verified' | 'failed' | 'pending' {
    const sessions = this.sessionsFor(platform);
    if (sessions.some(session => this.sessionStatus(session) === 'failed')) {
      return 'failed';
    }
    if (sessions.some(session => this.sessionStatus(session) === 'verified')) {
      return 'verified';
    }
    return 'pending';
  }

  isExpanded(platform: string): boolean {
    return this.expanded().has(this.safePlatform(platform));
  }

  toggleRow(entry: PlatformEntry, event?: Event): void {
    if (this.sessionCount(entry.platform) <= 0) {
      return;
    }
    event?.preventDefault();
    this.toggleExpand(entry.platform);
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

  requestDeleteSession(platform: string, sessionId: string): void {
    this.sessionPendingDelete.set({ platform, sessionId });
  }

  deleteConfirmationMessage(sessionId: string): string {
    return `Delete Session #${sessionId.slice(0, 8)}? This action cannot be undone.`;
  }

  handleDeleteConfirmation(confirmed: boolean): void {
    const pending = this.sessionPendingDelete();
    this.sessionPendingDelete.set(null);
    if (confirmed && pending) {
      this.deleteSession(pending.platform, pending.sessionId);
    }
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
