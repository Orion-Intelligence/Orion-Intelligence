export interface AuthModel {
  token: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  isValidated: boolean | true;
  onboarding: string | null;
  error: string | null;
  licenses?: string[];
}
