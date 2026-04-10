export type IocItem = Record<string, string>;
export interface IocExtractionResult {
    filename: string;
    file_type: string;
    extracted_text_length: number;
    iocs: IocItem[];
    status: string;
    original_filename: string;
    progress?: number;
    step?: string;
}
export interface GroupedIoc {
    name: string;
    total: number;
    items: {
        type: string;
        value: string;
        display: string;
        description: string;
    }[];
}
export interface ApkScanResult {
    package: string;
    version: string;
    sdk: {
        min: number;
        target: number;
    };
    signed: boolean;
    debuggable: boolean;
    certificate: {
        issuer: string;
        sha256: string;
    };
    permissions: {
        total: number;
        dangerous: number;
        dangerous_list: string[];
    };
    network: {
        urls_found: number;
        cleartext: boolean;
        sample_urls: string[];
    };
    crypto: {
        weak_algorithms: string[];
    };
    tampering: {
        suspected: boolean;
        reasons: string[];
    };
    status: string;
    original_filename: string;
}
export interface SummaryItem {
    label: string;
    value: string;
}
