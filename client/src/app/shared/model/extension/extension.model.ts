export type ExtensionState = 'ready' | 'signin' | 'install' | 'update' | 'unsupported';

export interface ExtensionPresence {
  source?: string;
  type?: string;
  loggedIn?: boolean;
  version?: string;
}

export interface ExtensionSession {
  extension_connected?: boolean;
}
