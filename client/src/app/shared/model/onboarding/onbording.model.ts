export interface IocCategory {
    ioc_id: string;
    name: string;
    values: string[];
}

export interface OnboardingModel {
    companyName: string;
    iocs: IocCategory[];
}
