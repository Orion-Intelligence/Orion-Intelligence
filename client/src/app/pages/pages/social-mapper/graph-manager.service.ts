import { Injectable, inject } from '@angular/core';
import { NetworkData, NetworkNode, PlatformResult } from '../../shared/model/social/social-scan.models';
import { getPlatformColor } from '../../shared/utils/formatters';
import { IconService } from '../../shared/services/icon.service';

@Injectable({ providedIn: 'root' })
export class GraphManagerService {

    private iconService = inject(IconService);

    public createPlatformNode(platform: PlatformResult, iconUrlMap: Map<string, string>): NetworkNode {
        return {
            id: `platform-${platform.keyUsername}|${platform.platform}|${platform.username}`,
            label: platform.platform,
            shape: 'circularImage',
            image: iconUrlMap.get(platform.platform),
            size: 25,
            font: { color: '#e5e7eb' },
            color: { border: getPlatformColor(platform.platform), background: '#334155', highlight: { border: '#facc15', background: '#475569' }, hover: { border: '#2dd4bf', background: '#475569' }},
            title: `<b>${platform.platform}</b><br>Click for details`,
            borderWidth: 2,
            borderWidthSelected: 4
        };
    }

    public createUserNode(username: string): NetworkNode {
        return {
            id: `user-${username}`,
            label: username,
            shape: 'icon',
            icon: { face: 'bootstrap-icons', code: '\uf4d7', size: 60, color: '#a5b4fc' },
            size: 40,
            font: { color: '#ffffff' },
            color: { border: '#818cf8', background: '#3730a3', highlight: { border: '#facc15', background: '#4f46e5' }, hover: { border: '#a5b4fc', background: '#4338ca' }},
            title: `<b>${username}</b><br>Click to view profile summary`,
            shadow: { enabled: true, color: 'rgba(99, 102, 241, 0.6)', size: 25, x: 0, y: 0 },
            borderWidth: 3,
            borderWidthSelected: 6
        };
    }

    public createGroupNodeSvg(count: number, isExpanded = false): string {
        const highlightRing = isExpanded
        ? `<circle cx="80" cy="80" r="70" fill="none" stroke="#facc15" stroke-width="6" />`
        : '';
    
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
        <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="4" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/>
            </filter>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0c4a6e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
            </linearGradient>
        </defs>
        <g style="filter: url(#shadow);">
            ${highlightRing}
            <!-- Dashed border -->
            <circle cx="80" cy="80" r="60" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 4" opacity="0.8">
            <animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="20s" repeatCount="indefinite"/>
            </circle>

            <!-- Main circle -->
            <circle cx="80" cy="80" r="50" fill="url(#grad1)" stroke="#7dd3fc" stroke-width="3" />

            <!-- Text -->
            <text x="80" y="85" font-family="'Inter', sans-serif" text-anchor="middle" font-size="32" font-weight="bold" fill="#f1f5f9">${count}</text>
            <text x="80" y="105" font-family="'Inter', sans-serif" text-anchor="middle" font-size="12" fill="#94a3b8">platforms</text>
        </g>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }
}
