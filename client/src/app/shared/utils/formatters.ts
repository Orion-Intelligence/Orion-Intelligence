const platformColorCache = new Map<string, string>();
export function getPlatformColor(platformName: string): string {
    if (platformColorCache.has(platformName)) {
        return platformColorCache.get(platformName)!;
    }
    let hash = 0;
    for (let i = 0; i < platformName.length; i++) {
        hash = platformName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 50%, 40%)`;
    platformColorCache.set(platformName, color);
    return color;
}
export function formatFollowers(count?: number): string {
    if (count === undefined) {
        return 'N/A';
    }
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}
export function formatKey(key: string): string {
    return key
        .replace(/_/g, ' ')
        .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
}
export function isUrl(value: any): boolean {
    return typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
}
export function isImageUrl(value: any): boolean {
    if (typeof value !== 'string') {
        return false;
    }
    return /\.(jpeg|jpg|gif|png|svg)(\?|$)/.test(value.toLowerCase());
}
