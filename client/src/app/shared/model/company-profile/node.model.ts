export interface userSessionData {
    user: UserDataModel;
    tenant: TenantDataModel;
    alerts: AlertModel[];
    alert_summary?: AlertSummary;
}

export interface AlertSummary {
    unseen_total: number;
    counts_by_type: Record<string, number>;
    counts_by_risk: {
        critical: number;
        high: number;
        medium: number;
        low: number;
    };
}
export interface UserDataModel {
    email: string;
    theme?: 'dark-theme' | 'light-theme';
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
    demo_tour: boolean;
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
    username: string|undefined;
    twofa_enabled: boolean|undefined;
    theme?: 'dark-theme' | 'light-theme'|undefined;
    preferences?: {
        theme?: 'dark-theme' | 'light-theme'|undefined;
        [key: string]: any;
    };
    demo_tour:boolean|undefined;
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
