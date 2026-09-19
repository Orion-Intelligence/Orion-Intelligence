export enum StealerlogsSearchFilters {
    ALL = 'm_search_all',
    DOMAIN = 'm_domain',
    USERNAME = 'm_username',
    IP = 'm_ip',
    CHANNEL = 'm_channel',
    FILE = 'm_file',
    EMAIL = 'm_email',
    PASSWORD = 'm_password',
    CREDITCARD = 'm_creditcard',
    FULLBIN = 'm_fullbin',
    COOKIE = 'm_cookie',
    PHONE = 'm_phone'
}
export const StealerlogsSearchFilterLabels: Record<StealerlogsSearchFilters, string> = {
  [StealerlogsSearchFilters.ALL]: 'All',
  [StealerlogsSearchFilters.DOMAIN]: 'Domain',
  [StealerlogsSearchFilters.USERNAME]: 'Username',
  [StealerlogsSearchFilters.IP]: 'IP Address',
  [StealerlogsSearchFilters.CHANNEL]: 'Channel',
  [StealerlogsSearchFilters.FILE]: 'File Name',
  [StealerlogsSearchFilters.EMAIL]: 'Email',
  [StealerlogsSearchFilters.PASSWORD]: 'Password',
  [StealerlogsSearchFilters.CREDITCARD]: 'Credit Card',
  [StealerlogsSearchFilters.FULLBIN]: 'Full BIN',
  [StealerlogsSearchFilters.COOKIE]: 'Cookies',
  [StealerlogsSearchFilters.PHONE]: 'Phone Number'
};
export interface PasswordSchemaFilter {
    minLength: number | null;
    maxLength: number | null;
    hasAlphabets: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
}
