export enum LicenseName {
    FREE = 'free',
    OSINT_BASIC = 'osint_basic',
    OSINT_ADVANCED = 'osint_advanced',
    PENTESTER = 'pentester',
    DATA_MANAGER = 'data_manager',
    ENTERPRISE = 'enterprise'
}


export interface LicenseRuleModel {
    modules: string[] | 'all';
    cti_graph: boolean;
    mapping: boolean;
    scanning: boolean;
    data_manager: boolean;
}