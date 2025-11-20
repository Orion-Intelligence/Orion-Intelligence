export enum LicenseName {
    FREE = 'free',
    OSINT_BASIC = 'osint_basic',
    OSINT_ADVANCED = 'osint_advanced',
    PENTESTER = 'pentester',
    ADMIN = 'admin',
    ENTERPRISE = 'enterprise'
}


export interface LicenseRuleModel {
    modules: string[] | 'all';
    cti_graph: boolean;
    mapping: boolean;
    scanning: boolean;
    admin: boolean;
}

export const LICENSE_RULES: Record<LicenseName, LicenseRuleModel> = {
    [LicenseName.FREE]: {
        modules: ['general'],
        cti_graph: false,
        mapping: false,
        scanning: false,
        admin: false,
    },

    [LicenseName.OSINT_BASIC]: {
        modules: ['general', 'breach', 'exploit', 'discussion', 'defacement', 'social', 'feed', 'dumps'],
        cti_graph: false,
        mapping: false,
        scanning: false,
        admin: false,
    },

    [LicenseName.OSINT_ADVANCED]: {
        modules: ['general', 'breach', 'exploit', 'discussion', 'defacement', 'social', 'feed', 'dumps', 'stealer_logs'],
        cti_graph: true,
        mapping: true,
        scanning: false,
        admin: false,
    },

    [LicenseName.PENTESTER]: {
        modules: [],
        cti_graph: false,
        mapping: false,
        scanning: true,
        admin: false,
    },

    [LicenseName.ADMIN]: {
        modules: [],
        cti_graph: false,
        mapping: false,
        scanning: false,
        admin: true,
    },

    [LicenseName.ENTERPRISE]: {
        modules: 'all',
        cti_graph: true,
        mapping: true,
        scanning: true,
        admin: true,
    }
};
