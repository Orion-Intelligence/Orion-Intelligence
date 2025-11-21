export interface IocCategory {
    ioc_id: string;
    name: string;
    values: string[];
}

export interface TenantModel {
    companyName: string;
    iocs: IocCategory[];
}

export interface User {
    username: string;
    email: string;
    role: 'admin' | 'crawler' | 'demo' | 'profile';
    status: 'verification_pending' | 'onboarding' | 'active' | 'disable';
    subscription: boolean;
    verificationDate: string;
    licenses: string[];
}
