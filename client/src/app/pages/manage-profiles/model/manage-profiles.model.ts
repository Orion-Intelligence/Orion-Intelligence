export interface PlatformEntry {
  platform: string;
  base: string;
}

export interface SessionEntry {
  id: string;
  capturedAt: string;
  username?: string;
  verified?: boolean;
  verifyError?: string;
  verifiedAt?: string | null;
}
