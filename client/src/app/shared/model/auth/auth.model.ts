export interface AuthModel {
  token: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  onboarding: string | null;
  error: string | null;
}
