export interface userSessionData {
    user: UserDataModel;
    tenant: TenantDataModel;
    alerts: AlertModel[];
}

export interface UserDataModel {
    email: string;
    twofa_enabled: boolean;
    username: string;
    role: string;
    status: string;
    subscription: boolean;
    verificationDate: string;
    license: string[];
    image?: string;
    preferences?: {
        [key: string]: any;
    };
}

export interface TenantDataModel {
    id: string;
    name: string;
    phone: string;
    country: string;
    city: string;
    postalCode: string;
    hasOnboarding: boolean;
    isDefault: boolean;
    taxId: string;
    userId: string;
    licenses: string[];
    assignedQuota: string;
    quotaExceeded: boolean;
    image?: string;
}

export interface userMetaData {
    username: string;
    twofa_enabled: boolean;
    preferences?: {
        [key: string]: any;
    };
}

export interface AlertAllIoc {
    name: string;
    values: string[];
}

export interface AlertModel {
    alert_id?: string;
    report_seen?: boolean;
    custom_alert?: boolean;
    type?: string;
    ioc_type?: string;
    ioc_value?: string;
    data_hash?: string;
    title?: string;
    description?: string;
    url?: string;
    source?: string;
    all_ioc?: AlertAllIoc[];
    content_types?: string[];
    status?: 'ignore' | 'active';
    first_seen?: Date;
    last_seen?: Date;
}
