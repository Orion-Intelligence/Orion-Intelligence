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
}