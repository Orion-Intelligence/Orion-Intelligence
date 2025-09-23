export interface IocCategory {
    ioc_id: string;
    name: string;
    values: string[];
}

export interface TenantModel {
    companyName: string;
    iocs: IocCategory[];
}
