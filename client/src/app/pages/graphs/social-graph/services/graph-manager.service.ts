import { Injectable } from '@angular/core';
import { NetworkNode, PlatformResult, CustomEntity } from '../../../../shared/model/social/social-scan.models';
import { getPlatformColor } from '../../../../shared/utils/formatters';

@Injectable({ providedIn: 'root' })
export class GraphManagerService {

    public createEntityNode(entity: CustomEntity): NetworkNode {
        const entityConfig = this.getEntityVisualConfig(entity.type);
        return {
            id: entity.id,
            label: entity.label,
            shape: 'circularImage',
            image: this.createEntityNodeSvg(entity.type),
            size: 25,
            font: { color: '#e2e8f0', size: 12 },
            color: {
                border: entityConfig.border,
                background: entityConfig.background,
                highlight: { border: entityConfig.highlightBorder, background: entityConfig.background },
                hover: { border: entityConfig.hoverBorder, background: entityConfig.background }
            },
            title: `${entity.type.toUpperCase()} | ${entity.label} | ${entity.value}`,
            borderWidth: 2,
            borderWidthSelected: 4,
            shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.45)', size: 10, x: 3, y: 3 }
        };
    }

    public createPlatformNode(platform: PlatformResult, iconUrlMap: Map<string, string>): NetworkNode {
        return {
            id: `platform-${platform.keyUsername}|${platform.platform}|${platform.username}`,
            label: platform.platform,
            shape: 'circularImage',
            image: iconUrlMap.get(platform.platform),
            size: 25,
            font: { color: '#e5e7eb' },
            color: { border: getPlatformColor(platform.platform), background: '#334155', highlight: { border: '#facc15', background: '#475569' }, hover: { border: '#2dd4bf', background: '#475569' }},
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
            shadow: { enabled: true, color: 'rgba(99, 102, 241, 0.6)', size: 25, x: 0, y: 0 },
            borderWidth: 3,
            borderWidthSelected: 6
        };
    }

    public createGroupNodeSvg(count: number, isExpanded = false): string {
        const highlightRing = isExpanded
        ? `<circle cx="80" cy="80" r="72" fill="none" stroke="#fde047" stroke-width="6" />
           <circle cx="80" cy="80" r="66" fill="none" stroke="#facc15" stroke-width="2" opacity="0.95" />`
        : '';

        const svg = ` <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"> <defs> <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"> <feDropShadow dx="4" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.5"/> </filter> <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%"> <stop offset="0%" stop-color="#0c4a6e" stop-opacity="1" /> <stop offset="100%" stop-color="#1e293b" stop-opacity="1" /> </linearGradient> </defs> <g filter="url(#shadow)">
            ${highlightRing} <circle cx="80" cy="80" r="60" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 4" opacity="0.8"> <animateTransform attributeName="transform" type="rotate" from="0 80 80" to="360 80 80" dur="20s" repeatCount="indefinite"/> </circle> <circle cx="80" cy="80" r="50" fill="url(#grad1)" stroke="#7dd3fc" stroke-width="3" /> <text x="80" y="85" font-family="'Inter', sans-serif" text-anchor="middle" font-size="32" font-weight="bold" fill="#f1f5f9">${count}</text> <text x="80" y="105" font-family="'Inter', sans-serif" text-anchor="middle" font-size="12" fill="#94a3b8">platforms</text> </g> </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    private createEntityNodeSvg(type: CustomEntity['type']): string {
        const entityConfig = this.getEntityVisualConfig(type);
        const iconPath = this.getEntityIconPath(type);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="74" fill="${entityConfig.background}" stroke="${entityConfig.border}" stroke-width="6"/>
            <circle cx="80" cy="80" r="66" fill="none" stroke="rgba(255, 255, 255, 0.08)" stroke-width="2"/>
            <g transform="translate(80 80) scale(3.2) translate(-8 -8)">
                ${iconPath}
            </g>
        </svg>`;
        return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    private getEntityVisualConfig(type: CustomEntity['type']): { border: string, background: string, highlightBorder: string, hoverBorder: string } {
        if (type === 'wallet') {
            return { border: '#334155', background: '#0f2f2b', highlightBorder: '#10b981', hoverBorder: '#34d399' };
        }
        if (type === 'email') {
            return { border: '#334155', background: '#2f2a16', highlightBorder: '#f59e0b', hoverBorder: '#fbbf24' };
        }
        return { border: '#334155', background: '#132b3a', highlightBorder: '#0ea5e9', hoverBorder: '#38bdf8' };
    }

    private getEntityIconPath(type: CustomEntity['type']): string {
        if (type === 'wallet') {
            return `<path fill="#f8fafc" d="M14 4H2a1 1 0 0 0-1 1v8a3 3 0 0 0 3 3h10a1 1 0 0 0 1-1v-1h1a1 1 0 0 0 1-1V7a3 3 0 0 0-3-3m1 8h-3a1 1 0 0 1 0-2h3z"/>`;
        }
        if (type === 'email') {
            return `<path fill="#f8fafc" d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v.2L8 9 0 4.2zm0 1.6V12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5.6L8 10 0 5.6z"/>`;
        }
        return `<path fill="#f8fafc" d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m6.3 7H11c-.1-1-.3-2-.7-2.9A6.5 6.5 0 0 1 14.3 7M8 1.5c.7.9 1.2 2.1 1.4 3.5H6.6C6.8 3.6 7.3 2.4 8 1.5M1.7 9H5c.1 1 .3 2 .7 2.9A6.5 6.5 0 0 1 1.7 9m0-2a6.5 6.5 0 0 1 4-2.9c-.4.9-.6 1.9-.7 2.9zm6.3 7.5c-.7-.9-1.2-2.1-1.4-3.5h2.8c-.2 1.4-.7 2.6-1.4 3.5M10 9H6c.1-1 .1-2 0-2h4c-.1 1-.1 2 0 2m.3 2.9c.4-.9.6-1.9.7-2.9h3.3a6.5 6.5 0 0 1-4 2.9"/>`;
    }
}
