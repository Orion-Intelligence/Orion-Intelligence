export interface AuthModel {
    token: string | null;
    isAuthenticated: boolean;
    isValidated: boolean;
    error: string | null;
}
