export type ExtensionState = 'ready' | 'signin' | 'install';

export interface ExtensionPresence {
  source?: string;
  type?: string;
  loggedIn?: boolean;
}

export interface ExtensionSession {
  extension_connected?: boolean;
}
