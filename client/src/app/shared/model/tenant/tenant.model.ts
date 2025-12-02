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
  companyName: string;
  iocs: IocCategory[];
  phone?: string;
  country?: string;
  city?: string;
  postal_code?: string;
  verified?: boolean;
  user_quota?: number;
  status?: TenantStatus;
  licenses?: string[];
}

export interface TenantRequest {
  companyName: string;
  iocs: IocCategory[];
}

export interface User {
  username: string;
  email: string;
  role: 'admin' | 'crawler' | 'demo' | 'profile' | 'analyst';
  status: 'verification_pending' | 'onboarding' | 'active' | 'disable';
  subscription: boolean;
  verificationDate: string;
  licenses?: string[] | null;
}

export interface TenantTeamModel {
  username: string;
  email: string;
  password: string;
  role: 'profile' | 'analyst';
  status: 'verification_pending' | 'active' | 'disable';
  subscription: boolean;
  licenses?: string[] | null;
}
