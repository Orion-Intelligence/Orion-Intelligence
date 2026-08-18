export interface PlatformEntry {
  platform: string;
  base: string;
}

export interface SessionEntry {
  id: string;
  capturedAt: string;
}

export interface ExtensionPresence {
  source?: string;
  type?: string;
  loggedIn?: boolean;
}
