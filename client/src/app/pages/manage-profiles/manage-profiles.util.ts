export function safePlatform(platform: string): string {
  return platform.toLowerCase().replace(/[^a-z0-9]/g, '');
}
