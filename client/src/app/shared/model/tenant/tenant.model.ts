export interface IocCategory {
    ioc_id: string;
    name: string;
    values: string[];
}
export type TenantStatus = 'onboarding' | 'active' | 'disable';
export const TenantStatusValues = {
  ONBOARDING: 'onboarding' as TenantStatus,
  ACTIVE: 'active' as TenantStatus,
  DISABLE: 'disable' as TenantStatus,
};
export interface TenantModel {
    id?: string;
    name: string;
    iocs: IocCategory[];
    phone?: string;
    country?: string;
    city?: string;
    subscription?: boolean;
    postal_code?: string;
    verified?: boolean;
    user_quota?: number;
    status?: TenantStatus;
    licenses?: string[];
    quotaExceeded?: boolean;
    email?: string;
}
export interface User {
    username: string;
    email: string;
    role: string;
    status: 'active' | 'disable';
    subscription?: boolean;
    verificationDate: string;
    licenses?: string[] | null;
}
export interface TenantTeamModel {
    username: string;
    email: string;
    password: string;
    role: 'member' | 'analyst' | 'demo';
    status: 'active' | 'disable';
    subscription: boolean;
    licenses?: string[] | null;
    quotaExceeded?: boolean;
}
