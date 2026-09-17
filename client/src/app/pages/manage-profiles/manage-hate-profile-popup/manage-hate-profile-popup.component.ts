import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { UiDropdownComponent, UiDropdownOption } from '../../../shared/partials/ui-dropdown/ui-dropdown.component';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { ManageProfilesService } from '../manage-profiles.service';
import { PlatformEntry, SessionEntry, SocialPlatform, SocialProfile, SocialProfileConnectRequest } from '../model/manage-profiles.model';
import { CaseEditDrawerComponent } from '../../user-management/sidebar-user-case-management/model/case-details/case-edit-drawer/case-edit-drawer';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { getOwnProperty } from '../../../shared/utils/type-guards.util';

@Component({
  selector: 'app-manage-hate-profile-popup',
  standalone: true,
  imports: [FormsModule, UiDropdownComponent, CaseEditDrawerComponent, TranslatePipe],
  templateUrl: './manage-hate-profile-popup.component.html',
})
export class ManageHateProfilePopupComponent {
  readonly profile = input<SocialProfile | null>(null);
  readonly platforms = input<PlatformEntry[]>([]);
  readonly sessions = input<Record<string, SessionEntry[]>>({});
  readonly profiles = input<SocialProfile[]>([]);
  readonly closed = output<void>();
  readonly saved = output<void>();
  readonly sessionsRequested = output<void>();
  readonly saving = signal(false);
  readonly formError = signal('');
  readonly profileForm = signal<SocialProfileConnectRequest>({ platform: '', session_id: '', profile_name: '', profile_username: '', profile_url: '', purposes: ['hate_speech_monitoring'] });

  constructor(private service: ManageProfilesService, private notification: MessageNotificationService) {}

  ngOnInit(): void {
    const profile = this.profile();
    if (profile) {
      this.profileForm.set({
        platform: profile.platform,
        session_id: profile.session_id ?? '',
        profile_name: profile.profile_name ?? '',
        profile_username: profile.profile_username ?? '',
        profile_url: profile.profile_url ?? '',
        purposes: ['hate_speech_monitoring'],
      });
    }
  }

  close(): void {
    if (!this.saving()) {
      this.closed.emit();
    }
  }

  save(): void {
    const form = this.profileForm();
    if (!form.platform || !form.profile_url) {
      this.formError.set('Platform and Profile URL are required');
      return;
    }
    this.saving.set(true);
    const profileId = this.profile()?.profile_id ?? '';
    const request = profileId ? this.service.updateProfile(profileId, form) : this.service.connectProfile(form);
    request.pipe(finalize(() => {
      this.saving.set(false); 
    })).subscribe({
      next: () => {
        this.saved.emit(); 
      },
      error: (error) => {
        this.formError.set(error?.error?.detail ?? 'Failed to save hate monitoring profile');
      },
    });
  }

  onProfilePlatform(value: string | null): void {
    this.profileForm.update(form => ({ ...form, platform: this.safePlatform(value ?? '') as SocialPlatform, session_id: '' }));
  }

  onProfileSession(value: string | null): void {
    this.profileForm.update(form => ({ ...form, session_id: value ?? '' }));
  }

  platformOptions(): UiDropdownOption[] {
    return this.platforms()
      .map(entry => ({ key: this.safePlatform(entry.platform), label: entry.platform }))
      .filter((option, index, values) => !!option.key && values.findIndex(item => item.key === option.key) === index);
  }

  availableSessionOptions(): UiDropdownOption[] {
    const platform = this.profileForm().platform;
    if (!platform) {
      return [];
    }
    const currentProfileId = this.profile()?.profile_id ?? '';
    const used = new Set(this.profiles().filter(profile => profile.profile_id !== currentProfileId).map(profile => profile.session_id).filter(Boolean));
    return (getOwnProperty(this.sessions(), platform) ?? [])
      .filter(session => !used.has(session.id))
      .map(session => ({ key: session.id, label: `Session #${session.id.slice(0, 8)} - ${new Date(session.capturedAt).toLocaleString()}` }));
  }

  selectedPlatformEmptyText(): string {
    const platform = this.profileForm().platform;
    return platform ? `No available ${this.platformLabel(platform)} sessions.` : 'Select a platform to view available sessions.';
  }

  title(): string {
    return this.profile() ? 'Edit Hate Profile' : 'Add Hate Profile';
  }

  private safePlatform(platform: string): string {
    return (platform || '').toLowerCase().trim();
  }

  private platformLabel(platform: string): string {
    const str = this.safePlatform(platform);
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
