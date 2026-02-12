import { Injectable } from '@angular/core';

const iconMap: { [key: string]: string } = {
  // Mappings for names that differ from simple-icons slugs, or have variations
  'x': 'x',
  'twitter': 'x',
  'hub': 'docker',
  'docker hub': 'docker',
  'en': 'gravatar', // for en.gravatar.com
  'google+': 'googleplus',
  'dev.to': 'devdotto',
  'node.js': 'nodedotjs',
  'last.fm': 'lastdotfm',
  'lastfm': 'lastdotfm',
  'about.me': 'aboutdotme',
  'atlassian bitbucket': 'bitbucket',
  'bitbucket.org': 'bitbucket',
  'tiktok.com': 'tiktok',
  'youtube': 'youtube',
  'youtu.be': 'youtube',
  
  // Common platforms for robustness
  'allmylinks': 'allmylinks',
  'artstation': 'artstation',
  'audiojungle': 'envato',
  'behance': 'behance',
  'bitbucket': 'bitbucket',
  'cgtrader': 'cgtrader',
  'codepen': 'codepen',
  'crowdin': 'crowdin',
  'deviantart': 'deviantart',
  'discord': 'discord',
  'dribbble': 'dribbble',
  'facebook': 'facebook',
  'flickr': 'flickr',
  'foursquare': 'foursquare',
  'github': 'github',
  'gitlab': 'gitlab',
  'gravatar': 'gravatar',
  'instagram': 'instagram',
  'linkedin': 'linkedin',
  'medium': 'medium',
  'patreon': 'patreon',
  'pinterest': 'pinterest',
  'replit': 'replit',
  'reddit': 'reddit',
  'snapchat': 'snapchat',
  'soundcloud': 'soundcloud',
  'spotify': 'spotify',
  'steam': 'steam',
  'telegram': 'telegram',
  'themeforest': 'envato',
  'tiktok': 'tiktok',
  'tumblr': 'tumblr',
  'twitch': 'twitch',
  'vimeo': 'vimeo',
  'vk': 'vk',
  'whatsapp': 'whatsapp',
  'wordpress': 'wordpress',
};

export interface IconOptions {
  type?: 'default' | 'graph';
}

@Injectable({ providedIn: 'root' })
export class IconService {
    private iconCache = new Map<string, string>();

    async getWhiteIconDataUrl(platformName: string, options: IconOptions = { type: 'default' }): Promise<string> {
        const cacheKey = `${platformName}-${options.type}`;
        if (this.iconCache.has(cacheKey)) {
            return this.iconCache.get(cacheKey)!;
        }

        const lowerCasePlatform = platformName.toLowerCase();
        const slug = iconMap[lowerCasePlatform] || lowerCasePlatform.replace(/[\s.]+/g, '');
        const url = `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${slug}.svg`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Icon not found for slug: ${slug}`);
            
            const originalSvgText = await response.text();

            // Extract inner content of SVG
            const innerContentMatch = originalSvgText.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
            let innerContent = innerContentMatch ? innerContentMatch[1] : '';

            // Remove any existing fill attributes from paths to ensure our fill cascades
            innerContent = innerContent.replace(/ fill="[^"]*"/g, '');

            // Lighter color (slate-200) for a softer look
            const fillColor = '#e2e8f0'; 
            
            const padding = options.type === 'graph' ? 4 : 3;
            const viewBoxSize = 24 + (2 * padding);

            // Wrap in a new SVG with padding via viewBox and apply the fill color
            const newSvgText = `<svg viewBox="-${padding} -${padding} ${viewBoxSize} ${viewBoxSize}" xmlns="http://www.w3.org/2000/svg" fill="${fillColor}">${innerContent}</svg>`;

            const dataUrl = `data:image/svg+xml;base64,${btoa(newSvgText)}`;
            this.iconCache.set(cacheKey, dataUrl);
            return dataUrl;
        } catch (error) {
            console.warn(`Could not load icon for ${platformName} (slug: ${slug}):`, error);
            const firstLetter = platformName.charAt(0).toUpperCase();
            const fillColor = '#e2e8f0'; // Use same color as successful icons
            const fontSize = options.type === 'graph' ? 18 : 20;
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><text x="50%" y="50%" dy=".35em" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="${fillColor}">${firstLetter}</text></svg>`;
            const fallbackDataUrl = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
            this.iconCache.set(cacheKey, fallbackDataUrl);
            return fallbackDataUrl;
        }
    }
}
