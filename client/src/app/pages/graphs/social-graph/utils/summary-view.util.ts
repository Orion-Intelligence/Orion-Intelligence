import { WritableSignal } from '@angular/core';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';

export function getProfileDetailEntries(platform: PlatformResult | null): { key: string; value: any }[] {
  if (!platform) {
    return [];
  }

  const details = platform.profileDetails;
  if (!details) {
    return [];
  }

  return Object.entries(details)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([key, value]) => ({ key, value }));
}

export function getMetadataEntries(metadata: Record<string, any> | null | undefined): { key: string; value: any }[] {
  if (!metadata) {
    return [];
  }

  return Object.entries(metadata).map(([key, value]) => ({ key, value }));
}

export function addItemsIncrementally<T>(
  displaySignal: WritableSignal<T[]>,
  itemsToAdd: T[],
  onComplete: () => void,
  delayMs: number = 75
): void {
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

export function loadMoreIncrementally<T>(
  isLoadingSignal: WritableSignal<boolean>,
  displaySignal: WritableSignal<T[]>,
  allItems: T[] | undefined | null,
  increment: number,
  delayMs: number = 75
): void {
  if (isLoadingSignal()) {
    return;
  }

  isLoadingSignal.set(true);

  const currentCount = displaySignal().length;
  const items = allItems || [];
  const nextItems = items.slice(currentCount, currentCount + increment);

  addItemsIncrementally(displaySignal, nextItems, () => isLoadingSignal.set(false), delayMs);
}
