
export interface TenantModel {
    id?: string;
    name: string;
    email: string;
    userStatus?: UserStatus;
    systemStatus?: SystemStatus;
    verificationToken?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface TenantCallbackModel {
    tenants: TenantModel[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export enum UserStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
    PENDING = 'Pending'
}

export enum SystemStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
    SUSPENDED = 'Suspended'
}