export interface CompanyProfile {
    companyName: string;
    email: string;
    phone: number | null;
    country: string;
    city: string;
    postalCode: string;
    taxId: string;
    preferences?: {
        [key: string]: any;
    };
    alerts: AlertModel[];
    licenses: string[];
    assignedQuota: number;
    quotaExceeded:false
}

export interface AlertAllIoc {
    name: string;
    values: string[];
};

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
    content_types?: string[]
    status?: 'ignore' | 'active';
    first_seen?: Date;
    last_seen?: Date;
}
