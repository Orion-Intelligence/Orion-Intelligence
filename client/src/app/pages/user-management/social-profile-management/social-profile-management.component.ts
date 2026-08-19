import { NgClass } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { fadeInDashboardItem } from '../../../shared/animations/dashboard.item.animation';
import { UiDropdownComponent, UiDropdownOption } from '../../../shared/components/ui-dropdown/ui-dropdown.component';
import { ConfirmationPopupComponent } from '../../../shared/partials/confirmation-popup/confirmation-popup.component';
import { MessageNotificationService } from '../../../services/message_notification/message-notification.service';
import { SocialPersona, SocialPlatform, SocialProfile } from '../../../shared/model/profile/social-profile-management.model';
import { SocialProfileManagementService } from './social-profile-management.service';
import { SocialManagementPopupComponent } from './social-management-popup/social-management-popup.component';

type SocialProfileTab = 'personas' | 'profiles' | 'assignments';

@Component({
  selector: 'app-social-profile-management',
  standalone: true,
  imports: [NgClass, UiDropdownComponent, ConfirmationPopupComponent, SocialManagementPopupComponent],
  templateUrl: './social-profile-management.component.html',
  animations: [fadeInDashboardItem],
})
export class SocialProfileManagementComponent implements OnInit {
  activeTab: SocialProfileTab = 'personas';
  personas: SocialPersona[] = [];
  profiles: SocialProfile[] = [];
  isLoading = false;
  formError = '';
  showPersonaModal = false;
  showProfileModal = false;
  isDeleteConfirmationOpen = false;
  selectedPersona: SocialPersona | null = null;
  selectedDeletePersona: SocialPersona | null = null;
  selectedDeleteProfile: SocialProfile | null = null;
  selectedAssignmentProfile: SocialProfile | null = null;
  assignmentPersonaId = '';
  assignmentProfileId = '';
  reconnectingProfileId = '';
  readonly tabs: { key: SocialProfileTab; label: string }[] = [ { key: 'personas', label: 'Personas' }, { key: 'profiles', label: 'Connected Profiles' }, { key: 'assignments', label: 'Assignments' }, ];

  constructor(private managerService: SocialProfileManagementService, private messageNotificationService: MessageNotificationService) {}

  ngOnInit(): void {
    this.loadData();
  }

  get personaOptions(): UiDropdownOption[] {
    return this.personas.map(persona => ({ key: persona.persona_id, label: persona.name }));
  }

  get assignmentProfileOptions(): UiDropdownOption[] {
    return this.profiles.map(profile => ({
      key: profile.profile_id,
      label: `${this.platformLabel(profile.platform)} - ${profile.profile_name || profile.profile_username || 'Pending profile'}`,
    }));
  }

  setActiveTab(tab: SocialProfileTab): void {
    this.activeTab = tab;
    this.formError = '';
  }

  openPersonaModal(persona?: SocialPersona): void {
    this.formError = '';
    this.selectedPersona = persona || null;
    this.showPersonaModal = true;
  }

  closePersonaModal(): void {
    this.showPersonaModal = false;
    this.selectedPersona = null;
  }

  onPersonaSaved(): void {
    this.closePersonaModal();
    this.loadData();
  }

  deletePersona(persona: SocialPersona): void {
    this.formError = '';
    this.selectedDeletePersona = persona;
    this.selectedDeleteProfile = null;
    this.isDeleteConfirmationOpen = true;
  }

  confirmDelete(event: boolean): void {
    this.isDeleteConfirmationOpen = false;
    if (!event) {
      this.clearConfirmationSelection();
      return;
    }
    if (this.selectedDeletePersona) {
      this.deleteSelectedPersona();
      return;
    }
    if (this.selectedDeleteProfile) {
      this.deleteSelectedProfile();
      return;
    }
    if (this.selectedAssignmentProfile) {
      this.removeSelectedAssignment();
    }
  }

  deleteProfile(profile: SocialProfile): void {
    this.formError = '';
    this.selectedDeleteProfile = profile;
    this.selectedDeletePersona = null;
    this.isDeleteConfirmationOpen = true;
  }

  reconnectProfile(profile: SocialProfile): void {
    if (profile.connection_status === 'connected' || this.reconnectingProfileId) {
      return;
    }
    this.formError = '';
    this.reconnectingProfileId = profile.profile_id;
    this.managerService.reconnectProfile(profile.profile_id).pipe(finalize(() => this.reconnectingProfileId = '')).subscribe({
      next: (response) => {
        this.messageNotificationService.show('Social profile connection started', 'success');
        if (response.login_url) {
          window.open(response.login_url, '_blank', 'noopener');
        }
        this.loadData();
      },
      error: (error) => this.messageNotificationService.show(error?.error?.detail || 'Failed to reconnect social profile'),
    });
  }

  deleteConfirmationMessage(): string {
    if (this.selectedDeletePersona) {
      return `Are you sure you want to delete persona "${this.selectedDeletePersona.name}"?`;
    }
    if (this.selectedDeleteProfile) {
      return 'Are you sure you want to delete this social profile?';
    }
    return 'Are you sure you want to remove this assignment?';
  }

  private deleteSelectedPersona(): void {
    if (!this.selectedDeletePersona) {
      return;
    }
    this.managerService.deletePersona(this.selectedDeletePersona.persona_id).subscribe({
      next: () => {
        this.clearConfirmationSelection();
        this.messageNotificationService.show('Persona deleted successfully', 'success');
        this.loadData();
      },
      error: (error) => {
        this.clearConfirmationSelection();
        this.messageNotificationService.show(error?.error?.detail || 'Failed to delete persona');
      },
    });
  }

  openProfileModal(): void {
    this.formError = '';
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  onProfileSaved(): void {
    this.closeProfileModal();
    this.loadData();
  }

  private deleteSelectedProfile(): void {
    if (!this.selectedDeleteProfile) {
      return;
    }
    this.managerService.deleteProfile(this.selectedDeleteProfile.profile_id).subscribe({
      next: () => {
        this.clearConfirmationSelection();
        this.messageNotificationService.show('Social profile deleted successfully', 'success');
        this.loadData();
      },
      error: (error) => {
        this.clearConfirmationSelection();
        this.messageNotificationService.show(error?.error?.detail || 'Failed to delete social profile');
      },
    });
  }

  assignProfile(): void {
    if (!this.assignmentPersonaId || !this.assignmentProfileId) {
      this.formError = 'Select a persona and social profile';
      return;
    }
    const profile = this.profiles.find(item => item.profile_id === this.assignmentProfileId);
    if (profile && this.hasPlatformAssignment(this.assignmentPersonaId, profile.platform, profile.profile_id)) {
      this.formError = 'This persona is already assigned to a profile on the selected platform';
      return;
    }
    this.managerService.assignProfile({ persona_id: this.assignmentPersonaId, profile_id: this.assignmentProfileId }).subscribe({
      next: () => {
        this.formError = '';
        this.assignmentPersonaId = '';
        this.assignmentProfileId = '';
        this.messageNotificationService.show('Persona assigned successfully', 'success');
        this.loadData();
      },
      error: (error) => this.formError = error?.error?.detail || 'Failed to assign persona',
    });
  }

  removeAssignment(profile: SocialProfile): void {
    this.formError = '';
    this.selectedAssignmentProfile = profile;
    this.selectedDeletePersona = null;
    this.selectedDeleteProfile = null;
    this.isDeleteConfirmationOpen = true;
  }

  private removeSelectedAssignment(): void {
    if (!this.selectedAssignmentProfile) {
      return;
    }
    this.managerService.removeAssignment(this.selectedAssignmentProfile.profile_id).subscribe({
      next: () => {
        this.clearConfirmationSelection();
        this.messageNotificationService.show('Assignment removed successfully', 'success');
        this.loadData();
      },
      error: (error) => {
        this.clearConfirmationSelection();
        this.messageNotificationService.show(error?.error?.detail || 'Failed to remove assignment');
      },
    });
  }

  personaName(personaId?: string | null): string {
    return this.personas.find(persona => persona.persona_id === personaId)?.name || 'Unassigned';
  }

  platformLabel(platform: SocialPlatform): string {
    return platform === 'facebook' ? 'Facebook' : 'Twitter/X';
  }

  statusLabel(value?: string | null): string {
    return (value || '').replace(/_/g, ' ') || 'Unknown';
  }

  private loadData(): void {
    this.isLoading = true;
    this.managerService.getPersonas().subscribe({
      next: (response) => this.personas = response?.personas || [],
      error: (error) => this.formError = error?.error?.detail || 'Failed to load personas',
    });
    this.managerService.getProfiles().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (response) => this.profiles = response?.profiles || [],
      error: (error) => this.formError = error?.error?.detail || 'Failed to load social profiles',
    });
  }

  private hasPlatformAssignment(personaId: string, platform: SocialPlatform, ignoredProfileId = ''): boolean {
    return this.profiles.some(profile => profile.profile_id !== ignoredProfileId && profile.assigned_persona_id === personaId && profile.platform === platform);
  }

  private clearConfirmationSelection(): void {
    this.selectedDeletePersona = null;
    this.selectedDeleteProfile = null;
    this.selectedAssignmentProfile = null;
  }
}
