export interface IocCategory {
    id: string;
    name: string;
    values: string[];
}

export interface OnboardingModel {
    companyName: string;
    iocs: IocCategory[];
}
