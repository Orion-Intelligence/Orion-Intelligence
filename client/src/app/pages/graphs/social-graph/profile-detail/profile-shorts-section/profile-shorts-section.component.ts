import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import type { PostContentTabKey, PostCursorFetchRequest } from '../../models/social-graph.models';
import { SocialProfilePostContentSectionComponent } from '../profile-post-content-section/profile-post-content-section.component';

@Component({
  selector: 'app-social-profile-shorts-section',
  templateUrl: './profile-shorts-section.component.html',
  standalone: true,
  imports: [SocialProfilePostContentSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfileShortsSectionComponent {
  platformData = input.required<PlatformResult>();
  isLoading = input(false);
  refetch = output<PostContentTabKey>();
  cursorFetch = output<PostCursorFetchRequest>();
}
