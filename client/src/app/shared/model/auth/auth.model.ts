export interface AuthModel {
  token: string | null;
  username: string | null;
  role: string | null;
  isAuthenticated: boolean;
  error: string | null;
}
