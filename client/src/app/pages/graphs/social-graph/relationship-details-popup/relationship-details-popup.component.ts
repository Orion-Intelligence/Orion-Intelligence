import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RelationshipConnectionItem, RelationshipPopupData } from '../services/social-mapper-state.service';
import { buildSocialProfileUrl } from '../utils/profile-url.util';
@Component({
  selector: 'app-relationship-details-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './relationship-details-popup.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RelationshipDetailsPopupComponent {
  data = input.required<RelationshipPopupData>();
  close = output<void>();

  trackByConnection(_index: number, item: RelationshipConnectionItem): string {
    return `${item.sourceUser}|${item.sourcePlatform}|${item.sourceUsername}|${item.targetUser}|${item.relation}`;
  }

  relationLabel(item: RelationshipConnectionItem): string {
    if (item.relation === 'follows') {
      return `${item.sourceUser} follows ${item.targetUser}`;
    }
    if (item.relation === 'mentioned') {
      return `${item.sourceUser} mentioned ${item.targetUser}`;
    }
    return `${item.targetUser} follows ${item.sourceUser}`;
  }

  getAccountUrl(item: RelationshipConnectionItem): string {
    return buildSocialProfileUrl(item.sourcePlatform, item.sourceUsername, item.sourceUrl);
  }
}
