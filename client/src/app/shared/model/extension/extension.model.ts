export type ExtensionState = 'checking' | 'ready' | 'signin' | 'install' | 'unsupported';

export interface ExtensionPresence {
  source?: string;
  type?: string;
  loggedIn?: boolean;
  connected?: boolean;
  version?: string;
}

export interface ExtensionSession {
  extension_connected?: boolean;
}
