import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PlatformResult } from '../../../../../shared/model/social/social-scan.models';
import type { PostContentTabKey, PostCursorFetchRequest } from '../../models/social-graph.models';
import { SocialProfilePostContentSectionComponent } from '../profile-post-content-section/profile-post-content-section.component';

@Component({
  selector: 'app-social-profile-posts-section',
  templateUrl: './profile-posts-section.component.html',
  standalone: true,
  imports: [SocialProfilePostContentSectionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialProfilePostsSectionComponent {
  platformData = input.required<PlatformResult>();
  isLoading = input(false);
  showFetchLatest = input(true);
  showLoadMoreWhenDone = input(false);
  showHeader = input(true);
  compactMedia = input(false);
  allowCommentFetch = input(true);
  flushHorizontal = input(false);
  refetch = output<PostContentTabKey>();
  cursorFetch = output<PostCursorFetchRequest>();
}
