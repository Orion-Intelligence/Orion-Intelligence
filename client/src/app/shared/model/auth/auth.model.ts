export interface AuthModel {
  token: string | null;
  isAuthenticated: boolean;
  isValidated: boolean | true;
  error: string | null;
}
