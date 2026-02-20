import { Injectable } from '@angular/core';
import { PlatformResult } from '../../../../shared/model/social/social-scan.models';
import { RelationshipConnectionItem } from './social-mapper-state.service';
@Injectable({ providedIn: 'root' })
export class RelationshipResolverService {
  public normalizeHandle(value: string): string {
    let normalized = value.trim().toLowerCase();
    if (!normalized) {
      return '';
    }
    if (normalized.includes('://')) {
      try {
        const parsedUrl = new URL(normalized);
        const segments = parsedUrl.pathname.split('/').filter(Boolean);
        if (segments.length > 0) {
          normalized = segments[segments.length - 1];
        }
      }
      catch {
      }
    }
    normalized = normalized.replace(/^@+/, '');
    normalized = normalized.replace(/[?#].*$/, '');
    normalized = normalized.replace(/\/+$/, '');
    return normalized;
  }

  public compactHandle(value: string): string {
    return value.replace(/[^a-z0-9]/g, '');
  }

  public getHandleVariants(value: string): Set<string> {
    const variants = new Set<string>();
    const normalized = this.normalizeHandle(value);
    if (!normalized) {
      return variants;
    }
    variants.add(normalized);
    const compact = this.compactHandle(normalized);
    if (compact) {
      variants.add(compact);
    }
    return variants;
  }

  public getUserHandleSet(username: string, platforms: PlatformResult[]): Set<string> {
    const handles = new Set<string>();
    for (const variant of this.getHandleVariants(username)) {
      handles.add(variant);
    }
    for (const platform of platforms) {
      for (const variant of this.getHandleVariants(platform.username || '')) {
        handles.add(variant);
      }
      for (const variant of this.getHandleVariants(platform.url || '')) {
        handles.add(variant);
      }
    }
    return handles;
  }

  public containsAnyHandle(list: string[] | null | undefined, targets: Set<string>): boolean {
    if (!list || list.length === 0) {
      return false;
    }
    for (const handle of list) {
      for (const variant of this.getHandleVariants(handle)) {
        if (targets.has(variant)) {
          return true;
        }
      }
    }
    return false;
  }

  private addRelationshipConnectionsForDirection(sourceUser: string, targetUser: string, sourcePlatforms: PlatformResult[], targetHandles: Set<string>, connections: RelationshipConnectionItem[], unique: Set<string>): void {
    for (const platform of sourcePlatforms) {
      this.tryAddRelationshipConnection(sourceUser, targetUser, platform, 'follows', this.containsAnyHandle(platform.following_list, targetHandles), connections, unique);
      this.tryAddRelationshipConnection(sourceUser, targetUser, platform, 'followed_by', this.containsAnyHandle(platform.followers_list, targetHandles), connections, unique);
    }
  }

  private tryAddRelationshipConnection(sourceUser: string, targetUser: string, platform: PlatformResult, relation: 'follows' | 'followed_by', matches: boolean, connections: RelationshipConnectionItem[], unique: Set<string>): void {
    if (!matches) {
      return;
    }
    const key = `${sourceUser}|${platform.platform}|${platform.username}|${targetUser}|${relation}`;
    if (unique.has(key)) {
      return;
    }
    unique.add(key);
    connections.push({
      sourceUser,
      sourcePlatform: platform.platform,
      sourceUsername: platform.username,
      sourceUrl: platform.url,
      targetUser,
      relation
    });
  }

  buildRelationshipConnections(userA: string, userB: string, scanResults: Map<string, PlatformResult[]>): RelationshipConnectionItem[] {
    const userAPlatforms = scanResults.get(userA) || [];
    const userBPlatforms = scanResults.get(userB) || [];
    const userAHandles = this.getUserHandleSet(userA, userAPlatforms);
    const userBHandles = this.getUserHandleSet(userB, userBPlatforms);
    const unique = new Set<string>();
    const connections: RelationshipConnectionItem[] = [];
    this.addRelationshipConnectionsForDirection(userA, userB, userAPlatforms, userBHandles, connections, unique);
    this.addRelationshipConnectionsForDirection(userB, userA, userBPlatforms, userAHandles, connections, unique);
    return connections;
  }
}
