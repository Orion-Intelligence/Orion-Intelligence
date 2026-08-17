import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { social_profile } from '../../models/social.models';
import type { PostContentTabKey } from '../../enums/social-graph.enums';
import type { PostCursorFetchRequest } from '../../models/social-usability.models';
import { SocialProfilePostContentSectionComponent } from '../profile-post-content-section/profile-post-content-section.component';

@Component({
  selector: 'app-social-profile-videos-section',
  templateUrl: './profile-videos-section.component.html',
  standalone: true,
  imports: [SocialProfilePostContentSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileVideosSectionComponent {
  platformData = input.required<social_profile>();
  isLoading = input(false);
  refetch = output<PostContentTabKey>();
  cursorFetch = output<PostCursorFetchRequest>();
}
