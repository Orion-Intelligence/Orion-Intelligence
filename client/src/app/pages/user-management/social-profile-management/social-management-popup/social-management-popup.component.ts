import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { UiDropdownComponent, UiDropdownOption } from '../../../../shared/partials/ui-dropdown/ui-dropdown.component';
import { MessageNotificationService } from '../../../../services/message_notification/message-notification.service';
import { SocialAgeGroup, SocialGender, SocialPersona, SocialPersonaCreateRequest, SocialPlatform } from '../../../../shared/model/profile/social-profile-management.model';
import { SocialProfileManagementService } from '../social-profile-management.service';

export type SocialManagementPopupMode = 'persona' | 'profile';

@Component({
  selector: 'app-social-management-popup',
  standalone: true,
  imports: [FormsModule, UiDropdownComponent],
  templateUrl: './social-management-popup.component.html',
})
export class SocialManagementPopupComponent {
  readonly mode = input<SocialManagementPopupMode>('persona');
  readonly persona = input<SocialPersona | null>(null);
  readonly closed = output<void>();
  readonly saved = output<void>();
  isSaving = false;
  formError = '';
  personaForm: SocialPersonaCreateRequest = { name: '', age_group: '18-24', gender: 'unspecified', country: '', city: '', interests: [] };
  profileForm = { platform: '' as SocialPlatform | '', profile_name: '', profile_username: '' };
  readonly ageGroups: UiDropdownOption[] = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'].map(value => ({ key: value, label: value }));
  readonly genders: UiDropdownOption[] = [ { key: 'male', label: 'Male' }, { key: 'female', label: 'Female' }, { key: 'unspecified', label: 'Unspecified' }, ];
  readonly platforms: UiDropdownOption[] = [ { key: 'facebook', label: 'Facebook' }, { key: 'x', label: 'Twitter/X' }, ];
  readonly interests: UiDropdownOption[] = [
    'Animals', 'Comedy', 'Travel', 'Food', 'Sports', 'Beauty & Style', 'Art', 'Gaming', 'Science & Education', 'Dance', 'DIY', 'Auto', 'Music', 'Life Hacks', 'Oddly Satisfying', 'Outdoors', 'Fandom'
  ].map(value => ({ key: value, label: value }));

  constructor(private managerService: SocialProfileManagementService, private messageNotificationService: MessageNotificationService) {}

  ngOnInit(): void {
    const persona = this.persona();
    this.personaForm = persona
      ? {
        name: persona.name,
        age_group: persona.age_group,
        gender: persona.gender,
        country: persona.country || '',
        city: persona.city || '',
        interests: [...(persona.interests || []).slice(0, 3)],
      }
      : { name: '', age_group: '18-24', gender: 'unspecified', country: '', city: '', interests: [] };
  }

  close(): void {
    if (this.isSaving) {
      return;
    }
    this.closed.emit();
  }

  save(): void {
    if (this.mode() === 'profile') {
      this.connectProfile();
      return;
    }
    this.savePersona();
  }

  onAgeGroupChange(value: string | null): void {
    if (value) {
      this.personaForm.age_group = value as SocialAgeGroup;
    }
  }

  onGenderChange(value: string | null): void {
    if (value) {
      this.personaForm.gender = value as SocialGender;
    }
  }

  onPlatformChange(value: string | null): void {
    this.profileForm.platform = (value || '') as SocialPlatform | '';
  }

  onInterestChange(values: string[]): void {
    if (values.length > 3) {
      this.messageNotificationService.show('You can select up to 3 interests');
    }
    this.personaForm.interests = values.slice(0, 3);
  }

  title(): string {
    if (this.mode() === 'profile') {
      return 'Connect Social Profile';
    }
    return this.persona() ? 'Edit Persona' : 'Add Persona';
  }

  primaryButtonLabel(): string {
    if (this.mode() === 'profile') {
      return this.isSaving ? 'Connecting...' : 'Connect';
    }
    return this.isSaving ? 'Saving...' : 'Save';
  }

  adultStatusLabel(): string {
    return this.personaForm.age_group === '13-17' ? 'Minor' : 'Adult';
  }

  private savePersona(): void {
    if (!this.personaForm.name.trim()) {
      this.formError = 'Persona name is required';
      return;
    }
    const personaId = this.persona()?.persona_id || '';
    const request = personaId
      ? this.managerService.updatePersona(personaId, this.personaForm)
      : this.managerService.createPersona(this.personaForm);

    this.isSaving = true;
    request.pipe(finalize(() => this.isSaving = false)).subscribe({
      next: () => {
        this.messageNotificationService.show('Persona saved successfully', 'success');
        this.saved.emit();
      },
      error: (error) => this.formError = error?.error?.detail || 'Failed to save persona',
    });
  }

  private connectProfile(): void {
    if (!this.profileForm.platform) {
      this.formError = 'Platform is required';
      return;
    }
    this.isSaving = true;
    this.managerService.connectProfile({
      platform: this.profileForm.platform,
      profile_name: this.profileForm.profile_name,
      profile_username: this.profileForm.profile_username,
    }).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (profile) => {
        this.messageNotificationService.show('Social profile connection started', 'success');
        this.saved.emit();
        if (profile.login_url) {
          window.open(profile.login_url, '_blank', 'noopener');
        }
      },
      error: (error) => this.formError = error?.error?.detail || 'Failed to connect social profile',
    });
  }
}
