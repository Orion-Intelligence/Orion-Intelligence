import { WritableSignal } from '@angular/core';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';

const HIDDEN_PROFILE_DETAIL_KEYS = new Set(['m_scrap_file', 'm_network', 'm_hash_id', 'm_hash', 'm_content_type', 'm_channel_url', 'm_weblink', 'm_date', 'm_sender_name', 'm_message_id']);

function hasProfileDetailValue(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return value.trim() !== '';
  }
  if (Array.isArray(value)) {
    return value.some(item => hasProfileDetailValue(item));
  }
  return true;
}

export function getProfileDetailEntries(platform: PlatformResult | null): {
    key: string;
    value: any;
}[] {
  if (!platform) {
    return [];
  }
  const details = platform.profileDetails;
  if (!details) {
    return [];
  }
  return Object.entries(details)
    .filter(([key, value]) => !HIDDEN_PROFILE_DETAIL_KEYS.has(key.toLowerCase()) && hasProfileDetailValue(value))
    .map(([key, value]) => ({ key, value }));
}
export function getMetadataEntries(metadata: Record<string, any> | null | undefined): {
    key: string;
    value: any;
}[] {
  if (!metadata) {
    return [];
  }
  return Object.entries(metadata).map(([key, value]) => ({ key, value }));
}
export function addItemsIncrementally<T>(displaySignal: WritableSignal<T[]>, itemsToAdd: T[], onComplete: () => void, delayMs: number = 75): void {
  if (itemsToAdd.length === 0) {
    onComplete();
    return;
  }
  let index = 0;
  const addNextItem = () => {
    if (index < itemsToAdd.length) {
      displaySignal.update(current => [...current, itemsToAdd[index]]);
      index += 1;
      setTimeout(addNextItem, delayMs);
      return;
    }
    onComplete();
  };
  addNextItem();
}
export function loadMoreIncrementally<T>(isLoadingSignal: WritableSignal<boolean>, displaySignal: WritableSignal<T[]>, allItems: T[] | undefined | null, increment: number, delayMs: number = 75): void {
  if (isLoadingSignal()) {
    return;
  }
  isLoadingSignal.set(true);
  const currentCount = displaySignal().length;
  const items = allItems || [];
  const nextItems = items.slice(currentCount, currentCount + increment);
  addItemsIncrementally(displaySignal, nextItems, () => isLoadingSignal.set(false), delayMs);
}
