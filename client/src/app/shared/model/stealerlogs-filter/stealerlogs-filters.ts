export enum StealerlogsSearchFilters {
    ALL = 'm_search_all',
    DOMAIN = 'm_domain',
    USERNAME = 'm_username',
    IP = 'm_ip',
    CHANNEL = 'm_channel',
    FILE = 'm_file',
    EMAIL = 'm_email',
    CREDITCARD = 'm_creditcard'
}
export const StealerlogsSearchFilterLabels: Record<StealerlogsSearchFilters, string> = {
    [StealerlogsSearchFilters.ALL]: 'All',
    [StealerlogsSearchFilters.DOMAIN]: 'Domain',
    [StealerlogsSearchFilters.USERNAME]: 'Username',
    [StealerlogsSearchFilters.IP]: 'IP Address',
    [StealerlogsSearchFilters.CHANNEL]: 'Channel',
    [StealerlogsSearchFilters.FILE]: 'File Name',
    [StealerlogsSearchFilters.EMAIL]: 'Email',
    [StealerlogsSearchFilters.CREDITCARD]: 'Credit Card'
};
export interface StealerlogsAdvancedFilter {
    id: string;
    tag: StealerlogsSearchFilters;
    value: string;
    operator: '&&' | '||';
}
export interface PasswordSchemaFilter {
    minLength: number | null;
    maxLength: number | null;
    hasAlphabets: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
}
