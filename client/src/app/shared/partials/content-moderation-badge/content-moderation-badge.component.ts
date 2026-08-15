import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgClass } from '@angular/common';
import { SocialPostHateSpeech } from '../../../pages/social-cti/models/social-scan.models';
import { ModerationMapping, getModerationConfig } from '../../utils/moderation-mapping';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-content-moderation-badge',
  templateUrl: './content-moderation-badge.component.html',
  standalone: true,
  imports: [NgClass, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentModerationBadgeComponent {
  moderation = input<SocialPostHateSpeech | null | undefined>();

  get config(): ModerationMapping | null {
    const mod = this.moderation();
    if (!mod || mod.label === 'safe') {
      return null;
    }
    return getModerationConfig(mod.label);
  }

  get confidenceText(): string {
    const conf = this.moderation()?.confidence;
    return typeof conf === 'number' ? `${Math.round(conf * 100)}%` : '';
  }
}
