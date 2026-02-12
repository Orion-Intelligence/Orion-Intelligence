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


@Injectable({ providedIn: 'root' })
export class IconService {
    private iconCache = new Map<string, string>();

    async getWhiteIconDataUrl(platformName: string): Promise<string> {
        if (this.iconCache.has(platformName)) {
            return this.iconCache.get(platformName)!;
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
            
            // Wrap in a new SVG with padding via viewBox and apply the fill color
            const newSvgText = `<svg viewBox="-3 -3 30 30" xmlns="http://www.w3.org/2000/svg" fill="${fillColor}">${innerContent}</svg>`;

            const dataUrl = `data:image/svg+xml;base64,${btoa(newSvgText)}`;
            this.iconCache.set(platformName, dataUrl);
            return dataUrl;
        } catch (error) {
            console.warn(`Could not load icon for ${platformName} (slug: ${slug}):`, error);
            const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 7h2v2h-2zm0 4h2v6h-2z"/></svg>`;
            const fallbackDataUrl = `data:image/svg+xml;base64,${btoa(fallbackSvg)}`;
            this.iconCache.set(platformName, fallbackDataUrl);
            return fallbackDataUrl;
        }
    }
}