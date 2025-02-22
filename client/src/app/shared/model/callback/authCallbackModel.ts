export interface AuthCallbackModel {
  token: string | null;
  username: string | null;
  isAuthenticated: boolean;
  error: string | null;
}
