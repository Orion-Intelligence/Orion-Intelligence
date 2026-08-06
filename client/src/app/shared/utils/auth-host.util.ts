const LOCAL_SIGNUP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isSignupHost(hostname: string, appUrl: string): boolean {
  const currentHostname = hostname.trim().toLowerCase().replace(/\.$/, '');
  if (LOCAL_SIGNUP_HOSTS.has(currentHostname)) {
    return true;
  }
  try {
    return new URL(appUrl).hostname.toLowerCase().replace(/\.$/, '') === currentHostname;
  }
  catch {
    return false;
  }
}
