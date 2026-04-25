import { OutputEmitterRef, WritableSignal, inject } from '@angular/core';

import { ValuePresentationBase } from '../../../../shared/utils/value-presentation.base';
import { SocialEntityUiService } from '../services/social-entity-ui.service';

export abstract class SocialSummaryBase extends ValuePresentationBase {
  protected readonly socialEntityUiService = inject(SocialEntityUiService);
  abstract scanUsernames: OutputEmitterRef<string[]>;

  protected addTokensFromInput(): void {
    // Optional extension hook for summary views.
  }

  scanConnections(usernames: string[] | null | undefined): void {
    const normalized = this.socialEntityUiService.normalizeUsernames(usernames);
    if (normalized.length === 0) {
      return;
    }
    this.scanUsernames.emit(normalized);
  }

  supportsPostConnections(platformName: string | null | undefined): boolean {
    return this.socialEntityUiService.supportsPostConnections(platformName);
  }

  supportsFollowersFollowing(platformName: string | null | undefined): boolean {
    return this.socialEntityUiService.supportsFollowersFollowing(platformName);
  }

  onMetadataTokenKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addTokensFromInput();
    }
  }

  protected addTokensFromInputSignal(inputSignal: WritableSignal<string>, tokensSignal: WritableSignal<string[]>): string[] {
    const tokens = this.socialEntityUiService.parseTokens(inputSignal());
    if (!tokens.length) {
      return tokensSignal();
    }
    const next = [...tokensSignal()];
    for (const token of tokens) {
      if (!next.includes(token)) {
        next.push(token);
      }
    }
    tokensSignal.set(next);
    inputSignal.set('');
    return next;
  }
}
