import type { social_profile, social_resource } from '../models/social.models';
import type { FetchTabKey } from '../enums/social-graph.enums';

export function getPlatformCardId(platformData: social_profile): string {
  return `platform-${platformData.meta.username}|${platformData.meta.platform}|${platformData.meta.username}`;
}

export function crawlKey(platformData: social_profile, type: FetchTabKey): string {
  return `${getPlatformCardId(platformData)}:${type}`;
}

export function isSamePlatform(left: social_profile, right: social_profile): boolean {
  return left.meta.username === right.meta.username
    && left.meta.platform.toLowerCase() === right.meta.platform.toLowerCase();
}

export function resourceKey(item: social_resource): string {
  return String(item?.resource_id ?? item?.url ?? JSON.stringify(item));
}

export function mergeResourcesById(previous: social_resource[], incoming: social_resource[]): social_resource[] {
  const seen = new Set(previous.map(item => resourceKey(item)));
  const merged = [...previous];
  for (const item of incoming) {
    const key = resourceKey(item);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

export function getProfileGroupKey(results: Map<string, social_profile[]>, platform: social_profile): string {
  if (results.has(platform.meta.username)) {
    return platform.meta.username;
  }
  for (const [key, profiles] of results) {
    if (profiles.some(entry => isSamePlatform(entry, platform))) {
      return key;
    }
  }
  return platform.meta.username;
}
